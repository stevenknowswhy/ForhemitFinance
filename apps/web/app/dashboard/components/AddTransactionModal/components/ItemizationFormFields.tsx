/**
 * Itemization Form Fields Component
 * Fields shown only in itemization mode (Default Category, Note, Accounting Preview)
 */

"use client";

import { AccountingPreview } from "../../AccountingPreview";

interface ItemizationFormFieldsProps {
  category: string;
  setCategory: (category: string) => void;
  note: string;
  setNote: (note: string) => void;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  userAccounts: any[] | undefined;
}

export function ItemizationFormFields({
  category,
  setCategory,
  note,
  setNote,
  debitAccountId,
  creditAccountId,
  amount,
  userAccounts,
}: ItemizationFormFieldsProps) {
  return (
    <>
      {/* Default Category (optional) */}
      <div>
        <label className="text-base font-medium text-foreground mb-2 block">
          Default Category (optional)
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Used if line items don't specify categories"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Individual line items can have their own categories
        </p>
      </div>

      {/* Note field always visible in Itemization Mode */}
      <div>
        <label className="text-base font-medium text-foreground mb-2 block">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base min-h-[44px]"
          placeholder="Any additional details you want to remember..."
        />
      </div>

      {/* Accounting Preview - Mobile View (Itemization Mode Only) */}
      {debitAccountId && creditAccountId && amount && (
        <div className="lg:hidden pt-4 border-t border-border">
          <AccountingPreview
            debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
            creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
            amount={parseFloat(amount) || 0}
            explanation="This transaction will be recorded in your books as shown above."
          />
        </div>
      )}
    </>
  );
}

