/**
 * Edit Entry Modal Component
 */

"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";
import { EditEntryModalProps } from "../types";

export function EditEntryModal({ entry, accounts, onSave, onClose }: EditEntryModalProps) {
  const [debitAccountId, setDebitAccountId] = useState(entry.debitAccountId);
  const [creditAccountId, setCreditAccountId] = useState(entry.creditAccountId);
  const [amount, setAmount] = useState(entry.amount);
  const [memo, setMemo] = useState(entry.memo || "");
  const [isBusiness, setIsBusiness] = useState(entry.isBusiness);
  const [showDiff, setShowDiff] = useState(false);

  // Original values for diff comparison
  const originalValues = {
    debitAccountId: entry.debitAccountId,
    creditAccountId: entry.creditAccountId,
    amount: entry.amount,
    memo: entry.memo || "",
    isBusiness: entry.isBusiness,
  };

  // Current values
  const currentValues = {
    debitAccountId,
    creditAccountId,
    amount,
    memo,
    isBusiness,
  };

  // Check if there are changes
  const hasChanges =
    debitAccountId !== originalValues.debitAccountId ||
    creditAccountId !== originalValues.creditAccountId ||
    amount !== originalValues.amount ||
    memo !== originalValues.memo ||
    isBusiness !== originalValues.isBusiness;

  const handleSave = () => {
    onSave(entry._id, {
      debitAccountId: debitAccountId as any,
      creditAccountId: creditAccountId as any,
      amount,
      memo,
      isBusiness,
    });
    onClose();
  };

  const debitAccounts = accounts.filter((a: any) =>
    a.type === "asset" || a.type === "expense" || a.type === "equity"
  );
  const creditAccounts = accounts.filter((a: any) =>
    a.type === "asset" || a.type === "liability" || a.type === "income" || a.type === "equity"
  );

  const getAccountName = (accountId: string) => {
    return accounts.find((a: any) => a._id === accountId)?.name || "Unknown";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Edit Entry</h2>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
              >
                {showDiff ? "Hide" : "Show"} Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff View */}
        {showDiff && hasChanges && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">Changes Preview</h3>
            {debitAccountId !== originalValues.debitAccountId && (
              <div className="text-xs">
                <span className="text-muted-foreground">Debit Account: </span>
                <span className="line-through text-red-600 dark:text-red-400">
                  {getAccountName(originalValues.debitAccountId)}
                </span>
                <span className="mx-2">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {getAccountName(debitAccountId)}
                </span>
              </div>
            )}
            {creditAccountId !== originalValues.creditAccountId && (
              <div className="text-xs">
                <span className="text-muted-foreground">Credit Account: </span>
                <span className="line-through text-red-600 dark:text-red-400">
                  {getAccountName(originalValues.creditAccountId)}
                </span>
                <span className="mx-2">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {getAccountName(creditAccountId)}
                </span>
              </div>
            )}
            {amount !== originalValues.amount && (
              <div className="text-xs">
                <span className="text-muted-foreground">Amount: </span>
                <span className="line-through text-red-600 dark:text-red-400">
                  ${originalValues.amount.toFixed(2)}
                </span>
                <span className="mx-2">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  ${amount.toFixed(2)}
                </span>
              </div>
            )}
            {memo !== originalValues.memo && (
              <div className="text-xs">
                <span className="text-muted-foreground">Memo: </span>
                <span className="line-through text-red-600 dark:text-red-400">
                  {originalValues.memo || "(empty)"}
                </span>
                <span className="mx-2">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {memo || "(empty)"}
                </span>
              </div>
            )}
            {isBusiness !== originalValues.isBusiness && (
              <div className="text-xs">
                <span className="text-muted-foreground">Business: </span>
                <span className="line-through text-red-600 dark:text-red-400">
                  {originalValues.isBusiness ? "Yes" : "No"}
                </span>
                <span className="mx-2">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {isBusiness ? "Yes" : "No"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Debit Account
            </label>
            <select
              value={debitAccountId}
              onChange={(e) => setDebitAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {debitAccounts.map((acc: any) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Credit Account
            </label>
            <select
              value={creditAccountId}
              onChange={(e) => setCreditAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {creditAccounts.map((acc: any) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Memo
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Business transaction</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          {hasChanges && (
            <button
              onClick={() => {
                setDebitAccountId(originalValues.debitAccountId);
                setCreditAccountId(originalValues.creditAccountId);
                setAmount(originalValues.amount);
                setMemo(originalValues.memo);
                setIsBusiness(originalValues.isBusiness);
              }}
              className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

