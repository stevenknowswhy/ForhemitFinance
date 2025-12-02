/**
 * Transaction Filters Component
 */

"use client";

import { Search, ArrowUpDown, Plus, Minus, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionFilters } from "../hooks/useTransactionFilters";

interface TransactionFiltersProps {
  filters: TransactionFilters & {
    showCategoryDropdown: boolean;
    showDatePicker: boolean;
    categoryDropdownRef: React.RefObject<HTMLDivElement>;
    datePickerRef: React.RefObject<HTMLDivElement>;
  };
  allCategories: string[];
  onSearchChange: (value: string) => void;
  onToggleSort: () => void;
  onToggleFilterType: () => void;
  onToggleBusinessFilter: () => void;
  onCategorySelect: (category: string | null) => void;
  onCategoryDropdownToggle: () => void;
}

export function TransactionFilters({
  filters,
  allCategories,
  onSearchChange,
  onToggleSort,
  onToggleFilterType,
  onToggleBusinessFilter,
  onCategorySelect,
  onCategoryDropdownToggle,
}: TransactionFiltersProps) {
  return (
    <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6 mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={filters.searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onToggleSort}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
            filters.sortDirection
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort
        </button>

        <button
          onClick={onToggleFilterType}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
            filters.filterType === "income"
              ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
              : filters.filterType === "expense"
              ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          {filters.filterType === "all" ? (
            <>
              <Plus className="w-3.5 h-3.5" />
              <Minus className="w-3.5 h-3.5" />
            </>
          ) : filters.filterType === "income" ? (
            <Plus className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          {filters.filterType === "all" ? "All" : filters.filterType === "income" ? "Income" : "Expense"}
        </button>

        <div className="relative" ref={filters.categoryDropdownRef}>
          <button
            onClick={onCategoryDropdownToggle}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
              filters.selectedCategory
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Tag className="w-4 h-4" />
            Category
          </button>
          {filters.showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onCategorySelect(null);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                  !filters.selectedCategory ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                All Categories
              </button>
              {allCategories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => {
                    onCategorySelect(cat);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                    filters.selectedCategory === cat ? "bg-primary/10 text-primary" : "text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleBusinessFilter}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
            filters.businessFilter !== "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          <Tag className="w-4 h-4" />
          {filters.businessFilter === "all"
            ? "All"
            : filters.businessFilter === "business"
            ? "Business"
            : "Personal"}
        </button>
      </div>
    </div>
  );
}

