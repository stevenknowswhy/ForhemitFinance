"use client";

/**
 * EntryPreview Component
 * Displays AI-generated double-entry suggestion with explanation and confidence score
 */

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Check, X, Edit2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
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

  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor =
    confidence >= 0.8
      ? "text-green-600 dark:text-green-400"
      : confidence >= 0.6
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  const handleApprove = async () => {
    try {
      await approveEntry({ entryId });
      onApprove?.();
    } catch (error) {
      console.error("Failed to approve entry:", error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectEntry({ entryId });
      onReject?.();
    } catch (error) {
      console.error("Failed to reject entry:", error);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Suggested Accounting Entry
          </h3>
          {memo && (
            <p className="text-xs text-muted-foreground">{memo}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("text-xs font-medium", confidenceColor)}>
            {confidencePercent}% confidence
          </div>
          {confidence < 0.7 && (
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>
      </div>

      {/* Double-Entry Display */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Debit</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {debitAccountName}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Credit</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {creditAccountName}
          </span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Amount</span>
            <span className="text-base font-bold text-foreground">
              ${amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "bg-green-600 hover:bg-green-700 text-white",
            "dark:bg-green-500 dark:hover:bg-green-600"
          )}
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onEdit || (() => {})}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "border border-border bg-background hover:bg-muted text-foreground"
          )}
          title="Edit entry"
        >
          <Edit2 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={handleReject}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
          )}
          title="Reject entry"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Reject</span>
        </button>
      </div>
    </div>
  );
}

