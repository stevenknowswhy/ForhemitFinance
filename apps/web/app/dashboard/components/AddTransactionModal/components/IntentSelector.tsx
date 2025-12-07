/**
 * IntentSelector Component
 * Allows user to select transaction intent (business/personal + expense/income)
 */

import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionIntent } from "../types";

interface IntentSelectorProps {
  intent: TransactionIntent;
  onIntentSelect: (intent: TransactionIntent) => void;
}

export function IntentSelector({ intent, onIntentSelect }: IntentSelectorProps) {
  const hasLastIntent = typeof window !== "undefined" && localStorage.getItem("lastTransactionIntent");

  return (
    <div className="mb-6 space-y-3 animate-in fade-in duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">
        What kind of transaction are you adding?
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
        Let&apos;s get this done together.
      </p>
      {/* Show subtle hint if we have a last intent preference */}
      {hasLastIntent && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">
          💡 Tip: We&apos;ll remember your choice for next time
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onIntentSelect("business_expense")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
            "hover:scale-105 hover:shadow-md",
            intent === "business_expense"
              ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-md scale-105"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/50"
          )}
        >
          <Briefcase className="w-6 h-6" />
          <span className="font-medium text-base">Business Expense</span>
        </button>
        <button
          type="button"
          onClick={() => onIntentSelect("personal_expense")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
            "hover:scale-105 hover:shadow-md",
            intent === "personal_expense"
              ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md scale-105"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-500/50"
          )}
        >
          <User className="w-6 h-6" />
          <span className="font-medium text-base">Personal Expense</span>
        </button>
        <button
          type="button"
          onClick={() => onIntentSelect("business_income")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
            "hover:scale-105 hover:shadow-md",
            intent === "business_income"
              ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 shadow-md scale-105"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-green-500/50"
          )}
        >
          <Briefcase className="w-6 h-6" />
          <span className="font-medium text-base">Business Income</span>
        </button>
        <button
          type="button"
          onClick={() => onIntentSelect("personal_income")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all min-h-[100px]",
            "hover:scale-105 hover:shadow-md",
            intent === "personal_income"
              ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 shadow-md scale-105"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-green-500/50"
          )}
        >
          <User className="w-6 h-6" />
          <span className="font-medium text-base">Personal Income</span>
        </button>
      </div>
    </div>
  );
}

