"use client";

import { ArrowRight, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountingPreviewProps {
  debitAccountName: string;
  creditAccountName: string;
  amount: number;
  explanation?: string;
  onEdit?: () => void;
  className?: string;
}

export function AccountingPreview({
  debitAccountName,
  creditAccountName,
  amount,
  explanation,
  onEdit,
  className,
}: AccountingPreviewProps) {
  const formattedAmount = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Accounting Preview</h4>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        {/* Debit Entry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Debit:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{debitAccountName}</span>
            <span className="text-sm font-semibold text-foreground">${formattedAmount}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
        </div>

        {/* Credit Entry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Credit:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{creditAccountName}</span>
            <span className="text-sm font-semibold text-foreground">${formattedAmount}</span>
          </div>
        </div>
      </div>

      {/* Plain-language explanation */}
      {explanation && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">{explanation}</p>
        </div>
      )}

      {/* Default explanation if none provided */}
      {!explanation && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This increases your {debitAccountName.toLowerCase()} and decreases your {creditAccountName.toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
}

