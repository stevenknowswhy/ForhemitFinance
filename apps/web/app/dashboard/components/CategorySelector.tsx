"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Check, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon, getCategoryIcon } from "./CategoryIcon";

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  onAIClick?: () => void;
  isAILoading?: boolean;
  aiSuggestedCategory?: string;
  aiConfidence?: number;
  isNewCategory?: boolean; // Flag to indicate if AI suggested a new category
  className?: string;
  placeholder?: string;
  showAIButton?: boolean;
  disabled?: boolean;
}

// Default categories for Simple Mode (max 15-20)
const DEFAULT_CATEGORIES = [
  "Food & Drinks",
  "Office Supplies",
  "Travel",
  "Software",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Marketing",
  "Professional Services",
  "Rent",
  "Insurance",
  "Income",
  "Other",
];

export function CategorySelector({
  value,
  onChange,
  onAIClick,
  isAILoading = false,
  aiSuggestedCategory,
  aiConfidence,
  isNewCategory = false,
  className,
  placeholder = "Select a category...",
  showAIButton = false,
  disabled = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Get user's custom categories
  const currentUser = useQuery(api.users.getCurrentUser);
  const customCategories = currentUser?.preferences?.customCategories || [];

  // Combine default and custom categories
  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    // Remove duplicates (case-insensitive)
    const unique = combined.filter((cat, index, self) =>
      index === self.findIndex(c => c.toLowerCase() === cat.toLowerCase())
    );
    return unique;
  }, [customCategories]);

  // Filter categories based on search, or allow free-text if not found
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCategories;
    }
    const query = searchQuery.toLowerCase();
    const matches = allCategories.filter((cat: any) => 
      cat.toLowerCase().includes(query)
    );
    
    // If no matches and user is typing, allow free-text
    if (matches.length === 0 && searchQuery.length > 0) {
      setIsTyping(true);
      return [searchQuery]; // Show the typed value as an option
    }
    setIsTyping(false);
    return matches;
  }, [searchQuery, allCategories]);

  // Determine confidence indicator
  const getConfidenceIndicator = (confidence?: number) => {
    if (!confidence) return null;
    if (confidence >= 0.85) return "✓";
    if (confidence >= 0.70) return "~";
    return "?";
  };

  const confidenceIndicator = aiConfidence ? getConfidenceIndicator(aiConfidence) : null;
  const isAISuggested = aiSuggestedCategory === value && confidenceIndicator;

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchQuery("");
    setIsTyping(false);
  };

  // Handle direct input (free-text mode)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    // If user is typing and it's not in the list, allow free-text
    if (newValue.length > 0 && !allCategories.some(cat => 
      cat.toLowerCase() === newValue.toLowerCase()
    )) {
      onChange(newValue); // Update value directly for free-text
    }
  };

  const selectedCategory = value || placeholder;

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        {/* Category Dropdown */}
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary text-lg",
              "flex items-center justify-between gap-2",
              disabled && "opacity-50 cursor-not-allowed",
              isAISuggested && "bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {value && (
                <>
                  <CategoryIcon category={value} className="text-lg flex-shrink-0" />
                  <span className="truncate">{value}</span>
                  {isNewCategory && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0"
                      title="New category suggested by AI"
                    >
                      New
                    </span>
                  )}
                  {isAISuggested && confidenceIndicator && (
                    <span 
                      className={cn(
                        "text-xs font-medium flex-shrink-0",
                        confidenceIndicator === "✓" && "text-green-600 dark:text-green-400",
                        confidenceIndicator === "~" && "text-yellow-600 dark:text-yellow-400",
                        confidenceIndicator === "?" && "text-orange-600 dark:text-orange-400"
                      )}
                      title={`AI confidence: ${Math.round((aiConfidence || 0) * 100)}%`}
                    >
                      {confidenceIndicator}
                    </span>
                  )}
                </>
              )}
              {!value && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
                {/* Search Input - Supports free-text */}
                <div className="p-2 border-b border-border">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search or type a new category..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    autoFocus
                  />
                  {isTyping && searchQuery && (
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      Press Enter to create "{searchQuery}"
                    </p>
                  )}
                </div>

                {/* Category List */}
                <div className="overflow-y-auto max-h-48">
                  {filteredCategories.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No categories found. Type to create a new one.
                    </div>
                  ) : (
                    filteredCategories.map((category: any) => {
                      const isCustomCategory = isTyping && !allCategories.some((cat: string) =>
                        cat.toLowerCase() === category.toLowerCase()
                      ) || customCategories.some((cat: string) =>
                        cat.toLowerCase() === category.toLowerCase()
                      );
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleSelect(category)}
                          className={cn(
                            "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted transition-colors",
                            value === category && "bg-primary/10"
                          )}
                        >
                          <CategoryIcon category={category} className="text-lg" />
                          <span className="flex-1">{category}</span>
                          {isCustomCategory && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              New
                            </span>
                          )}
                          {value === category && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          {aiSuggestedCategory === category && confidenceIndicator && (
                            <span 
                              className={cn(
                                "text-xs font-medium",
                                confidenceIndicator === "✓" && "text-green-600 dark:text-green-400",
                                confidenceIndicator === "~" && "text-yellow-600 dark:text-yellow-400",
                                confidenceIndicator === "?" && "text-orange-600 dark:text-orange-400"
                              )}
                              title={`AI suggested (${Math.round((aiConfidence || 0) * 100)}% confidence)`}
                            >
                              {confidenceIndicator}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI Button */}
        {showAIButton && onAIClick && (
          <button
            type="button"
            onClick={onAIClick}
            disabled={isAILoading || disabled}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
              "min-w-[44px] min-h-[44px]",
              !disabled && !isAILoading
                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                : "bg-muted text-muted-foreground cursor-not-allowed border border-border",
              isAILoading && "opacity-50 cursor-not-allowed"
            )}
            title="Use AI to suggest category and accounts"
          >
            {isAILoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">AI</span>
          </button>
        )}
      </div>

      {/* AI Suggestion Tooltip */}
      {isAISuggested && aiConfidence && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <span>AI suggested this category ({Math.round(aiConfidence * 100)}% confidence)</span>
        </p>
      )}
    </div>
  );
}

