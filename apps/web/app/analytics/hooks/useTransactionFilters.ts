/**
 * Hook for filtering transactions by business/personal
 */

import { useMemo } from "react";

export function useTransactionFilters(allTransactionsRaw: any[] | undefined) {
  const businessTransactions = useMemo(() => {
    if (!allTransactionsRaw) return [];
    return allTransactionsRaw.filter((t: any) => t.isBusiness === true);
  }, [allTransactionsRaw]);
  
  const personalTransactions = useMemo(() => {
    if (!allTransactionsRaw) return [];
    return allTransactionsRaw.filter((t: any) => t.isBusiness === false);
  }, [allTransactionsRaw]);
  
  const allTransactions = allTransactionsRaw || [];

  return {
    businessTransactions,
    personalTransactions,
    allTransactions,
  };
}

