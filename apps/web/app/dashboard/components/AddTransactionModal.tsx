"use client";

/**
 * AddTransactionModal Component
 * Intent-first, conversational design: Single intent selection → Essential fields → Optional controls
 */

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, Sparkles, Briefcase, User, RefreshCw, Loader2, Check, ArrowRight, RotateCcw, Receipt, Trash2, AlertTriangle, ChevronDown, Info } from "lucide-react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ReceiptUploadModal } from "./ReceiptUploadModal";
import { ReceiptsGallery } from "./ReceiptsGallery";
import { DateSelector } from "./DateSelector";
import { CategorySelector } from "./CategorySelector";
import { ReceiptPreview } from "./ReceiptPreview";
import { AccountingPreview } from "./AccountingPreview";
import { TransactionEmptyState } from "./TransactionEmptyStates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/lib/use-toast";

interface AddTransactionModalProps {
  onClose: () => void;
}

interface LineItem {
  id: string;
  description: string;
  category: string;
  amount: string;
  tax: string;
  tip: string;
  debitAccountId?: string;
  creditAccountId?: string;
}

export function AddTransactionModal({ onClose }: AddTransactionModalProps) {
  // Intent-First Design: Single selection that combines type + business
  type TransactionIntent = "business_expense" | "personal_expense" | "business_income" | "personal_income" | null;
  
  // Always start with intent selection (progressive reveal)
  // We'll remember the choice for "Save & Add Another" flow, but always show selection first
  const [intent, setIntent] = useState<TransactionIntent>(null);
  
  // Track if user frequently uses itemization
  const [frequentlyItemizes, setFrequentlyItemizes] = useState(false);
  
  // Derived states from intent
  const transactionType = intent?.includes("income") ? "income" : intent?.includes("expense") ? "expense" : null;
  const isBusiness = intent?.includes("business") ? true : intent?.includes("personal") ? false : null;
  
  // Itemization state (replaces "advanced mode")
  const [showItemization, setShowItemization] = useState(false);
  
  // Advanced flyout state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Progressive reveal state
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  
  // Legacy entryMode for backward compatibility with existing code
  const entryMode = showItemization ? "advanced" : "simple";
  
  // Step 3: Full form (revealed after business/personal)
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  
  // Double entry accounts for simple mode
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  
  // Advanced mode: Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [aiModalDescription, setAiModalDescription] = useState("");
  const [lineItemAILoading, setLineItemAILoading] = useState<Record<string, boolean>>({});
  const [lineItemAISuggestions, setLineItemAISuggestions] = useState<Record<string, any[]>>({});
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState<Id<"transactions_raw"> | null>(null);
  
  // Conversational optional controls
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAccountingPreview, setShowAccountingPreview] = useState(false);
  
  // AI suggestion state for category
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<string | undefined>();
  const [aiCategoryConfidence, setAiCategoryConfidence] = useState<number | undefined>();
  
  // Receipt OCR state
  const [receiptOCRData, setReceiptOCRData] = useState<any>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [autoPopulatedFromReceipt, setAutoPopulatedFromReceipt] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<Array<{ url: string; ocrData?: any }>>([]);
  
  // Split transaction state
  const [showSplitPrompt, setShowSplitPrompt] = useState(false);
  const [splitSuggestions, setSplitSuggestions] = useState<any[] | null>(null);
  const [isLoadingSplit, setIsLoadingSplit] = useState(false);
  const [showSplitInfoModal, setShowSplitInfoModal] = useState(false);
  
  // Tax & Compliance state
  const [taxRate, setTaxRate] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [taxExemptReason, setTaxExemptReason] = useState("");
  const [track1099, setTrack1099] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const createTransaction = useMutation(api.transactions.createRaw);
  const processTransaction = useMutation(api.transactions.processTransaction);
  const generateAISuggestions = useAction(api.ai_entries.generateAISuggestions);
  const processReceiptOCR = useAction(api.receipt_ocr.processReceiptOCR);
  const suggestSplit = useAction(api.split_suggestions.suggestSplit);
  const addCustomCategory = useMutation(api.users.addCustomCategory);
  const saveCorrection = useMutation(api.knowledge_base.saveCorrection);
  const userAccounts = useQuery(api.accounts.getAll);
  const { toast } = useToast();
  
  // Duplicate detection
  const duplicateMatch = useQuery(
    api.duplicate_detection.findDuplicates,
    title.trim().length >= 3 && amount && transactionType !== null && isBusiness !== null
      ? {
          merchant: title,
          amount: parseFloat(amount) || 0,
          date: date,
        }
      : "skip"
  );
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  
  // Query receipts for the created transaction
  const receipts = useQuery(
    api.transactions.getReceiptsByTransaction,
    createdTransactionId ? { transactionId: createdTransactionId } : "skip"
  );

  // Check for OCR data in receipts and auto-populate
  useEffect(() => {
    const allReceipts = receipts || uploadedReceipts;
    if (allReceipts && allReceipts.length > 0 && !autoPopulatedFromReceipt && transactionType !== null && isBusiness !== null) {
      const receiptWithOCR = allReceipts.find((r: any) => r.ocrData);
      if (receiptWithOCR && receiptWithOCR.ocrData) {
        const ocrData = receiptWithOCR.ocrData;
        setReceiptOCRData(ocrData);
        
        // Auto-populate fields with subtle animation trigger
        if (ocrData.merchant && !title) {
          setTitle(ocrData.merchant);
          // Trigger pulse animation on field
          setTimeout(() => {
            const input = document.querySelector('input[type="text"][value="' + ocrData.merchant + '"]') as HTMLElement;
            if (input) {
              input.classList.add('animate-pulse');
              setTimeout(() => input.classList.remove('animate-pulse'), 1000);
            }
          }, 100);
        }
        if (ocrData.amount !== undefined && !amount) {
          setAmount(ocrData.amount.toFixed(2));
        }
        if (ocrData.date && !date) {
          setDate(ocrData.date);
        }
        
        setAutoPopulatedFromReceipt(true);
      }
    }
  }, [receipts, uploadedReceipts, autoPopulatedFromReceipt, transactionType, isBusiness, title, amount, date]);

  // Track field completion for progressive reveals
  useEffect(() => {
    if (!intent) {
      setCompletedFields(new Set());
      return;
    }

    const newCompleted = new Set(completedFields);

    // Where field: complete when title has 3+ characters
    if (title.length >= 3) {
      newCompleted.add('where');
    } else {
      newCompleted.delete('where');
    }

    // Amount field: complete when valid number > 0
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && amountNum > 0) {
      newCompleted.add('amount');
    } else {
      newCompleted.delete('amount');
    }

    // When field: complete when date is valid
    if (date) {
      newCompleted.add('when');
    } else {
      newCompleted.delete('when');
    }

    // Category field: complete when category is selected
    if (category && category.trim().length > 0) {
      newCompleted.add('category');
    } else {
      newCompleted.delete('category');
    }

    setCompletedFields(newCompleted);
  }, [title, amount, date, category, intent]);

  // Auto-trigger AI suggestions when core fields are filled
  // AI is now only triggered manually by user clicking the AI button
  // Removed automatic trigger - user must explicitly request AI suggestions

  // Check for split transaction opportunity
  useEffect(() => {
    // Reset split prompt when key fields change significantly (new transaction)
    if (!title || !amount) {
      setShowSplitPrompt(false);
      return;
    }

    // Only suggest if we have the required fields, it's an expense, not already itemized, and haven't shown suggestions yet
    if (!showItemization && title && amount && transactionType === "expense" && !splitSuggestions) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return;
      }

      const titleLower = title.toLowerCase();
      const shouldSuggestSplit = 
        amountNum > 200 || 
        titleLower.includes("costco") ||
        titleLower.includes("amazon") ||
        titleLower.includes("target") ||
        titleLower.includes("walmart") ||
        titleLower.includes("sam's club") ||
        titleLower.includes("sams club");
      
      // Show prompt if conditions are met
      if (shouldSuggestSplit) {
        setShowSplitPrompt(true);
      } else {
        setShowSplitPrompt(false);
      }
    } else if (showItemization || splitSuggestions) {
      // Hide prompt if user switched to itemization or already got suggestions
      setShowSplitPrompt(false);
    }
  }, [showItemization, title, amount, transactionType, splitSuggestions]);

  // Handle split suggestion
  const handleSplitSuggestion = async () => {
    if (!title || !amount) {
      toast({
        title: "Missing information",
        description: "Please enter a merchant name and amount first.",
      });
      return;
    }
    
    setIsLoadingSplit(true);
    setShowSplitPrompt(false); // Hide prompt immediately
    
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount");
      }
      
      // Get receipt items if available
      const receiptItems = receiptOCRData?.items;
      
      // Always enable itemization mode first
      handleItemizationToggle(true);
      
      // Try to get AI suggestions
      try {
        const result = await suggestSplit({
          merchant: title,
          amount: transactionType === "income" ? amountNum : -amountNum,
          receiptItems: receiptItems,
        });
        
        if (result && result.suggestions && result.suggestions.length > 0) {
          // Use AI suggestions
          setSplitSuggestions(result.suggestions);
          setLineItems(result.suggestions.map((suggestion: any, index: number) => ({
            id: Date.now().toString() + index,
            description: suggestion.description || "Item",
            category: suggestion.category || category || "Other",
            amount: Math.abs(suggestion.amount || 0).toFixed(2),
            tax: "",
            tip: "",
          })));
          
          toast({
            title: "Transaction split",
            description: `Split into ${result.suggestions.length} categories. You can adjust the amounts and categories.`,
          });
        } else {
          // Fallback: create a simple split
          throw new Error("No suggestions returned");
        }
      } catch (suggestionError) {
        // Fallback: Create a basic split manually
        console.log("AI suggestions failed, using fallback:", suggestionError);
        
        const totalAmount = amountNum;
        // Create 2-3 line items as a starting point
        const numItems = totalAmount > 500 ? 3 : 2;
        const baseAmount = totalAmount / numItems;
        
        const fallbackItems = Array.from({ length: numItems }, (_, index) => ({
          id: Date.now().toString() + index,
          description: index === 0 ? title : `Item ${index + 1}`,
          category: index === 0 && category ? category : "Other",
          amount: index === numItems - 1 
            ? (totalAmount - (baseAmount * (numItems - 1))).toFixed(2) // Last item gets remainder
            : baseAmount.toFixed(2),
          tax: "",
          tip: "",
        }));
        
        setLineItems(fallbackItems);
        setSplitSuggestions(null);
        
        toast({
          title: "Itemization enabled",
          description: "Split into multiple items. Adjust the amounts and categories as needed.",
        });
      }
    } catch (error: any) {
      console.error("Failed to split transaction:", error);
      // Even on error, enable itemization so user can manually split
      handleItemizationToggle(true);
      
      // Create at least one line item with the current data
      if (lineItems.length === 0) {
        setLineItems([{
          id: Date.now().toString(),
          description: title,
          category: category || "Other",
          amount: amount,
          tax: "",
          tip: "",
        }]);
      }
      
      toast({
        title: "Itemization enabled",
        description: "You can now manually split this transaction into multiple items.",
      });
    } finally {
      setIsLoadingSplit(false);
    }
  };
  
  // Query for similar transactions when title changes
  const similarTransactions = useQuery(
    api.transactions.findSimilarTransactions,
    title.trim().length >= 3 && transactionType !== null && isBusiness !== null
      ? { merchant: title, description: title, limit: 1 }
      : "skip"
  );

  // Detect if user frequently itemizes (check localStorage preference)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const itemizationPreference = localStorage.getItem("frequentlyItemizes");
      if (itemizationPreference === "true") {
        setFrequentlyItemizes(true);
      }
    }
  }, []);

  // Update itemization preference when user toggles
  useEffect(() => {
    if (typeof window !== "undefined" && showItemization) {
      // User is itemizing, mark as frequent user
      localStorage.setItem("frequentlyItemizes", "true");
      setFrequentlyItemizes(true);
    }
  }, [showItemization]);

  // Enhanced auto-populate fields from similar transaction
  useEffect(() => {
    if (similarTransactions && similarTransactions.length > 0 && !autoPopulated && !useAI && transactionType !== null && isBusiness !== null) {
      const similar = similarTransactions[0];
      
      // Smart category auto-population with conversational feedback
      if (!category) {
        if (similar.category && similar.category.length > 0) {
          setCategory(similar.category[0]);
        } else if (similar.categoryName) {
          setCategory(similar.categoryName);
        } else if (similar.merchant && similar.merchant.length > 2) {
          const merchant = similar.merchant.trim();
          if (merchant.length <= 30 && /^[A-Za-z0-9\s&.,'-]+$/.test(merchant)) {
            setCategory(merchant);
          }
        } else if (similar.merchantName) {
          setCategory(similar.merchantName);
        }
      }

      // Auto-suggest itemization if similar transaction was itemized
      if (similar.entryMode === "advanced" || (similar.lineItems && similar.lineItems.length > 0)) {
        // Don't auto-enable, but could show a hint
      }

      setAutoPopulated(true);
    }
  }, [similarTransactions, autoPopulated, useAI, category, transactionType, isBusiness, title]);

  // Reset auto-populated flag when title changes significantly
  useEffect(() => {
    if (title.length < 3) {
      setAutoPopulated(false);
    }
  }, [title]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const form = document.getElementById("transaction-form") as HTMLFormElement;
        form?.requestSubmit();
      }
      
      // Cmd/Ctrl + Enter: Save & Add Another
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setSaveAndAddAnother(true);
        const form = document.getElementById("transaction-form") as HTMLFormElement;
        form?.requestSubmit();
      }
      
      // Esc: Close
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle intent selection with localStorage persistence
  const handleIntentSelect = (selectedIntent: TransactionIntent) => {
    setIntent(selectedIntent);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastTransactionIntent", selectedIntent || "");
    }
  };

  // Handle itemization toggle (replaces mode switching)
  const handleItemizationToggle = (show: boolean) => {
    if (show) {
      // Switching to itemization: create initial line item from current data
      if (title && amount && category && lineItems.length === 0) {
        setLineItems([{
          id: Date.now().toString(),
          description: title,
          category: category,
          amount: amount,
          tax: "",
          tip: "",
        }]);
      }
      setShowItemization(true);
    } else {
      // Switching from itemization: keep total amount, drop line items
      if (lineItems.length > 0) {
        const total = lineItems.reduce((sum: number, item: any) => {
          const itemAmount = parseFloat(item.amount) || 0;
          const itemTax = parseFloat(item.tax) || 0;
          const itemTip = parseFloat(item.tip) || 0;
          return sum + itemAmount + itemTax + itemTip;
        }, 0);
        setAmount(total.toFixed(2));
        // Use first line item's category if available
        if (lineItems[0]?.category) {
          setCategory(lineItems[0].category);
        }
        setLineItems([]);
      }
      setShowItemization(false);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title) {
      newErrors.title = "Where did you spend this?";
    }
    
    if (!amount) {
      newErrors.amount = "How much was the total?";
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Please enter an amount greater than $0.00";
      }
    }
    
    if (!date) {
      newErrors.date = "What day did this happen?";
    } else {
      const dateObj = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (dateObj > thirtyDaysFromNow) {
        newErrors.date = "This date seems to be in the future—mind double-checking?";
      }
    }
    
    if (!showItemization && !category) {
      newErrors.category = "Want help choosing a category?";
    }

    // Itemization validation
    if (showItemization) {
      if (lineItems.length === 0) {
        newErrors.lineItems = "Please add at least one line item to itemize this receipt.";
      } else {
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i];
        if (!item.description.trim()) {
            newErrors[`lineItem_${i}_description`] = "All line items must have a description.";
        }
        const itemAmount = parseFloat(item.amount);
        if (isNaN(itemAmount) || itemAmount <= 0) {
            newErrors[`lineItem_${i}_amount`] = "All line items must have a valid amount greater than 0.";
          }
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!title || !amount || transactionType === null || isBusiness === null) return;

    setIsSubmitting(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) return;

      if (!userAccounts || userAccounts.length === 0) {
        throw new Error("No accounts found. Please connect a bank account first.");
      }

      const defaultAccount = userAccounts[0];

      // Always use AI if category is provided or user triggered it
      const shouldUseAI = useAI || !similarTransactions || similarTransactions.length === 0 || !!category;

      // Prepare line items for itemization
      const formattedLineItems = showItemization && lineItems.length > 0
        ? lineItems.map((item: any) => ({
            description: item.description.trim(),
            category: item.category.trim() || undefined,
            amount: parseFloat(item.amount) || 0,
            tax: item.tax ? parseFloat(item.tax) : undefined,
            tip: item.tip ? parseFloat(item.tip) : undefined,
            debitAccountId: item.debitAccountId ? item.debitAccountId as Id<"accounts"> : undefined,
            creditAccountId: item.creditAccountId ? item.creditAccountId as Id<"accounts"> : undefined,
          }))
        : undefined;

      // Combine title and description for transaction description
      const fullDescription = description 
        ? `${title}. ${description}`
        : title;

      // Save to knowledge base if user made corrections
      if (useAI && (aiSuggestedCategory || debitAccountId || creditAccountId)) {
        try {
          // Check if user changed category from AI suggestion
          const categoryChanged = aiSuggestedCategory && category !== aiSuggestedCategory;
          // Check if user changed accounts from AI suggestion
          const accountsChanged = (debitAccountId && creditAccountId) && 
            (debitAccountId !== aiSuggestions?.[0]?.debitAccountId || 
             creditAccountId !== aiSuggestions?.[0]?.creditAccountId);
          
          if (categoryChanged || accountsChanged || description) {
            await saveCorrection({
              merchant: title,
              description: fullDescription,
              originalCategory: aiSuggestedCategory,
              correctedCategory: category || aiSuggestedCategory || "",
              originalDebitAccountId: aiSuggestions?.[0]?.debitAccountId ? aiSuggestions[0].debitAccountId as Id<"accounts"> : undefined,
              correctedDebitAccountId: debitAccountId ? debitAccountId as Id<"accounts"> : undefined,
              originalCreditAccountId: aiSuggestions?.[0]?.creditAccountId ? aiSuggestions[0].creditAccountId as Id<"accounts"> : undefined,
              correctedCreditAccountId: creditAccountId ? creditAccountId as Id<"accounts"> : undefined,
              userDescription: description || undefined,
              transactionType: transactionType,
              isBusiness: isBusiness ?? false,
              confidence: aiCategoryConfidence,
            });
          }
        } catch (error) {
          console.error("Failed to save correction to knowledge base:", error);
          // Don't block transaction creation if knowledge base save fails
        }
      }

      // Create the transaction
      const transactionId = await createTransaction({
        accountId: defaultAccount._id,
        amount: transactionType === "income" ? amountNum : -amountNum,
        date: new Date(date).toISOString().split("T")[0],
        description: fullDescription,
        merchant: category || undefined,
        isPending: false,
        isBusiness: isBusiness ?? undefined,
        entryMode: showItemization ? "advanced" : "simple",
        debitAccountId: debitAccountId ? debitAccountId as Id<"accounts"> : undefined,
        creditAccountId: creditAccountId ? creditAccountId as Id<"accounts"> : undefined,
        lineItems: formattedLineItems,
      });

      // Store transactionId for receipt display
      setCreatedTransactionId(transactionId);

      // Process transaction to generate AI suggestions (only if needed)
      if (shouldUseAI) {
        try {
          await processTransaction({ transactionId });
        } catch (error) {
          console.error("Failed to generate AI suggestions:", error);
        }
      }

      // Show minimal success indicator
      setShowSaveSuccess(true);
      
      // Show success toast
      toast({
        title: "Transaction saved",
        description: "Your transaction has been recorded successfully.",
      });

      // Handle "Save & Add Another"
      if (saveAndAddAnother) {
        // Reset success indicator after a brief moment
        setTimeout(() => setShowSaveSuccess(false), 2000);
        // Clear form but keep modal open
        setTitle("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setCategory("");
        setDescription("");
        setNote("");
        setDebitAccountId("");
        setCreditAccountId("");
        setLineItems([]);
        setErrors({});
        setAutoPopulated(false);
        setAutoPopulatedFromReceipt(false);
        setDuplicateDismissed(false);
        setShowSplitPrompt(false);
        setSplitSuggestions(null);
        setShowItemization(false); // Reset itemization for new transaction
        setCompletedFields(new Set()); // Reset progressive reveal
        // Keep intent (transaction type and business/personal)
        setSaveAndAddAnother(false);
      } else {
        // Don't close modal if receipts were uploaded - let user see them
        if (!showReceiptUpload) {
          // Show success indicator briefly before closing
          setTimeout(() => {
            onClose();
            resetForm();
            setShowSaveSuccess(false);
          }, 800); // Brief delay to show success state
        } else {
          // Reset success indicator after showing
          setTimeout(() => setShowSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error("Failed to create transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIntent(null);
    setShowItemization(false);
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("");
    setDescription("");
    setNote("");
    setDebitAccountId("");
    setCreditAccountId("");
    setLineItems([]);
    setUseAI(false);
    setAutoPopulated(false);
    setAiSuggestions(null);
    setIsAILoading(false);
    setLineItemAILoading({});
    setLineItemAISuggestions({});
    setCreatedTransactionId(null);
    setShowReceiptUpload(false);
    setShowMoreDetails(false);
    setShowAccountingPreview(false);
    setCompletedFields(new Set());
    setAiModalDescription("");
    setShowSaveSuccess(false);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      description: "",
      category: "",
      amount: "",
      tax: "",
      tip: "",
      debitAccountId: "",
      creditAccountId: "",
    }]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item: any) => item.id !== id));
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map((item: any) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Calculate line items total
  const lineItemsTotal = useMemo(() => {
    return lineItems.reduce((sum: number, item: any) => {
      const itemAmount = parseFloat(item.amount) || 0;
      const itemTax = parseFloat(item.tax) || 0;
      const itemTip = parseFloat(item.tip) || 0;
      return sum + itemAmount + itemTax + itemTip;
    }, 0);
  }, [lineItems]);

  // Check if line items total matches transaction total
  const totalAmount = parseFloat(amount) || 0;
  const totalsMatch = Math.abs(lineItemsTotal - totalAmount) < 0.01;
  const totalsDifference = Math.abs(lineItemsTotal - totalAmount);

  // Handle AI suggestions specifically for double entry accounts
  const handleDoubleEntryAI = async () => {
    if (!title || !amount || transactionType === null || isBusiness === null) {
      toast({
        title: "Complete required fields",
        description: "Please enter the transaction details before using AI for accounts.",
      });
      return;
    }

    setIsAILoading(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount before using AI suggestions.",
        });
        setIsAILoading(false);
        return;
      }

      const result = await generateAISuggestions({
        description: title,
        amount: transactionType === "income" ? amountNum : -amountNum,
        date: new Date(date).toISOString().split("T")[0],
        merchant: title,
        category: category || undefined,
        isBusiness: isBusiness ?? undefined,
      });

      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions[0];
        setDebitAccountId(suggestion.debitAccountId || "");
        setCreditAccountId(suggestion.creditAccountId || "");
        setUseAI(true);
        toast({
          title: "AI accounts suggested",
          description: "Double entry accounts have been suggested. Review and adjust as needed.",
        });
      } else {
        toast({
          title: "No suggestions",
          description: "AI couldn't generate account suggestions. Please select accounts manually.",
        });
      }
    } catch (error) {
      console.error("Failed to generate AI suggestions for double entry:", error);
      toast({
        title: "AI suggestion failed",
        description: "Could not generate account suggestions. Please try again or select manually.",
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleManualAITrigger = async (overrideDebitAccountId?: string, overrideCreditAccountId?: string, isAutoTrigger = false) => {
    if (!title || !amount || transactionType === null || isBusiness === null) {
      if (!isAutoTrigger) {
        alert("Please complete all required fields before using AI suggestions.");
      }
      return;
    }

    setIsAILoading(true);
    setUseAI(true);
    setAutoPopulated(false);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        setIsAILoading(false);
        return;
      }

      // Use description from main form or AI modal, prioritizing AI modal if it has content
      const userDescription = aiModalDescription || description || undefined;

      const result = await generateAISuggestions({
        description: title,
        amount: transactionType === "income" ? amountNum : -amountNum,
        date: new Date(date).toISOString().split("T")[0],
        merchant: category || undefined,
        category: category || undefined,
        isBusiness: isBusiness ?? undefined,
        overrideDebitAccountId: overrideDebitAccountId,
        overrideCreditAccountId: overrideCreditAccountId,
        userDescription: userDescription,
      });

      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions[0]; // Use first suggestion for auto-apply
        setAiSuggestions(result.suggestions);
        
        // Auto-apply the first suggestion if this is an auto-trigger
        if (isAutoTrigger && suggestion) {
          setCategory(suggestion.category);
          setDebitAccountId(suggestion.debitAccountId || "");
          setCreditAccountId(suggestion.creditAccountId || "");
          setAiSuggestedCategory(suggestion.category);
          setAiCategoryConfidence(suggestion.confidence);
          // Don't show modal for auto-trigger, just apply silently
        } else {
          // For manual trigger, show the modal
          // Modal will be shown via aiSuggestions state
        }
        
        // Clear AI modal description after successful regeneration
        if (aiModalDescription) {
          setAiModalDescription("");
        }
      }
    } catch (error) {
      console.error("Failed to generate AI suggestions:", error);
      if (!isAutoTrigger) {
        alert("Failed to generate AI suggestions. Please try again.");
      }
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    // Debug: Log the suggestion to help diagnose issues
    console.log("Applying AI suggestion:", {
      category: suggestion.category,
      debitAccountId: suggestion.debitAccountId,
      creditAccountId: suggestion.creditAccountId,
      debitAccountName: suggestion.debitAccountName,
      creditAccountName: suggestion.creditAccountName,
      isBusiness: suggestion.isBusiness,
      fullSuggestion: suggestion
    });
    
    // If this is a new category, show confirmation and save it
    if (suggestion.isNewCategory) {
      const confirmed = window.confirm(
        `Create new category "${suggestion.category}"? This category will be saved for future use.`
      );
      if (!confirmed) {
        return; // User cancelled, don't apply the suggestion
      }
      
      // Save category to user's category list
      try {
        await addCustomCategory({ category: suggestion.category });
        toast({
          title: "Category saved",
          description: `"${suggestion.category}" has been added to your categories.`,
        });
      } catch (error) {
        console.error("Failed to save category:", error);
        // Continue anyway - category will still be used for this transaction
      }
    }
    
    // Apply all suggestion values
    if (suggestion.category) {
      setCategory(suggestion.category);
    }
    
    // Update intent based on suggestion if provided
    if (suggestion.isBusiness !== undefined) {
      const newIntent = suggestion.isBusiness 
        ? (transactionType === "income" ? "business_income" : "business_expense")
        : (transactionType === "income" ? "personal_income" : "personal_expense");
      setIntent(newIntent);
    }
    
    // Apply double entry accounts - ensure they're strings and valid
    // Handle both account IDs and account names (lookup by name if needed)
    let appliedDebitId = "";
    let appliedCreditId = "";
    
    if (suggestion.debitAccountId) {
      const debitId = String(suggestion.debitAccountId);
      // Verify the account exists in userAccounts
      const debitAccount = userAccounts?.find((a: any) => a._id === debitId);
      if (debitAccount) {
        appliedDebitId = debitId;
        setDebitAccountId(debitId);
      } else {
        // Try to find by name if ID doesn't match
        const debitByName = userAccounts?.find((a: any) => 
          a.name === suggestion.debitAccountName || 
          a.name === suggestion.debitAccount
        );
        if (debitByName) {
          appliedDebitId = debitByName._id;
          setDebitAccountId(debitByName._id);
        } else {
          console.warn("Debit account not found:", suggestion.debitAccountId, suggestion.debitAccountName);
        }
      }
    }
    
    if (suggestion.creditAccountId) {
      const creditId = String(suggestion.creditAccountId);
      // Verify the account exists in userAccounts
      const creditAccount = userAccounts?.find((a: any) => a._id === creditId);
      if (creditAccount) {
        appliedCreditId = creditId;
        setCreditAccountId(creditId);
      } else {
        // Try to find by name if ID doesn't match
        const creditByName = userAccounts?.find((a: any) => 
          a.name === suggestion.creditAccountName || 
          a.name === suggestion.creditAccount
        );
        if (creditByName) {
          appliedCreditId = creditByName._id;
          setCreditAccountId(creditByName._id);
        } else {
          console.warn("Credit account not found:", suggestion.creditAccountId, suggestion.creditAccountName);
        }
      }
    }
    
    // Store AI suggestion metadata
    setAiSuggestedCategory(suggestion.category);
    setAiCategoryConfidence(suggestion.confidence);
    setUseAI(true);
    
    // Close the AI suggestions modal
    setAiSuggestions(null);
    setAiModalDescription("");
    
    // Show success feedback
    const appliedFields = [];
    if (suggestion.category) appliedFields.push("category");
    if (appliedDebitId) appliedFields.push("debit account");
    if (appliedCreditId) appliedFields.push("credit account");
    
    toast({
      title: "Suggestion applied",
      description: appliedFields.length > 0 
        ? `Updated: ${appliedFields.join(", ")}`
        : "Suggestion applied successfully",
    });
    
    // Ensure accounting preview is visible if accounts were set
    if (appliedDebitId && appliedCreditId) {
      setShowAccountingPreview(true);
    }
    
    // Force a re-render to ensure form fields update
    // This ensures React picks up the state changes
    setTimeout(() => {
      // Trigger a small state update to force re-render
      setCompletedFields(prev => new Set(prev));
    }, 100);
  };

  // Handle AI suggestions for individual line items
  const handleLineItemAI = async (lineItemId: string, isAutoTrigger = false) => {
    const item = lineItems.find(i => i.id === lineItemId);
    if (!item || !item.description || !item.amount) {
      if (!isAutoTrigger) {
        alert("Please enter description and amount for this line item first.");
      }
      return;
    }

    setLineItemAILoading(prev => ({ ...prev, [lineItemId]: true }));

    try {
      const amountNum = parseFloat(item.amount);
      if (isNaN(amountNum)) {
        setLineItemAILoading(prev => ({ ...prev, [lineItemId]: false }));
        return;
      }

      const result = await generateAISuggestions({
        description: item.description,
        amount: transactionType === "income" ? amountNum : -amountNum,
        date: new Date(date).toISOString().split("T")[0],
        merchant: item.category || undefined,
        category: item.category || undefined,
        isBusiness: isBusiness ?? undefined,
      });

      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions[0]; // Use first suggestion
        updateLineItem(lineItemId, "category", suggestion.category || "");
        updateLineItem(lineItemId, "debitAccountId", suggestion.debitAccountId || "");
        updateLineItem(lineItemId, "creditAccountId", suggestion.creditAccountId || "");
        setLineItemAISuggestions(prev => ({ ...prev, [lineItemId]: result.suggestions }));
        
        // Show toast for auto-trigger
        if (isAutoTrigger) {
          toast({
            title: "AI suggestion applied",
            description: `Category "${suggestion.category}" suggested for this item.`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate AI suggestions for line item:", error);
      if (!isAutoTrigger) {
        alert("Failed to generate AI suggestions. Please try again.");
      }
    } finally {
      setLineItemAILoading(prev => ({ ...prev, [lineItemId]: false }));
    }
  };

  // Auto-trigger AI for line items when description and amount are filled
  useEffect(() => {
    if (!showItemization || lineItems.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];
    lineItems.forEach((item) => {
      // Auto-trigger if description has 3+ chars and amount is valid
      if (
        item.description.length >= 3 &&
        item.amount &&
        parseFloat(item.amount) > 0 &&
        !lineItemAILoading[item.id] &&
        !lineItemAISuggestions[item.id]
      ) {
        // Use a small delay to avoid race conditions
        const timeoutId = setTimeout(() => {
          handleLineItemAI(item.id, true);
        }, 300);
        timeouts.push(timeoutId);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItems, showItemization]);

  const hasSimilarTransaction = similarTransactions && similarTransactions.length > 0;
  // Button appears when title is 3+ chars, but only enabled when amount is valid
  const showAIButton = transactionType !== null && isBusiness !== null && title.length >= 3;
  // Check if amount is a valid number > 0
  const amountNum = amount ? parseFloat(amount) : 0;
  const hasValidAmount = !isNaN(amountNum) && amountNum > 0;
  const canUseAI = showAIButton && hasValidAmount;

  return (
    <>
      {/* Loading Overlay */}
      {isAILoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  AI is thinking...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing your transaction and generating suggestions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">AI Suggestions</h2>
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <div className="relative group">
                  <button
                    onClick={() => handleManualAITrigger()}
                    disabled={isAILoading}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      "text-muted-foreground hover:text-foreground hover:bg-muted",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Generate another suggestion"
                  >
                    {isAILoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Generate another suggestion
                  </div>
                </div>
                <button
                  onClick={() => setAiSuggestions(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {aiSuggestions.length > 1 
                ? "Select the suggestion that best matches your transaction:"
                : "AI suggestion for your transaction:"}
            </p>

            <div className="space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium",
                          suggestion.isBusiness
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        )}>
                          {suggestion.isBusiness ? "Business" : "Personal"}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          Suggested Category: {suggestion.category}
                        </span>
                        {suggestion.isNewCategory && (
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium"
                            title="This is a new category not in your default list"
                          >
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {suggestion.explanation}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </div>
                  </div>

                  {/* Description Field for Feedback - Per plan spec */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Not quite right? Describe what this transaction is:
                    </label>
                    <textarea
                      value={aiModalDescription}
                      onChange={(e) => setAiModalDescription(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs resize-none"
                      placeholder="e.g., This was actually a business meal with a client..."
                    />
                    {aiModalDescription && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManualAITrigger(undefined, undefined);
                        }}
                        disabled={isAILoading}
                        className="mt-2 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Regenerate with description
                      </button>
                    )}
                  </div>

                  {/* Double-Entry Preview - Show prominently with category */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Debit:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {suggestion.debitAccountName}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualAITrigger(undefined, suggestion.creditAccountId);
                          }}
                          disabled={isAILoading}
                          className="p-1 rounded hover:bg-muted transition-colors group relative"
                          title="Get alternative debit account suggestion"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Credit:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {suggestion.creditAccountName}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualAITrigger(suggestion.debitAccountId, undefined);
                          }}
                          disabled={isAILoading}
                          className="p-1 rounded hover:bg-muted transition-colors group relative"
                          title="Get alternative credit account suggestion"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <span className="text-base font-bold text-foreground">
                          ${suggestion.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSuggestion(suggestion);
                    }}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Use This Suggestion
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setAiSuggestions(null)}
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        <div 
          className={cn(
            "bg-white w-full h-full md:h-auto md:max-h-[90vh]",
            "md:max-w-[800px] md:rounded-2xl",
            "flex flex-col overflow-hidden md:overflow-y-auto",
            "animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200",
            "md:pt-6 md:px-7 md:pb-5",
            "p-6",
            isAILoading && "opacity-50 pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h2 id="transaction-modal-title" className="text-lg font-semibold text-slate-900">Add Transaction</h2>
              {intent !== null && (
                <button
                  type="button"
                  onClick={() => setIntent(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
                  title="Change transaction type"
                >
                  Change
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Intent Selection - Single Question */}
          {intent === null && (
            <div className="mb-6 space-y-3 animate-in fade-in duration-200">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">
                What kind of transaction are you adding?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                Let's get this done together.
              </p>
              {/* Show subtle hint if we have a last intent preference */}
              {typeof window !== "undefined" && localStorage.getItem("lastTransactionIntent") && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">
                  💡 Tip: We'll remember your choice for next time
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleIntentSelect("business_expense")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
                    "hover:scale-105 hover:shadow-md",
                    intent === "business_expense"
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/50"
                  )}
                >
                  <Briefcase className="w-6 h-6" />
                  <span className="font-medium text-base">Business Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIntentSelect("personal_expense")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
                    "hover:scale-105 hover:shadow-md",
                    intent === "personal_expense"
                      ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-500/50"
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="font-medium text-base">Personal Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIntentSelect("business_income")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
                    "hover:scale-105 hover:shadow-md",
                    intent === "business_income"
                      ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 shadow-md scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-green-500/50"
                  )}
                >
                  <Briefcase className="w-6 h-6" />
                  <span className="font-medium text-base">Business Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIntentSelect("personal_income")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
                    "hover:scale-105 hover:shadow-md",
                    intent === "personal_income"
                      ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 shadow-md scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-green-500/50"
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="font-medium text-base">Personal Income</span>
                </button>
              </div>
            </div>
          )}

          {/* Full Form (revealed after intent selection) */}
          {intent !== null && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <form id="transaction-form" onSubmit={handleSubmit} className={cn(
                "flex flex-col space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto",
                intent !== null && "mt-0"
              )}>
                {/* Receipt Preview Section - Show at top on mobile, right column on desktop */}
                {((receipts && receipts.length > 0 && receipts[0]) || (uploadedReceipts.length > 0 && uploadedReceipts[0])) && (
                  <div className="mb-4 lg:hidden">
                    <ReceiptPreview
                      receiptUrl={receipts?.[0]?.fileUrl || uploadedReceipts[0]?.url || ""}
                      ocrData={receipts?.[0]?.ocrData || uploadedReceipts[0]?.ocrData}
                      isProcessing={isProcessingOCR}
                      onFieldClick={(field, value) => {
                        // Allow user to click OCR fields to populate form
                        if (field === "merchant") {
                          setTitle(value as string);
                        } else if (field === "amount") {
                          setAmount((value as number).toFixed(2));
                        } else if (field === "date") {
                          setDate(value as string);
                        }
                      }}
                    />
                  </div>
                )}

              <div className="space-y-5">
                {/* Step 1: Where - Always visible */}
                <div className={cn(
                  "transition-all duration-300",
                  completedFields.has('where') && "opacity-100"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-slate-900">
                      Where did you spend this?
                    </label>
                    {completedFields.has('where') && (
                      <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (e.target.value.length < 3) {
                          setAutoPopulated(false);
                        }
                        setDuplicateDismissed(false); // Reset duplicate dismissal when typing
                        // Clear error when user types
                        if (errors.title) {
                          setErrors(prev => ({ ...prev, title: "" }));
                        }
                      }}
                      required
                      aria-label="Where did you spend this?"
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "title-error" : undefined}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base min-h-[44px] transition-all duration-200",
                        errors.title ? "border-red-500 focus:ring-red-500" : title ? "border-green-500/50" : "border-slate-200"
                      )}
                      placeholder="Where did you spend the money?"
                    />
                    {title && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in fade-in duration-200" />
                    )}
                  </div>
                  {errors.title && (
                    <p id="title-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      {errors.title}
                    </p>
                  )}

                {hasSimilarTransaction && !useAI && title.length >= 3 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 animate-in fade-in duration-200">
                    <Check className="w-3 h-3" />
                    <span>Got it! We found a similar transaction and filled in the details.</span>
                  </p>
                )}

                {/* Duplicate Detection Alert */}
                {duplicateMatch && !duplicateDismissed && title.length >= 3 && amount && (
                  <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Possible duplicate transaction
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          This looks similar to a ${Math.abs(duplicateMatch.amount).toFixed(2)} transaction from {duplicateMatch.daysAgo === 0 ? "today" : duplicateMatch.daysAgo === 1 ? "yesterday" : `${duplicateMatch.daysAgo} days ago`}.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setDuplicateDismissed(true)}
                            className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                          >
                            Yes, ignore
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuplicateDismissed(true)}
                            className="text-xs px-3 py-1 border border-yellow-600 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-500/10 transition-colors"
                          >
                            No, both are valid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* Step 2: Amount - Visible when Where is complete */}
                {(completedFields.has('where') || showItemization) && (
                  <div className={cn(
                    "transition-all duration-300",
                    completedFields.has('where') || showItemization 
                      ? "animate-in fade-in slide-in-from-top-2 opacity-100" 
                      : "opacity-50 pointer-events-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium text-slate-900">
                        How much was the total?
                      </label>
                      {completedFields.has('amount') && (
                        <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          // Clear error when user types
                          if (errors.amount) {
                            setErrors(prev => ({ ...prev, amount: "" }));
                          }
                        }}
                        required
                        step="0.01"
                        min="0"
                        aria-label="How much was the total?"
                        aria-invalid={!!errors.amount}
                        aria-describedby={errors.amount ? "amount-error" : undefined}
                        className={cn(
                          "w-full pl-10 pr-3 py-2.5 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base min-h-[44px] transition-all duration-200",
                          errors.amount ? "border-red-500 focus:ring-red-500" : amount ? "border-green-500/50" : "border-slate-200"
                        )}
                        placeholder="Enter the total amount on the receipt."
                      />
                      {amount && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in fade-in duration-200" />
                      )}
                    </div>
                    {errors.amount && (
                      <p id="amount-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        {errors.amount}
                      </p>
                    )}

                    {/* Split Transaction Prompt */}
                    {showSplitPrompt && !showItemization && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-blue-900">
                            Want to split this into multiple categories?
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSplitInfoModal(true)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-100"
                            aria-label="Learn more about splitting transactions"
                            title="Learn more about splitting transactions"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Split large purchases (like Costco or Amazon orders) into separate line items with different categories. This gives you more accurate expense tracking and better tax categorization.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSplitSuggestion}
                        disabled={isLoadingSplit}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                      >
                        {isLoadingSplit ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          "Yes, Split This Transaction"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSplitPrompt(false)}
                        className="px-4 py-2.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors min-h-[44px]"
                      >
                        No Thanks
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                )}

                {/* Step 3: When - Visible when Amount is complete */}
                {(completedFields.has('amount') || showItemization) && (
                  <div className={cn(
                    "transition-all duration-300",
                    completedFields.has('amount') || showItemization
                      ? "animate-in fade-in slide-in-from-top-2 opacity-100"
                      : "opacity-50 pointer-events-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium text-slate-900">
                        When did this happen?
                      </label>
                      {completedFields.has('when') && (
                        <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
                      )}
                    </div>
                    <DateSelector
                      value={date}
                      onChange={setDate}
                    />
                    {errors.date && (
                      <p id="date-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        {errors.date}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 4: Category - Visible when When is complete */}
                {!showItemization && (completedFields.has('when') || completedFields.size === 0) && (
                  <div className={cn(
                    "transition-all duration-300",
                    completedFields.has('when') || completedFields.size === 0
                      ? "animate-in fade-in slide-in-from-top-2 opacity-100"
                      : "opacity-50 pointer-events-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium text-slate-900">
                        Want help choosing a category?
                      </label>
                      {autoPopulated && (
                        <span className="ml-2 text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Got it!
                        </span>
                      )}
                      {completedFields.has('category') && (
                        <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200 ml-auto" />
                      )}
                    </div>
                    <CategorySelector
                      value={category}
                      onChange={setCategory}
                      onAIClick={showAIButton && canUseAI ? () => handleManualAITrigger() : undefined}
                      isAILoading={isAILoading}
                      aiSuggestedCategory={aiSuggestedCategory}
                      aiConfidence={aiCategoryConfidence}
                      isNewCategory={aiSuggestions?.some(s => s.category === category && s.isNewCategory) || false}
                      showAIButton={showAIButton}
                      disabled={!canUseAI && showAIButton}
                    />
                    {errors.category && (
                      <p id="category-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        {errors.category}
                      </p>
                    )}
                  </div>
                )}

              </div>

              {/* Optional Controls - Conversational Links */}
              {intent !== null && !showItemization && (
                <div className="space-y-2 pt-2 border-t border-slate-200/50">
                  {/* More Details */}
                  <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
                    <CollapsibleTrigger className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group">
                      <span className="group-hover:underline">Want to add more details?</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        showMoreDetails && "rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                          Want to add a note for your future self?
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none text-base min-h-[44px]"
                          placeholder="Any additional details you want to remember..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 block">
                          Description (optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm resize-none min-h-[44px]"
                          placeholder="Add more details about this transaction..."
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Itemization */}
                  <button
                    type="button"
                    onClick={() => handleItemizationToggle(true)}
                    className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group"
                  >
                    <span className="group-hover:underline">Want to itemize this receipt?</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Receipt Upload */}
                  <button
                    type="button"
                    onClick={() => setShowReceiptUpload(true)}
                    className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group"
                  >
                    <span className="group-hover:underline">Need to attach a photo of the receipt?</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Double Entry Accounts - Full CRUD */}
                  <Collapsible open={showAccountingPreview} onOpenChange={setShowAccountingPreview}>
                    <CollapsibleTrigger className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group">
                      <span className="group-hover:underline">
                        {debitAccountId && creditAccountId 
                          ? "See how this will be recorded in your books?" 
                          : "Want to set up double-entry accounts?"}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        showAccountingPreview && "rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      {/* Accounting Preview - Show if accounts are set */}
                      {debitAccountId && creditAccountId && (
                        <AccountingPreview
                          debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
                          creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
                          amount={parseFloat(amount) || 0}
                          explanation={useAI ? "AI-generated double-entry suggestion. You can edit the accounts below." : "This transaction will be recorded in your books as shown above."}
                        />
                      )}

                      {/* Double Entry Account Selectors */}
                      <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Double Entry Accounts
                          </label>
                          <div className="flex items-center gap-2">
                            {/* AI Suggestion Button */}
                            <button
                              type="button"
                              onClick={handleDoubleEntryAI}
                              disabled={isAILoading || !title || !amount || !canUseAI}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                "bg-primary/10 text-primary hover:bg-primary/20",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                isAILoading && "opacity-75"
                              )}
                              title="Use AI to suggest accounts"
                            >
                              {isAILoading ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>AI...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  <span>AI</span>
                                </>
                              )}
                            </button>
                            {/* Clear Button */}
                            {(debitAccountId || creditAccountId) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDebitAccountId("");
                                  setCreditAccountId("");
                                  setUseAI(false);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Clear accounts"
                              >
                                <X className="w-3 h-3" />
                                <span>Clear</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1.5 block">
                              Debit Account
                            </label>
                            <select
                              value={debitAccountId || ""}
                              onChange={(e) => setDebitAccountId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px]"
                            >
                              <option value="">Select account...</option>
                              {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset" || a.type === "cost").map((acc: any) => (
                                <option key={acc._id} value={acc._id}>{acc.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1.5 block">
                              Credit Account
                            </label>
                            <select
                              value={creditAccountId || ""}
                              onChange={(e) => setCreditAccountId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px]"
                            >
                              <option value="">Select account...</option>
                              {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset" || a.type === "revenue" || a.type === "equity").map((acc: any) => (
                                <option key={acc._id} value={acc._id}>{acc.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Save indicator */}
                        {debitAccountId && creditAccountId && (
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 pt-1">
                            <Check className="w-3 h-3" />
                            <span>Accounts saved. These will be used when you save the transaction.</span>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {/* Double Entry Accounts - Hidden in Simple Mode (handled by AI) */}
              {/* Only show in Advanced Mode if needed */}

              {showItemization && (
                <div>
                  <label className="text-base font-medium text-foreground mb-2 block">
                    Default Category (optional)
                  </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Used if line items don't specify categories"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Individual line items can have their own categories
                  </p>
                </div>
              )}


              {/* Note field always visible in Itemization Mode */}
              {showItemization && (
                <div>
                  <label className="text-base font-medium text-foreground mb-2 block">
                    Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base min-h-[44px]"
                    placeholder="Any additional details you want to remember..."
                  />
                </div>
              )}

              {/* Accounting Preview - Mobile View (Itemization Mode Only) */}
              {showItemization && debitAccountId && creditAccountId && amount && (
                <div className="lg:hidden pt-4 border-t border-border">
                  <AccountingPreview
                    debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
                    creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
                    amount={parseFloat(amount) || 0}
                    explanation="This transaction will be recorded in your books as shown above."
                  />
                </div>
              )}

              {/* Tax & Compliance Section - Itemization Mode Only */}
              {showItemization && (
                <Accordion type="single" collapsible className="pt-4 border-t border-border">
                  <AccordionItem value="tax-compliance">
                    <AccordionTrigger className="text-sm font-semibold text-foreground">
                      Tax & Compliance
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Tax Rate */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Tax Rate
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={taxRate}
                            onChange={(e) => {
                              setTaxRate(e.target.value);
                              if (e.target.value && amount) {
                                const rate = parseFloat(e.target.value);
                                const amt = parseFloat(amount);
                                if (!isNaN(rate) && !isNaN(amt)) {
                                  setTaxAmount((amt * rate / 100).toFixed(2));
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                          >
                            <option value="">Select rate...</option>
                            <option value="0">0% (No tax)</option>
                            <option value="5">5%</option>
                            <option value="6">6%</option>
                            <option value="7">7%</option>
                            <option value="8">8%</option>
                            <option value="8.25">8.25%</option>
                            <option value="8.5">8.5%</option>
                            <option value="9">9%</option>
                            <option value="10">10%</option>
                            <option value="custom">Custom...</option>
                          </select>
                          {taxRate === "custom" && (
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={taxRate === "custom" ? taxRate : ""}
                                onChange={(e) => {
                                  const rate = parseFloat(e.target.value);
                                  if (!isNaN(rate) && amount) {
                                    const amt = parseFloat(amount);
                                    if (!isNaN(amt)) {
                                      setTaxAmount((amt * rate / 100).toFixed(2));
                                    }
                                  }
                                }}
                                placeholder="Enter %"
                                step="0.01"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tax Amount */}
                      {taxRate && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Tax Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <input
                              type="number"
                              value={taxAmount}
                              onChange={(e) => setTaxAmount(e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                              placeholder="0.00"
                            />
                  </div>
                </div>
              )}

                      {/* Tax Inclusive/Exclusive Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                        <div>
                      <label className="text-sm font-medium text-foreground">
                            Tax-Inclusive
                      </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tax is included in the total amount
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsTaxInclusive(!isTaxInclusive)}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                            isTaxInclusive ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                              isTaxInclusive && "translate-x-5"
                            )}
                          />
                        </button>
                    </div>

                      {/* Tax Exemption */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                      <div>
                          <label className="text-sm font-medium text-foreground">
                            Tax Exempt
                        </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            This transaction is tax-exempt
                          </p>
                      </div>
                        <button
                          type="button"
                          onClick={() => setIsTaxExempt(!isTaxExempt)}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                            isTaxExempt ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                              isTaxExempt && "translate-x-5"
                            )}
                          />
                        </button>
                      </div>

                      {isTaxExempt && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                            Exemption Reason
                  </label>
                  <input
                    type="text"
                            value={taxExemptReason}
                            onChange={(e) => setTaxExemptReason(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                            placeholder="e.g., Resale certificate, Non-profit"
                          />
                </div>
              )}

                      {/* 1099 Tracking */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div>
                          <label className="text-sm font-medium text-foreground">
                            1099 Tracking
                </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Flag for 1099 reporting (contractors)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTrack1099(!track1099)}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                            track1099 ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                              track1099 && "translate-x-5"
                            )}
                          />
                        </button>
              </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Itemized Receipt Section */}
              {showItemization && (
                <div className="space-y-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Itemized Receipt</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Break this receipt into multiple items and categories
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleItemizationToggle(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back to simple
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {/* Parse Receipt Items Button */}
                      {receiptOCRData?.items && receiptOCRData.items.length > 0 && lineItems.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            // Pre-fill line items from OCR
                            setLineItems(receiptOCRData.items.map((item: any, index: number) => ({
                              id: Date.now().toString() + index,
                              description: item.description || "",
                              category: "",
                              amount: item.amount.toFixed(2),
                              tax: "",
                              tip: "",
                            })));
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-h-[44px]"
                        >
                          <Sparkles className="w-4 h-4" />
                          Parse Receipt Items
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={addLineItem}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors min-h-[44px]"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                    </div>
                  </div>

                  {lineItems.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        No line items yet. Click "Add Item" to start itemizing.
                      </p>
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        Add First Item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lineItems.map((item, index) => (
                        <div key={item.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Item {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-foreground mb-1 block">
                              Description *
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="e.g., Coffee, Office Chair, Software Subscription"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-foreground">
                                  Category
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleLineItemAI(item.id)}
                                  disabled={lineItemAILoading[item.id] || !item.description || !item.amount}
                                  className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all",
                                    item.description && item.amount && !lineItemAILoading[item.id]
                                      ? "text-primary hover:bg-primary/10"
                                      : "text-muted-foreground cursor-not-allowed opacity-50"
                                  )}
                                  title="Use AI to suggest category and accounts"
                                >
                                  {lineItemAILoading[item.id] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <CategorySelector
                                value={item.category}
                                onChange={(cat) => updateLineItem(item.id, "category", cat)}
                                className="text-sm"
                                placeholder="Select category..."
                                isNewCategory={lineItemAISuggestions[item.id]?.some((s: any) => s.category === item.category && s.isNewCategory) || false}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-foreground mb-1 block">
                                Amount *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                                  required
                                  step="0.01"
                                  min="0"
                                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-foreground mb-1 block">
                                Tax (optional)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  value={item.tax}
                                  onChange={(e) => updateLineItem(item.id, "tax", e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-foreground mb-1 block">
                                Tip (optional)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  value={item.tip}
                                  onChange={(e) => updateLineItem(item.id, "tip", e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Double-Entry Preview for Line Item */}
                          {item.debitAccountId && item.creditAccountId && item.amount && (
                            <Collapsible>
                              <CollapsibleTrigger className="w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center justify-between">
                                <span>Double-Entry Preview</span>
                                <ChevronDown className="w-3 h-3" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <AccountingPreview
                                  debitAccountName={userAccounts?.find((a: any) => a._id === item.debitAccountId)?.name || "Unknown"}
                                  creditAccountName={userAccounts?.find((a: any) => a._id === item.creditAccountId)?.name || "Unknown"}
                                  amount={parseFloat(item.amount) || 0}
                                  explanation="This line item will be recorded as shown above."
                                  className="text-xs"
                                />
                                {/* Account Selectors for Editing */}
                                <div className="mt-2 space-y-2">
                                  <div>
                                    <label className="text-xs font-medium text-foreground mb-1 block">Debit Account</label>
                                    <select
                                      value={item.debitAccountId || ""}
                                      onChange={(e) => updateLineItem(item.id, "debitAccountId", e.target.value)}
                                      className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                                    >
                                      <option value="">Select account...</option>
                                      {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset").map((acc: any) => (
                                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-foreground mb-1 block">Credit Account</label>
                                    <select
                                      value={item.creditAccountId || ""}
                                      onChange={(e) => updateLineItem(item.id, "creditAccountId", e.target.value)}
                                      className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                                    >
                                      <option value="">Select account...</option>
                                      {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset").map((acc: any) => (
                                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {/* Double Entry Accounts for Line Item */}
                          <div className="pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-foreground">
                                Double Entry Accounts
                              </label>
                              <div className="flex items-center gap-1.5">
                                {/* AI Suggestion Button */}
                                <button
                                  type="button"
                                  onClick={() => handleLineItemAI(item.id)}
                                  disabled={lineItemAILoading[item.id] || !item.description || !item.amount}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                                    item.description && item.amount && !lineItemAILoading[item.id]
                                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                                      : "text-muted-foreground cursor-not-allowed opacity-50"
                                  )}
                                  title="Use AI to suggest accounts"
                                >
                                  {lineItemAILoading[item.id] ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>AI...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      <span>AI</span>
                                    </>
                                  )}
                                </button>
                                {/* Clear Button */}
                                {(item.debitAccountId || item.creditAccountId) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateLineItem(item.id, "debitAccountId", "");
                                      updateLineItem(item.id, "creditAccountId", "");
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                                    title="Clear accounts"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Clear</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">
                                  Debit Account
                                </label>
                                <select
                                  value={item.debitAccountId || ""}
                                  onChange={(e) => updateLineItem(item.id, "debitAccountId", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs min-h-[36px]"
                                >
                                  <option value="">Select...</option>
                                  {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset" || a.type === "cost").map((account: any) => (
                                    <option key={account._id} value={account._id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">
                                  Credit Account
                                </label>
                                <select
                                  value={item.creditAccountId || ""}
                                  onChange={(e) => updateLineItem(item.id, "creditAccountId", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs min-h-[36px]"
                                >
                                  <option value="">Select...</option>
                                  {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset" || a.type === "revenue" || a.type === "equity").map((account: any) => (
                                    <option key={account._id} value={account._id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {/* Save indicator for line item */}
                            {item.debitAccountId && item.creditAccountId && (
                              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2 pt-1">
                                <Check className="w-3 h-3" />
                                <span>Accounts saved for this item</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Line Items Summary */}
                  {lineItems.length > 0 && (
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Itemized Subtotal:</span>
                        <span className="font-semibold text-foreground">
                          ${lineItemsTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Transaction Total:</span>
                        <span className="font-semibold text-foreground">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {!totalsMatch && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                              Totals don't match
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              Itemized total (${lineItemsTotal.toFixed(2)}) differs from transaction total (${totalAmount.toFixed(2)}) by ${totalsDifference.toFixed(2)}. 
                              You can still save, but the difference will be tracked separately.
                            </p>
                          </div>
                        </div>
                      )}
                      {totalsMatch && lineItems.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span>Itemized total matches transaction total</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
                </form>
            </div>
          )}

          {/* Footer */}
          {intent !== null && (
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveAndAddAnother(true);
                    const form = document.getElementById("transaction-form") as HTMLFormElement;
                    form?.requestSubmit();
                  }}
                  disabled={
                    isSubmitting || 
                    !title || 
                    !amount || 
                    (showItemization && lineItems.length === 0)
                  }
                  className={cn(
                    "h-9 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "hidden sm:block"
                  )}
                  title="Save and add another transaction (Cmd/Ctrl + Enter)"
                >
                  Save & Add Another
                </button>
                <button
                  type="submit"
                  form="transaction-form"
                  disabled={
                    isSubmitting || 
                    showSaveSuccess ||
                    !title || 
                    !amount || 
                    (showItemization && lineItems.length === 0)
                  }
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-4 rounded-xl font-semibold text-base transition-all min-h-[52px]",
                    "hover:scale-105 hover:shadow-lg active:scale-95",
                    showSaveSuccess
                      ? "bg-green-600 text-white"
                      : intent?.includes("expense")
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  {showSaveSuccess ? (
                    <>
                      <Check className="w-5 h-5 inline mr-2 animate-in zoom-in duration-200" />
                      Saved!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Advanced Flyout */}
      {advancedOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-[55] md:bg-black/20"
            onClick={() => setAdvancedOpen(false)}
          />
          
          {/* Flyout Panel */}
          <aside className={cn(
            "fixed z-[60] bg-white shadow-xl",
            "md:inset-y-6 md:right-6 md:w-full md:max-w-[420px] md:rounded-l-2xl md:border-l",
            "bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl border-t",
            "flex flex-col overflow-hidden"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Advanced Options</h3>
              <button
                onClick={() => setAdvancedOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close advanced options"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Itemization */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Itemize Receipt</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Break this receipt into multiple items and categories
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleItemizationToggle(true);
                    setAdvancedOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                >
                  Enable Itemization
                </button>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Notes & Tags</h4>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm resize-none"
                  placeholder="Any additional details you want to remember..."
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Attach Receipt</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Upload a photo of your receipt for OCR processing
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptUpload(true);
                    setAdvancedOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Upload Receipt
                </button>
              </div>

              {/* Receipt Preview (if exists) */}
              {((receipts && receipts.length > 0 && receipts[0]) || (uploadedReceipts.length > 0 && uploadedReceipts[0])) && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Receipt Preview</h4>
                  <ReceiptPreview
                    receiptUrl={receipts?.[0]?.fileUrl || uploadedReceipts[0]?.url || ""}
                    ocrData={receipts?.[0]?.ocrData || uploadedReceipts[0]?.ocrData}
                    isProcessing={isProcessingOCR}
                    onFieldClick={(field, value) => {
                      if (field === "merchant") {
                        setTitle(value as string);
                      } else if (field === "amount") {
                        setAmount((value as number).toFixed(2));
                      } else if (field === "date") {
                        setDate(value as string);
                      }
                    }}
                  />
                </div>
              )}

              {/* Accounting Preview */}
              {/* Double-Entry Preview with Toggle */}
              {debitAccountId && creditAccountId && amount && (
                <Collapsible open={showAccountingPreview} onOpenChange={setShowAccountingPreview}>
                  <CollapsibleTrigger className="w-full text-left text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors py-2 flex items-center justify-between group">
                    <span className="flex items-center gap-2">
                      <span>Double-Entry Bookkeeping Preview</span>
                      {useAI && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          AI Suggested
                        </span>
                      )}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200 text-slate-500",
                      showAccountingPreview && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 animate-in slide-in-from-top-2 duration-200">
                    <AccountingPreview
                      debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
                      creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
                      amount={parseFloat(amount) || 0}
                      explanation={useAI ? "AI-generated double-entry suggestion. You can edit the accounts below." : "This transaction will be recorded in your books as shown above."}
                      onEdit={() => {
                        // Toggle account editing section
                        setShowAccountingPreview(!showAccountingPreview);
                      }}
                    />
                    {/* Account Selectors for Editing */}
                    {showAccountingPreview && (
                      <div className="mt-3 space-y-2 pt-3 border-t border-slate-200">
                        <div>
                          <label className="text-xs font-medium text-slate-900 mb-1 block">Debit Account</label>
                          <select
                            value={debitAccountId || ""}
                            onChange={(e) => setDebitAccountId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                          >
                            <option value="">Select account...</option>
                            {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset").map((acc: any) => (
                              <option key={acc._id} value={acc._id}>{acc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-900 mb-1 block">Credit Account</label>
                          <select
                            value={creditAccountId || ""}
                            onChange={(e) => setCreditAccountId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                          >
                            <option value="">Select account...</option>
                            {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset").map((acc: any) => (
                              <option key={acc._id} value={acc._id}>{acc.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Split Transaction Info Modal */}
      {showSplitInfoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Why Split Transactions?</h3>
              <button
                onClick={() => setShowSplitInfoModal(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">What is Transaction Splitting?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Splitting allows you to break a single purchase into multiple line items, each with its own category. 
                  This is especially useful for large shopping trips or bulk purchases where items belong to different expense categories.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Common Use Cases</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Costco/Target runs:</strong> Split groceries, office supplies, and household items into separate categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Amazon orders:</strong> Separate business tools, personal items, and office equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Restaurant receipts:</strong> Split food, drinks, and tips for accurate expense tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Mixed business/personal:</strong> Separate deductible business expenses from personal purchases</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Benefits</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Accurate tax categorization:</strong> Properly categorize deductible vs. non-deductible expenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Better budgeting:</strong> See exactly where your money goes by category</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Detailed reporting:</strong> Generate reports that show spending by specific categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Compliance:</strong> Maintain accurate records for tax purposes and audits</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 italic">
                  💡 Tip: Our AI can automatically suggest how to split your transaction based on the merchant and amount. 
                  You can always adjust the categories and amounts after splitting.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSplitInfoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <ReceiptUploadModal
          transactionId={createdTransactionId || undefined}
          onClose={() => {
            setShowReceiptUpload(false);
            // Refresh receipts query to get OCR data
            if (createdTransactionId) {
              // Query will automatically refresh
            }
          }}
          onUploadComplete={async (receiptUrls) => {
            console.log("Receipts uploaded:", receiptUrls);
            setShowReceiptUpload(false);
            // Receipts will automatically appear via the query if transaction exists
            // OCR processing happens automatically in ReceiptUploadModal
          }}
        />
      )}
    </>
  );
}
