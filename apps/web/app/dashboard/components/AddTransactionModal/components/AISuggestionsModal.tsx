/**
 * AISuggestionsModal Component
 * Displays AI-generated suggestions for transaction categorization and double-entry accounts
 */

import { X, RotateCcw, Loader2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AISuggestion } from "../types";

interface AISuggestionsModalProps {
  isOpen: boolean;
  suggestions: AISuggestion[];
  isLoading: boolean;
  description?: string;
  onSelectSuggestion: (suggestion: AISuggestion) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export function AISuggestionsModal({
  isOpen,
  suggestions,
  isLoading,
  description,
  onSelectSuggestion,
  onRegenerate,
  onClose,
}: AISuggestionsModalProps) {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">AI Suggestions</h2>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <div className="relative group">
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title="Generate another suggestion"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Generate another suggestion
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {suggestions.length > 1 
            ? "Select the suggestion that best matches your transaction:"
            : "AI suggestion for your transaction:"}
        </p>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {/* Category Suggestion */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Category</span>
                  {suggestion.isNewCategory && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                      New Category
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-base font-semibold text-foreground">
                    {suggestion.category}
                  </span>
                  {suggestion.confidence && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(suggestion.confidence * 100)}% confidence)
                    </span>
                  )}
                </div>
                {suggestion.explanation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {suggestion.explanation}
                  </p>
                )}
              </div>

              {/* Double-Entry Preview */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Debit:</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {suggestion.debitAccountName || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Credit:</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {suggestion.creditAccountName || "Not specified"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectSuggestion(suggestion)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Use This Suggestion
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

