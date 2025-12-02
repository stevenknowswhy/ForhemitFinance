/**
 * Hook for filtering and sorting transactions
 */

import { useMemo } from "react";
import type { TransactionFilters } from "./useTransactionFilters";

export function useFilteredTransactions(
  transactions: any[] | undefined,
  filters: TransactionFilters
) {
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((t: any) => {
        const merchant = (t.merchantName || t.merchant || t.description || "").toLowerCase();
        const description = (t.description || "").toLowerCase();
        const category = (t.categoryName || (t.category && t.category[0]) || t.merchant || "").toLowerCase();
        return merchant.includes(query) || description.includes(query) || category.includes(query);
      });
    }

    // Type filter (income/expense)
    if (filters.filterType === "income") {
      filtered = filtered.filter((t: any) => t.amount >= 0);
    } else if (filters.filterType === "expense") {
      filtered = filtered.filter((t: any) => t.amount < 0);
    }

    // Category filter
    if (filters.selectedCategory) {
      filtered = filtered.filter((t: any) => {
        const cat = t.categoryName || (t.category && t.category[0]) || t.merchant || "Uncategorized";
        return cat === filters.selectedCategory;
      });
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter((t: any) => {
        const transactionDate = t.dateTimestamp
          ? new Date(t.dateTimestamp)
          : typeof t.date === 'string'
            ? new Date(t.date)
            : new Date(t.date);
        
        if (filters.dateRange.start && transactionDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (transactionDate > endDate) {
            return false;
          }
        }
        return true;
      });
    }

    // Business/Personal filter
    if (filters.businessFilter === "business") {
      filtered = filtered.filter((t: any) => t.isBusiness === true);
    } else if (filters.businessFilter === "personal") {
      filtered = filtered.filter((t: any) => t.isBusiness === false);
    }

    // Sort
    if (filters.sortDirection === "high-to-low") {
      filtered.sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (filters.sortDirection === "low-to-high") {
      filtered.sort((a: any, b: any) => Math.abs(a.amount) - Math.abs(b.amount));
    }

    return filtered;
  }, [transactions, filters]);

  return filteredTransactions;
}

