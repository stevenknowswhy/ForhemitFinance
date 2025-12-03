/**
 * Hook for managing core transaction form state
 */

import { useState, useMemo, useEffect } from "react";
import type { TransactionIntent, TransactionType } from "../types";
import { DEFAULT_DATE } from "../constants";
import { isTitleLongEnough } from "../utils/formHelpers";

export interface UseTransactionFormReturn {
  // Intent and type
  intent: TransactionIntent;
  setIntent: (intent: TransactionIntent) => void;
  transactionType: TransactionType;
  isBusiness: boolean | null;
  
  // Core form fields
  title: string;
  setTitle: (title: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  date: string;
  setDate: (date: string) => void;
  category: string;
  setCategory: (category: string) => void;
  description: string;
  setDescription: (description: string) => void;
  note: string;
  setNote: (note: string) => void;
  
  // Double entry accounts
  debitAccountId: string;
  setDebitAccountId: (id: string) => void;
  creditAccountId: string;
  setCreditAccountId: (id: string) => void;
  
  // UI state
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
  showMoreDetails: boolean;
  setShowMoreDetails: (show: boolean) => void;
  showAccountingPreview: boolean;
  setShowAccountingPreview: (show: boolean) => void;
  completedFields: Set<string>;
  setCompletedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // User preferences
  frequentlyItemizes: boolean;
  setFrequentlyItemizes: (value: boolean) => void;
  
  // Derived values
  entryMode: "simple" | "itemized";
  hasValidTitle: boolean;
}

export function useTransactionForm(
  showItemization: boolean = false
): UseTransactionFormReturn {
  // Intent and type
  const [intent, setIntent] = useState<TransactionIntent>(null);
  
  // Derived states from intent
  const transactionType = useMemo(() => {
    return intent?.includes("income") ? "income" : intent?.includes("expense") ? "expense" : null;
  }, [intent]);
  
  const isBusiness = useMemo(() => {
    return intent?.includes("business") ? true : intent?.includes("personal") ? false : null;
  }, [intent]);
  
  // Core form fields
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(DEFAULT_DATE);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  
  // Double entry accounts
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  
  // UI state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAccountingPreview, setShowAccountingPreview] = useState(false);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  
  // User preferences
  const [frequentlyItemizes, setFrequentlyItemizes] = useState(false);
  
  // Legacy entryMode for backward compatibility
  const entryMode = showItemization ? "itemized" : "simple";
  
  // Derived values
  const hasValidTitle = useMemo(() => isTitleLongEnough(title), [title]);
  
  // Handle intent selection with localStorage persistence
  const handleIntentSelect = (selectedIntent: TransactionIntent) => {
    setIntent(selectedIntent);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastTransactionIntent", selectedIntent || "");
    }
  };
  
  // Load intent from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastIntent = localStorage.getItem("lastTransactionIntent");
      if (lastIntent) {
        // Don't auto-set, but could be used for hints
      }
    }
  }, []);
  
  // Detect if user frequently itemizes (check localStorage preference)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const itemizationPreference = localStorage.getItem("frequentlyItemizes");
      if (itemizationPreference === "true") {
        setFrequentlyItemizes(true);
      }
    }
  }, []);
  
  // Track field completion for progressive reveals
  useEffect(() => {
    if (!intent) {
      setCompletedFields(new Set());
      return;
    }

    const newCompleted = new Set(completedFields);

    // Where field: complete when title has 3+ characters
    if (isTitleLongEnough(title)) {
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
  }, [title, amount, date, category, intent, completedFields]);

  return {
    // Intent and type
    intent,
    setIntent: handleIntentSelect,
    transactionType,
    isBusiness,
    
    // Core form fields
    title,
    setTitle,
    amount,
    setAmount,
    date,
    setDate,
    category,
    setCategory,
    description,
    setDescription,
    note,
    setNote,
    
    // Double entry accounts
    debitAccountId,
    setDebitAccountId,
    creditAccountId,
    setCreditAccountId,
    
    // UI state
    advancedOpen,
    setAdvancedOpen,
    showMoreDetails,
    setShowMoreDetails,
    showAccountingPreview,
    setShowAccountingPreview,
    completedFields,
    setCompletedFields,
    
    // User preferences
    frequentlyItemizes,
    setFrequentlyItemizes,
    
    // Derived values
    entryMode,
    hasValidTitle,
  };
}

