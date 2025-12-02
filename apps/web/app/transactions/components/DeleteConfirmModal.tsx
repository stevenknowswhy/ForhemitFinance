/**
 * Delete Confirmation Modal Component
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";

interface DeleteConfirmModalProps {
  transactionId: Id<"transactions_raw">;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  transactionId,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-foreground mb-4">Delete Transaction</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors",
              "bg-red-600 hover:bg-red-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

