/**
 * Hook for AI-related handlers (not state, just handlers)
 */

import { useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/lib/use-toast";
import type { TransactionType, LineItem } from "../types";
import type { Id } from "convex/_generated/dataModel";

export interface UseTransactionAIHandlersProps {
  // Form values
  title: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  transactionType: TransactionType | null;
  isBusiness: boolean | null;
  
  // AI state
  isAILoading: boolean;
  setIsAILoading: (loading: boolean) => void;
  useAI: boolean;
  setUseAI: (use: boolean) => void;
  autoPopulated: boolean;
  setAutoPopulated: (populated: boolean) => void;
  aiModalDescription: string;
  setAiModalDescription: (description: string) => void;
  aiSuggestions: any[] | null;
  setAiSuggestions: (suggestions: any[] | null) => void;
  aiSuggestedCategory: string | undefined;
  setAiSuggestedCategory: (category: string | undefined) => void;
  aiCategoryConfidence: number | undefined;
  setAiCategoryConfidence: (confidence: number | undefined) => void;
  lineItemAILoading: Record<string, boolean>;
  setLineItemAILoading: (loading: Record<string, boolean>) => void;
  lineItemAISuggestions: Record<string, any[]>;
  setLineItemAISuggestions: (suggestions: Record<string, any[]>) => void;
  
  // Form setters
  setCategory: (category: string) => void;
  setDebitAccountId: (id: string) => void;
  setCreditAccountId: (id: string) => void;
  setIntent: (intent: any) => void;
  setShowAccountingPreview: (show: boolean) => void;
  setCompletedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Line items
  lineItems: LineItem[];
  showItemization: boolean;
  updateLineItem: (id: string, field: keyof LineItem, value: string) => void;
  
  // Accounts
  userAccounts: any[] | undefined;
}

export interface UseTransactionAIHandlersReturn {
  handleDoubleEntryAI: () => Promise<void>;
  handleManualAITrigger: (overrideDebitAccountId?: string, overrideCreditAccountId?: string, isAutoTrigger?: boolean) => Promise<void>;
  handleSelectSuggestion: (suggestion: any) => Promise<void>;
  handleLineItemAI: (lineItemId: string, isAutoTrigger?: boolean) => Promise<void>;
}

export function useTransactionAIHandlers({
  title,
  amount,
  date,
  category,
  description,
  transactionType,
  isBusiness,
  isAILoading,
  setIsAILoading,
  useAI,
  setUseAI,
  autoPopulated,
  setAutoPopulated,
  aiModalDescription,
  setAiModalDescription,
  aiSuggestions,
  setAiSuggestions,
  aiSuggestedCategory,
  setAiSuggestedCategory,
  aiCategoryConfidence,
  setAiCategoryConfidence,
  lineItemAILoading,
  setLineItemAILoading,
  lineItemAISuggestions,
  setLineItemAISuggestions,
  setCategory,
  setDebitAccountId,
  setCreditAccountId,
  setIntent,
  setShowAccountingPreview,
  setCompletedFields,
  lineItems,
  showItemization,
  updateLineItem,
  userAccounts,
}: UseTransactionAIHandlersProps): UseTransactionAIHandlersReturn {
  const generateAISuggestions = useAction(api.ai_entries.generateAISuggestions);
  const addCustomCategory = useMutation(api.users.addCustomCategory);
  const { toast } = useToast();

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

  return {
    handleDoubleEntryAI,
    handleManualAITrigger,
    handleSelectSuggestion,
    handleLineItemAI,
  };
}

