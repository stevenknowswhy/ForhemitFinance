/**
 * Edit Transaction Modal Component
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTransactionModalProps {
  transaction: any;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}

export function EditTransactionModal({
  transaction,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const [description, setDescription] = useState(transaction.description || "");
  const [amount, setAmount] = useState(Math.abs(transaction.amount).toString());
  const [date, setDate] = useState(
    transaction.dateTimestamp
      ? new Date(transaction.dateTimestamp).toISOString().split("T")[0]
      : typeof transaction.date === 'string' 
        ? transaction.date // Already in YYYY-MM-DD format
        : new Date(transaction.date).toISOString().split("T")[0]
  );
  const [category, setCategory] = useState(
    transaction.categoryName || (transaction.category && transaction.category[0]) || transaction.merchant || ""
  );
  const [isBusiness, setIsBusiness] = useState<boolean | null>(
    transaction.isBusiness !== undefined ? transaction.isBusiness : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) return;

      const updates: any = {
        description,
        amount: transaction.amount >= 0 ? amountNum : -amountNum,
        date,
        merchant: category || undefined,
        category: category ? [category] : undefined,
      };

      if (isBusiness !== null) {
        updates.isBusiness = isBusiness;
      }

      await onSave(updates);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Office Supplies, Food, Travel"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBusiness(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                  isBusiness === true
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setIsBusiness(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                  isBusiness === false
                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                Personal
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description || !amount}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors",
                "bg-primary hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

