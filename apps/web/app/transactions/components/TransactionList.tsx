/**
 * Transaction List Component
 */

"use client";

import { Edit2, Trash2, Receipt, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTransactionDate } from "@/lib/dateUtils";
import { Id } from "convex/_generated/dataModel";

interface TransactionListProps {
  transactions: any[];
  onEdit: (transaction: any) => void;
  onDelete: (transactionId: Id<"transactions_raw">) => void;
  onUploadReceipt: (transactionId: Id<"transactions_raw">) => void;
  onViewReceipt: (transactionId: Id<"transactions_raw">) => void;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  onUploadReceipt,
  onViewReceipt,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="p-8 text-center text-muted-foreground">
          No transactions match your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow border border-border divide-y divide-border">
      {transactions.map((transaction: any) => (
        <div key={transaction._id} className="p-4 hover:bg-muted/50 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-medium text-foreground truncate">
                  {transaction.merchantName || transaction.merchant || transaction.description}
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                    transaction.isBusiness === true
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : transaction.isBusiness === false
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {transaction.isBusiness === true
                    ? "Business"
                    : transaction.isBusiness === false
                    ? "Personal"
                    : "Mixed"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground truncate">{transaction.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTransactionDate(transaction.dateTimestamp || transaction.date)} • {transaction.categoryName || (transaction.category && transaction.category[0]) || transaction.merchant || "Uncategorized"}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className={`text-lg font-bold flex-shrink-0 ${transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {transaction.receiptUrl && (
                  <button
                    onClick={() => onViewReceipt(transaction._id)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="View receipts"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                )}
                <button
                  onClick={() => onUploadReceipt(transaction._id)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Upload receipt"
                >
                  <Receipt className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Edit transaction"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <button
                  onClick={() => onDelete(transaction._id)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Delete transaction"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

