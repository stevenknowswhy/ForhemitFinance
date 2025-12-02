/**
 * Hook for managing AI suggestion state and handlers
 */

import { useState, useEffect } from "react";
import type { LineItem, TransactionIntent, TransactionType } from "../types";

export interface UseTransactionAIReturn {
  // AI state
  useAI: boolean;
  setUseAI: (use: boolean) => void;
  autoPopulated: boolean;
  setAutoPopulated: (populated: boolean) => void;
  isAILoading: boolean;
  setIsAILoading: (loading: boolean) => void;
  aiSuggestions: any[] | null;
  setAiSuggestions: (suggestions: any[] | null) => void;
  aiModalDescription: string;
  setAiModalDescription: (description: string) => void;
  lineItemAILoading: Record<string, boolean>;
  setLineItemAILoading: (loading: Record<string, boolean>) => void;
  lineItemAISuggestions: Record<string, any[]>;
  setLineItemAISuggestions: (suggestions: Record<string, any[]>) => void;
  aiSuggestedCategory: string | undefined;
  setAiSuggestedCategory: (category: string | undefined) => void;
  aiCategoryConfidence: number | undefined;
  setAiCategoryConfidence: (confidence: number | undefined) => void;
}

export function useTransactionAI(): UseTransactionAIReturn {
  const [useAI, setUseAI] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [aiModalDescription, setAiModalDescription] = useState("");
  const [lineItemAILoading, setLineItemAILoading] = useState<Record<string, boolean>>({});
  const [lineItemAISuggestions, setLineItemAISuggestions] = useState<Record<string, any[]>>({});
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<string | undefined>();
  const [aiCategoryConfidence, setAiCategoryConfidence] = useState<number | undefined>();

  // Reset auto-populated flag when title changes significantly
  useEffect(() => {
    // This will be handled by the component that uses this hook
  }, []);

  return {
    useAI,
    setUseAI,
    autoPopulated,
    setAutoPopulated,
    isAILoading,
    setIsAILoading,
    aiSuggestions,
    setAiSuggestions,
    aiModalDescription,
    setAiModalDescription,
    lineItemAILoading,
    setLineItemAILoading,
    lineItemAISuggestions,
    setLineItemAISuggestions,
    aiSuggestedCategory,
    setAiSuggestedCategory,
    aiCategoryConfidence,
    setAiCategoryConfidence,
  };
}

