/**
 * Hook for filtering and sorting entries
 */

import { useMemo } from "react";
import { SortField, SortOrder, ConfidenceFilter, FilterType } from "../types";

interface UseFilterAndSortProps {
  entries: any[] | undefined;
  searchQuery: string;
  filterByAccount: string | "all";
  filterByConfidence: ConfidenceFilter;
  sortField: SortField;
  sortOrder: SortOrder;
  filterType: FilterType;
}

export function useFilterAndSort({
  entries,
  searchQuery,
  filterByAccount,
  filterByConfidence,
  sortField,
  sortOrder,
  filterType,
}: UseFilterAndSortProps) {
  const filteredAndSortedEntries = useMemo(() => {
    if (!entries) return [];

    let filtered = [...entries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry: any) => {
        const memo = entry.memo?.toLowerCase() || "";
        const debitAccount = entry.debitAccount?.name?.toLowerCase() || "";
        const creditAccount = entry.creditAccount?.name?.toLowerCase() || "";
        const transaction = entry.transaction;
        const description = transaction?.description?.toLowerCase() || "";
        const merchant = transaction?.merchant?.toLowerCase() || "";

        return (
          memo.includes(query) ||
          debitAccount.includes(query) ||
          creditAccount.includes(query) ||
          description.includes(query) ||
          merchant.includes(query)
        );
      });
    }

    // Account filter
    if (filterByAccount !== "all") {
      filtered = filtered.filter((entry: any) => {
        return (
          entry.debitAccountId === filterByAccount ||
          entry.creditAccountId === filterByAccount
        );
      });
    }

    // Confidence filter
    if (filterByConfidence !== "all") {
      filtered = filtered.filter((entry: any) => {
        const confidence = entry.confidence || 0;
        if (filterByConfidence === "high") return confidence >= 0.8;
        if (filterByConfidence === "medium") return confidence >= 0.6 && confidence < 0.8;
        if (filterByConfidence === "low") return confidence < 0.6;
        return true;
      });
    }

    // Business/Personal filter (from prop)
    if (filterType !== "all") {
      filtered = filtered.filter((entry: any) => {
        if (filterType === "business") return entry.isBusiness === true;
        if (filterType === "personal") return entry.isBusiness === false;
        return true;
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = a.date || 0;
          bValue = b.date || 0;
          break;
        case "amount":
          aValue = Math.abs(a.amount || 0);
          bValue = Math.abs(b.amount || 0);
          break;
        case "confidence":
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case "account":
          aValue = (a.debitAccount?.name || "").toLowerCase();
          bValue = (b.debitAccount?.name || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [entries, searchQuery, filterByAccount, filterByConfidence, sortField, sortOrder, filterType]);

  return { filteredAndSortedEntries };
}

