/**
 * Hook for transaction submission handler logic
 */

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/lib/use-toast";
import type { Id } from "@convex/_generated/dataModel";
import type { TransactionType, LineItem } from "../types";
import { validateTransactionForm } from "../utils/formHelpers";

export interface UseTransactionSubmissionHandlerProps {
  // Form values
  title: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  note: string;
  transactionType: TransactionType | null;
  isBusiness: boolean | null;
  showItemization: boolean;
  lineItems: LineItem[];
  debitAccountId: string;
  creditAccountId: string;
  
  // State setters
  setTitle: (title: string) => void;
  setAmount: (amount: string) => void;
  setDate: (date: string) => void;
  setCategory: (category: string) => void;
  setDescription: (description: string) => void;
  setNote: (note: string) => void;
  setDebitAccountId: (id: string) => void;
  setCreditAccountId: (id: string) => void;
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  setShowItemization: (show: boolean) => void;
  setErrors: (updater: (prev: any) => any) => void;
  setCompletedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Submission state
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  saveAndAddAnother: boolean;
  setSaveAndAddAnother: (save: boolean) => void;
  showSaveSuccess: boolean;
  setShowSaveSuccess: (show: boolean) => void;
  setCreatedTransactionId: (id: Id<"transactions_raw"> | null) => void;
  
  // AI state
  useAI: boolean;
  aiSuggestedCategory: string | undefined;
  aiSuggestions: any[] | null;
  aiCategoryConfidence: number | undefined;
  autoPopulated: boolean;
  setAutoPopulated: (populated: boolean) => void;
  autoPopulatedFromReceipt: boolean;
  setAutoPopulatedFromReceipt: (populated: boolean) => void;
  
  splitHook: any;
  
  // Duplicate state
  duplicateDismissed: boolean;
  setDuplicateDismissed: (dismissed: boolean) => void;
  
  // Receipt state
  showReceiptUpload: boolean;
  setShowReceiptUpload: (show: boolean) => void;
  
  // Similar transactions
  similarTransactions: any[] | undefined;
  
  // Accounts
  userAccounts: any[] | undefined;
  
  // Callbacks
  onClose: () => void;
  resetForm: () => void;
}

export interface UseTransactionSubmissionHandlerReturn {
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useTransactionSubmissionHandler({
  title,
  amount,
  date,
  category,
  description,
  note,
  transactionType,
  isBusiness,
  showItemization,
  lineItems,
  debitAccountId,
  creditAccountId,
  setTitle,
  setAmount,
  setDate,
  setCategory,
  setDescription,
  setNote,
  setDebitAccountId,
  setCreditAccountId,
  setLineItems,
  setShowItemization,
  setErrors,
  setCompletedFields,
  isSubmitting,
  setIsSubmitting,
  saveAndAddAnother,
  setSaveAndAddAnother,
  showSaveSuccess,
  setShowSaveSuccess,
  setCreatedTransactionId,
  useAI,
  aiSuggestedCategory,
  aiSuggestions,
  aiCategoryConfidence,
  autoPopulated,
  setAutoPopulated,
  autoPopulatedFromReceipt,
  setAutoPopulatedFromReceipt,
  splitHook,
  duplicateDismissed,
  setDuplicateDismissed,
  showReceiptUpload,
  setShowReceiptUpload,
  similarTransactions,
  userAccounts,
  onClose,
  resetForm,
}: UseTransactionSubmissionHandlerProps): UseTransactionSubmissionHandlerReturn {
  const { setShowSplitPrompt, setSplitSuggestions } = splitHook;
  const createTransaction = useMutation(api.transactions.createRaw);
  const processTransaction = useMutation(api.transactions.processTransaction);
  const saveCorrection = useMutation(api.knowledge_base.saveCorrection);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(title, amount, date, category, showItemization, lineItems)) {
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
        status: "pending",
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
          // Note: AI suggestions are generated asynchronously via scheduler
          // The proposed entry will appear in the approval queue when ready
        } catch (error: any) {
          console.error("Failed to generate AI suggestions:", error);
          toast({
            title: "AI suggestion in progress",
            description: "Your transaction was saved. AI suggestions are being generated and will appear in the approval queue shortly.",
            variant: "default",
          });
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

  return {
    handleSubmit,
  };
}

