/**
 * Hook for transaction form helper functions and derived values
 */

import { useMemo } from "react";
import type { TransactionType } from "../types";

export interface UseTransactionFormHelpersProps {
  title: string;
  amount: string;
  transactionType: TransactionType | null;
  isBusiness: boolean | null;
}

export interface UseTransactionFormHelpersReturn {
  showAIButton: boolean;
  canUseAI: boolean;
  amountNum: number;
  hasValidAmount: boolean;
}

export function useTransactionFormHelpers({
  title,
  amount,
  transactionType,
  isBusiness,
}: UseTransactionFormHelpersProps): UseTransactionFormHelpersReturn {
  // Button appears when title is 3+ chars, but only enabled when amount is valid
  const showAIButton = useMemo(
    () => transactionType !== null && isBusiness !== null && title.length >= 3,
    [transactionType, isBusiness, title.length]
  );

  // Check if amount is a valid number > 0
  const amountNum = useMemo(() => {
    return amount ? parseFloat(amount) : 0;
  }, [amount]);

  const hasValidAmount = useMemo(() => {
    return !isNaN(amountNum) && amountNum > 0;
  }, [amountNum]);

  const canUseAI = useMemo(() => {
    return showAIButton && hasValidAmount;
  }, [showAIButton, hasValidAmount]);

  return {
    showAIButton,
    canUseAI,
    amountNum,
    hasValidAmount,
  };
}

