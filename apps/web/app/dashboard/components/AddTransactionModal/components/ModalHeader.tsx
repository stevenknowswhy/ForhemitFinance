/**
 * ModalHeader Component
 * Header with title and close button for the transaction modal
 */

"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionIntent } from "../types";

interface ModalHeaderProps {
  intent: TransactionIntent | null;
  onClose: () => void;
  onResetIntent: () => void;
  isAILoading: boolean;
}

export function ModalHeader({
  intent,
  onClose,
  onResetIntent,
  isAILoading,
}: ModalHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between">
      <div className="flex items-center gap-2">
        <h2 id="transaction-modal-title" className="text-lg font-semibold text-slate-900">Add Transaction</h2>
        {intent !== null && (
          <button
            type="button"
            onClick={onResetIntent}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
            title="Change transaction type"
          >
            Change
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close modal"
        disabled={isAILoading}
      >
        <X className="w-5 h-5" />
      </button>
    </header>
  );
}

