"use client";

/**
 * EntryPreview Component
 * Displays AI-generated double-entry suggestion with explanation and confidence score
 */

import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Check, X, Edit2, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface EntryPreviewProps {
  entryId: Id<"entries_proposed">;
  debitAccountName: string;
  creditAccountName: string;
  amount: number;
  explanation: string;
  confidence: number; // 0-1
  memo?: string;
  alternatives?: Array<{
    debitAccountId: string;
    creditAccountId: string;
    debitAccountName: string;
    creditAccountName: string;
    explanation: string;
    confidence: number;
  }>;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}

export function EntryPreview({
  entryId,
  debitAccountName,
  creditAccountName,
  amount,
  explanation,
  confidence,
  memo,
  alternatives = [],
  onApprove,
  onReject,
  onEdit,
}: EntryPreviewProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const approveEntry = useMutation(api.transactions.approveEntry);
  const rejectEntry = useMutation(api.transactions.rejectEntry);

  // Memoize computed values to avoid recalculation on every render
  const confidencePercent = useMemo(() => Math.round(confidence * 100), [confidence]);
  const confidenceColor = useMemo(() => 
    confidence >= 0.8
      ? "text-green-600 dark:text-green-400"
      : confidence >= 0.6
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400",
    [confidence]
  );

  const formattedAmount = useMemo(() => 
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    [amount]
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await approveEntry({ entryId });
      onApprove?.();
    } catch (error) {
      console.error("Failed to approve entry:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [entryId, approveEntry, onApprove, isProcessing]);

  const handleReject = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await rejectEntry({ entryId });
      onReject?.();
    } catch (error) {
      console.error("Failed to reject entry:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [entryId, rejectEntry, onReject, isProcessing]);

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Suggested Accounting Entry
          </h3>
          {memo && (
            <p className="text-xs text-muted-foreground truncate">{memo}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={cn("text-xs font-medium whitespace-nowrap", confidenceColor)}>
            {confidencePercent}% confidence
          </div>
          {confidence < 0.7 && (
            <AlertCircle 
              className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" 
              aria-label="Low confidence warning"
            />
          )}
        </div>
      </div>

      {/* Double-Entry Display */}
      <div className="bg-muted/50 rounded-lg p-2 sm:p-3 space-y-2" role="region" aria-label="Double-entry accounting preview">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Debit</span>
          </div>
          <span className="text-sm font-medium text-foreground truncate text-right ml-2" title={debitAccountName}>
            {debitAccountName}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Credit</span>
          </div>
          <span className="text-sm font-medium text-foreground truncate text-right ml-2" title={creditAccountName}>
            {creditAccountName}
          </span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Amount</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              ${formattedAmount}
            </span>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-primary">AI</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              {showFullExplanation || explanation.length < 150
                ? explanation
                : `${explanation.substring(0, 150)}...`}
            </p>
            {explanation.length > 150 && (
              <button
                onClick={() => setShowFullExplanation(!showFullExplanation)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {showFullExplanation ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alternative Suggestions (if confidence is low) */}
      {alternatives.length > 0 && confidence < 0.7 && (
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showAlternatives ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>
              {alternatives.length} alternative suggestion
              {alternatives.length !== 1 ? "s" : ""}
            </span>
          </button>
          {showAlternatives && (
            <div className="mt-2 space-y-2">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded p-2 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Debit:</span>
                    <span className="font-medium">{alt.debitAccountName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Credit:</span>
                    <span className="font-medium">{alt.creditAccountName}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{alt.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          aria-label="Approve entry"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "bg-green-600 hover:bg-green-700 text-white",
            "dark:bg-green-500 dark:hover:bg-green-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="hidden xs:inline">Approve</span>
          <span className="xs:hidden">OK</span>
        </button>
        <button
          onClick={onEdit || (() => {})}
          aria-label="Edit entry"
          className={cn(
            "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "border border-border bg-background hover:bg-muted text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <Edit2 className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          aria-label="Reject entry"
          className={cn(
            "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <X className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Reject</span>
        </button>
      </div>
    </div>
  );
}

