/**
 * TransactionFormFields Component
 * Main form inputs for transaction entry (Where, Amount, When, Category)
 */

"use client";

import { Check, AlertTriangle, Info, Loader2, ArrowRight, ChevronDown, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateSelector } from "../../DateSelector";
import { CategorySelector } from "../../CategorySelector";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AccountingPreview } from "../../AccountingPreview";
import { ReceiptSection } from "./ReceiptSection";
import type { AISuggestion } from "../types";

interface TransactionFormFieldsProps {
  // Form values
  title: string;
  amount: string;
  date: string;
  category: string;
  note: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  
  // Form state
  completedFields: Set<string>;
  showItemization: boolean;
  errors: {
    title?: string;
    amount?: string;
    date?: string;
    category?: string;
  };
  
  // Setters
  setTitle: (value: string) => void;
  setAmount: (value: string) => void;
  setDate: (value: string) => void;
  setCategory: (value: string) => void;
  setNote: (value: string) => void;
  setDescription: (value: string) => void;
  setDebitAccountId: (value: string) => void;
  setCreditAccountId: (value: string) => void;
  setErrors: (updater: (prev: any) => any) => void;
  
  // UI state
  showMoreDetails: boolean;
  setShowMoreDetails: (value: boolean) => void;
  showAccountingPreview: boolean;
  setShowAccountingPreview: (value: boolean) => void;
  showSplitPrompt: boolean;
  setShowSplitPrompt: (value: boolean) => void;
  showSplitInfoModal: boolean;
  setShowSplitInfoModal: (value: boolean) => void;
  
  // Receipt props
  receipts: Array<{ fileUrl?: string; ocrData?: any }> | undefined;
  uploadedReceipts: Array<{ url: string; ocrData?: any }>;
  isProcessingOCR: boolean;
  setShowReceiptUpload: (value: boolean) => void;
  
  // AI props
  showAIButton: boolean;
  canUseAI: boolean;
  isAILoading: boolean;
  aiSuggestedCategory: string | null;
  aiCategoryConfidence: number | null;
  aiSuggestions: AISuggestion[] | null;
  handleManualAITrigger: () => Promise<void>;
  handleDoubleEntryAI: () => Promise<void>;
  useAI: boolean;
  setUseAI: (value: boolean) => void;
  
  // Similar transaction detection
  hasSimilarTransaction: boolean;
  autoPopulated: boolean;
  setAutoPopulated: (value: boolean) => void;
  
  // Duplicate detection
  duplicateMatch: { amount: number; daysAgo: number } | null;
  duplicateDismissed: boolean;
  setDuplicateDismissed: (value: boolean) => void;
  
  // Split handling
  isLoadingSplit: boolean;
  handleSplitSuggestion: () => void;
  handleItemizationToggle: (value: boolean) => void;
  
  // Accounts
  userAccounts: any[] | undefined;
}

export function TransactionFormFields({
  title,
  amount,
  date,
  category,
  note,
  description,
  debitAccountId,
  creditAccountId,
  completedFields,
  showItemization,
  errors,
  setTitle,
  setAmount,
  setDate,
  setCategory,
  setNote,
  setDescription,
  setDebitAccountId,
  setCreditAccountId,
  setErrors,
  showMoreDetails,
  setShowMoreDetails,
  showAccountingPreview,
  setShowAccountingPreview,
  showSplitPrompt,
  setShowSplitPrompt,
  showSplitInfoModal,
  setShowSplitInfoModal,
  receipts,
  uploadedReceipts,
  isProcessingOCR,
  setShowReceiptUpload,
  showAIButton,
  canUseAI,
  isAILoading,
  aiSuggestedCategory,
  aiCategoryConfidence,
  aiSuggestions,
  handleManualAITrigger,
  handleDoubleEntryAI,
  useAI,
  setUseAI,
  hasSimilarTransaction,
  autoPopulated,
  duplicateMatch,
  duplicateDismissed,
  setDuplicateDismissed,
  isLoadingSplit,
  handleSplitSuggestion,
  handleItemizationToggle,
  userAccounts,
  setAutoPopulated,
}: TransactionFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* Step 1: Where - Always visible */}
      <div className={cn(
        "transition-all duration-300",
        completedFields.has('where') && "opacity-100"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-slate-900">
            Where did you spend this?
          </label>
          {completedFields.has('where') && (
            <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.length < 3) {
                setAutoPopulated(false);
              }
              setDuplicateDismissed(false);
              if (errors.title) {
                setErrors(prev => ({ ...prev, title: "" }));
              }
            }}
            required
            aria-label="Where did you spend this?"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base min-h-[44px] transition-all duration-200",
              errors.title ? "border-red-500 focus:ring-red-500" : title ? "border-green-500/50" : "border-slate-200"
            )}
            placeholder="Where did you spend the money?"
          />
          {title && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in fade-in duration-200" />
          )}
        </div>
        {errors.title && (
          <p id="title-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            {errors.title}
          </p>
        )}

        {hasSimilarTransaction && !useAI && title.length >= 3 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 animate-in fade-in duration-200">
            <Check className="w-3 h-3" />
            <span>Got it! We found a similar transaction and filled in the details.</span>
          </p>
        )}

        {/* Duplicate Detection Alert */}
        {duplicateMatch && !duplicateDismissed && title.length >= 3 && amount && (
          <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Possible duplicate transaction
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  This looks similar to a ${Math.abs(duplicateMatch.amount).toFixed(2)} transaction from {duplicateMatch.daysAgo === 0 ? "today" : duplicateMatch.daysAgo === 1 ? "yesterday" : `${duplicateMatch.daysAgo} days ago`}.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateDismissed(true)}
                    className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                  >
                    Yes, ignore
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateDismissed(true)}
                    className="text-xs px-3 py-1 border border-yellow-600 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-500/10 transition-colors"
                  >
                    No, both are valid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Amount - Visible when Where is complete */}
      {(completedFields.has('where') || showItemization) && (
        <div className={cn(
          "transition-all duration-300",
          completedFields.has('where') || showItemization 
            ? "animate-in fade-in slide-in-from-top-2 opacity-100" 
            : "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-slate-900">
              How much was the total?
            </label>
            {completedFields.has('amount') && (
              <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: "" }));
                }
              }}
              required
              step="0.01"
              min="0"
              aria-label="How much was the total?"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
              className={cn(
                "w-full pl-10 pr-3 py-2.5 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base min-h-[44px] transition-all duration-200",
                errors.amount ? "border-red-500 focus:ring-red-500" : amount ? "border-green-500/50" : "border-slate-200"
              )}
              placeholder="Enter the total amount on the receipt."
            />
            {amount && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in fade-in duration-200" />
            )}
          </div>
          {errors.amount && (
            <p id="amount-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              {errors.amount}
            </p>
          )}

          {/* Split Transaction Prompt */}
          {showSplitPrompt && !showItemization && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Want to split this into multiple categories?
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSplitInfoModal(true)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-100"
                      aria-label="Learn more about splitting transactions"
                      title="Learn more about splitting transactions"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Split large purchases (like Costco or Amazon orders) into separate line items with different categories. This gives you more accurate expense tracking and better tax categorization.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSplitSuggestion}
                  disabled={isLoadingSplit}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                >
                  {isLoadingSplit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    "Yes, Split This Transaction"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSplitPrompt(false)}
                  className="px-4 py-2.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors min-h-[44px]"
                >
                  No Thanks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: When - Visible when Amount is complete */}
      {(completedFields.has('amount') || showItemization) && (
        <div className={cn(
          "transition-all duration-300",
          completedFields.has('amount') || showItemization
            ? "animate-in fade-in slide-in-from-top-2 opacity-100"
            : "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-slate-900">
              When did this happen?
            </label>
            {completedFields.has('when') && (
              <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200" />
            )}
          </div>
          <DateSelector
            value={date}
            onChange={setDate}
          />
          {errors.date && (
            <p id="date-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              {errors.date}
            </p>
          )}
        </div>
      )}

      {/* Step 4: Category - Visible when When is complete */}
      {!showItemization && (completedFields.has('when') || completedFields.size === 0) && (
        <div className={cn(
          "transition-all duration-300",
          completedFields.has('when') || completedFields.size === 0
            ? "animate-in fade-in slide-in-from-top-2 opacity-100"
            : "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-slate-900">
              Want help choosing a category?
            </label>
            {autoPopulated && (
              <span className="ml-2 text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Got it!
              </span>
            )}
            {completedFields.has('category') && (
              <Check className="w-4 h-4 text-green-500 animate-in fade-in duration-200 ml-auto" />
            )}
          </div>
          <CategorySelector
            value={category}
            onChange={setCategory}
            onAIClick={showAIButton && canUseAI ? () => handleManualAITrigger() : undefined}
            isAILoading={isAILoading}
            aiSuggestedCategory={aiSuggestedCategory ?? undefined}
            aiConfidence={aiCategoryConfidence ?? undefined}
            isNewCategory={aiSuggestions?.some(s => s.category === category && s.isNewCategory) || false}
            showAIButton={showAIButton}
            disabled={!canUseAI && showAIButton}
          />
          {errors.category && (
            <p id="category-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              {errors.category}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

