/**
 * TransactionTypeToggle Component
 * Displays business/personal toggle with visual indicator
 */

"use client";

import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionIntent } from "../types";

interface TransactionTypeToggleProps {
  isBusiness: boolean;
  transactionType: "income" | "expense" | null;
  onToggle: () => void;
}

export function TransactionTypeToggle({
  isBusiness,
  transactionType,
  onToggle,
}: TransactionTypeToggleProps) {
  return (
    <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        {isBusiness ? (
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isBusiness ? "Business" : "Personal"} {transactionType === "income" ? "Income" : "Expense"}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
          "border border-border bg-background hover:bg-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary"
        )}
        title={`Switch to ${isBusiness ? "Personal" : "Business"}`}
      >
        {isBusiness ? (
          <>
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Switch to Personal</span>
            <span className="sm:hidden">Personal</span>
          </>
        ) : (
          <>
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Switch to Business</span>
            <span className="sm:hidden">Business</span>
          </>
        )}
      </button>
    </div>
  );
}

