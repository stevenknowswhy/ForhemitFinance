/**
 * Modal Footer Component
 * Footer buttons for the transaction modal
 */

"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionIntent } from "../types";

interface ModalFooterProps {
  intent: TransactionIntent;
  isSubmitting: boolean;
  showSaveSuccess: boolean;
  showItemization: boolean;
  lineItemsLength: number;
  title: string;
  amount: string;
  onClose: () => void;
  onSaveAndAddAnother: () => void;
}

export function ModalFooter({
  intent,
  isSubmitting,
  showSaveSuccess,
  showItemization,
  lineItemsLength,
  title,
  amount,
  onClose,
  onSaveAndAddAnother,
}: ModalFooterProps) {
  const isDisabled = isSubmitting || 
    showSaveSuccess ||
    !title || 
    !amount || 
    (showItemization && lineItemsLength === 0);

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onClose}
        className="h-9 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSaveAndAddAnother}
          disabled={isDisabled}
          className={cn(
            "h-9 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hidden sm:block"
          )}
          title="Save and add another transaction (Cmd/Ctrl + Enter)"
        >
          Save & Add Another
        </button>
        <button
          type="submit"
          form="transaction-form"
          disabled={isDisabled}
          className={cn(
            "flex-1 sm:flex-none px-6 py-4 rounded-xl font-semibold text-base transition-all min-h-[52px]",
            "hover:scale-105 hover:shadow-lg active:scale-95",
            showSaveSuccess
              ? "bg-green-600 text-white"
              : intent?.includes("expense")
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
        >
          {showSaveSuccess ? (
            <>
              <Check className="w-5 h-5 inline mr-2 animate-in zoom-in duration-200" />
              Saved!
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}

