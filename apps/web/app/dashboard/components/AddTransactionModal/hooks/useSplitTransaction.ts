/**
 * Hook for managing split transaction suggestions and logic
 */

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/lib/use-toast";
import { shouldSuggestSplit } from "../utils/formHelpers";
import type { LineItem } from "../types";
import type { TransactionType } from "../types";

export interface UseSplitTransactionReturn {
  showSplitPrompt: boolean;
  setShowSplitPrompt: (show: boolean) => void;
  splitSuggestions: any[] | null;
  setSplitSuggestions: (suggestions: any[] | null) => void;
  isLoadingSplit: boolean;
  showSplitInfoModal: boolean;
  setShowSplitInfoModal: (show: boolean) => void;
  handleSplitSuggestion: () => Promise<void>;
}

export function useSplitTransaction(
  title: string,
  amount: string,
  category: string,
  transactionType: TransactionType | null,
  showItemization: boolean,
  receiptOCRData: any,
  enableItemization: (title: string, amount: string, category: string) => void,
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>
): UseSplitTransactionReturn {
  const [showSplitPrompt, setShowSplitPrompt] = useState(false);
  const [splitSuggestions, setSplitSuggestions] = useState<any[] | null>(null);
  const [isLoadingSplit, setIsLoadingSplit] = useState(false);
  const [showSplitInfoModal, setShowSplitInfoModal] = useState(false);
  const suggestSplit = useAction(api.split_suggestions.suggestSplit);
  const { toast } = useToast();

  // Check for split transaction opportunity
  useEffect(() => {
    // Reset split prompt when key fields change significantly (new transaction)
    if (!title || !amount) {
      setShowSplitPrompt(false);
      return;
    }

    // Only suggest if we have the required fields, it's an expense, not already itemized, and haven't shown suggestions yet
    if (!showItemization && title && amount && transactionType === "expense" && !splitSuggestions) {
      const shouldSuggest = shouldSuggestSplit(title, amount, transactionType);
      setShowSplitPrompt(shouldSuggest);
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
      enableItemization(title, amount, category);
      
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
      enableItemization(title, amount, category);
      
      // Create at least one line item with the current data
      setLineItems([{
        id: Date.now().toString(),
        description: title,
        category: category || "Other",
        amount: amount,
        tax: "",
        tip: "",
      }]);
      
      toast({
        title: "Itemization enabled",
        description: "You can now manually split this transaction into multiple items.",
      });
    } finally {
      setIsLoadingSplit(false);
    }
  };

  return {
    showSplitPrompt,
    setShowSplitPrompt,
    splitSuggestions,
    setSplitSuggestions,
    isLoadingSplit,
    showSplitInfoModal,
    setShowSplitInfoModal,
    handleSplitSuggestion,
  };
}