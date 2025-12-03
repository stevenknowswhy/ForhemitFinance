/**
 * Utility function to reset transaction form state
 */

import type { TransactionIntent, LineItem } from "../types";
import type { Id } from "@convex/_generated/dataModel";

export interface ResetFormParams {
  setIntent: (intent: TransactionIntent | null) => void;
  setShowItemization: (show: boolean) => void;
  setTitle: (title: string) => void;
  setAmount: (amount: string) => void;
  setDate: (date: string) => void;
  setCategory: (category: string) => void;
  setDescription: (description: string) => void;
  setNote: (note: string) => void;
  setDebitAccountId: (id: string) => void;
  setCreditAccountId: (id: string) => void;
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  setUseAI: (use: boolean) => void;
  setAutoPopulated: (populated: boolean) => void;
  setAiSuggestions: (suggestions: any[] | null) => void;
  setIsAILoading: (loading: boolean) => void;
  setLineItemAILoading: (loading: Record<string, boolean>) => void;
  setLineItemAISuggestions: (suggestions: Record<string, any[]>) => void;
  setCreatedTransactionId: (id: Id<"transactions_raw"> | null) => void;
  setShowReceiptUpload: (show: boolean) => void;
  setShowMoreDetails: (show: boolean) => void;
  setShowAccountingPreview: (show: boolean) => void;
  setCompletedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  setAiModalDescription: (description: string) => void;
  setShowSaveSuccess: (show: boolean) => void;
}

export function resetForm({
  setIntent,
  setShowItemization,
  setTitle,
  setAmount,
  setDate,
  setCategory,
  setDescription,
  setNote,
  setDebitAccountId,
  setCreditAccountId,
  setLineItems,
  setUseAI,
  setAutoPopulated,
  setAiSuggestions,
  setIsAILoading,
  setLineItemAILoading,
  setLineItemAISuggestions,
  setCreatedTransactionId,
  setShowReceiptUpload,
  setShowMoreDetails,
  setShowAccountingPreview,
  setCompletedFields,
  setAiModalDescription,
  setShowSaveSuccess,
}: ResetFormParams) {
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
}

