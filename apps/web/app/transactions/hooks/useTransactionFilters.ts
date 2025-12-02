/**
 * Hook for managing transaction filters and sorting
 */

import { useState, useMemo, useRef, useEffect } from "react";

export interface TransactionFilters {
  searchQuery: string;
  sortDirection: "high-to-low" | "low-to-high" | null;
  filterType: "income" | "expense" | "all";
  selectedCategory: string | null;
  dateRange: { start: Date | null; end: Date | null };
  businessFilter: "all" | "business" | "personal";
}

export function useTransactionFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"high-to-low" | "low-to-high" | null>(null);
  const [filterType, setFilterType] = useState<"income" | "expense" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [businessFilter, setBusinessFilter] = useState<"all" | "business" | "personal">("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showCategoryDropdown || showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCategoryDropdown, showDatePicker]);

  // Toggle sort direction
  const toggleSort = () => {
    if (sortDirection === null) {
      setSortDirection("high-to-low");
    } else if (sortDirection === "high-to-low") {
      setSortDirection("low-to-high");
    } else {
      setSortDirection(null);
    }
  };

  // Toggle filter type
  const toggleFilterType = () => {
    if (filterType === "all") {
      setFilterType("income");
    } else if (filterType === "income") {
      setFilterType("expense");
    } else {
      setFilterType("all");
    }
  };

  // Toggle business filter
  const toggleBusinessFilter = () => {
    setBusinessFilter(
      businessFilter === "all"
        ? "business"
        : businessFilter === "business"
        ? "personal"
        : "all"
    );
  };

  return {
    // State
    searchQuery,
    sortDirection,
    filterType,
    selectedCategory,
    dateRange,
    businessFilter,
    showCategoryDropdown,
    showDatePicker,
    categoryDropdownRef,
    datePickerRef,
    // Setters
    setSearchQuery,
    setSortDirection,
    setFilterType,
    setSelectedCategory,
    setDateRange,
    setBusinessFilter,
    setShowCategoryDropdown,
    setShowDatePicker,
    // Toggle functions
    toggleSort,
    toggleFilterType,
    toggleBusinessFilter,
  };
}

