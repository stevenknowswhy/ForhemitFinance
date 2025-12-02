/**
 * Hook for managing similar transaction detection and auto-population
 */

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { TransactionType } from "../types";

export interface UseSimilarTransactionsReturn {
  similarTransactions: any[] | undefined;
  hasSimilarTransaction: boolean;
}

export function useSimilarTransactions(
  title: string,
  transactionType: TransactionType | null,
  isBusiness: boolean | null,
  category: string,
  autoPopulated: boolean,
  useAI: boolean,
  setCategory: (category: string) => void,
  setAutoPopulated: (value: boolean) => void
): UseSimilarTransactionsReturn {
  // Query for similar transactions when title changes
  const similarTransactions = useQuery(
    api.transactions.findSimilarTransactions,
    title.trim().length >= 3 && transactionType !== null && isBusiness !== null
      ? { merchant: title, description: title, limit: 1 }
      : "skip"
  );

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

      setAutoPopulated(true);
    }
  }, [similarTransactions, autoPopulated, useAI, category, transactionType, isBusiness, title, setCategory, setAutoPopulated]);

  // Reset auto-populated flag when title changes significantly
  useEffect(() => {
    if (title.length < 3) {
      setAutoPopulated(false);
    }
  }, [title, setAutoPopulated]);

  const hasSimilarTransaction = similarTransactions && similarTransactions.length > 0;

  return {
    similarTransactions,
    hasSimilarTransaction,
  };
}

