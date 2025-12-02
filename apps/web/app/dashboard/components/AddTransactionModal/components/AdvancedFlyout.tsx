/**
 * AdvancedFlyout Component
 * Side panel for advanced options (Itemization, Notes, Receipt Upload, Accounting Preview)
 */

"use client";

import { X, Receipt, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ReceiptPreview } from "../../ReceiptPreview";
import { AccountingPreview } from "../../AccountingPreview";

interface AdvancedFlyoutProps {
  // State
  advancedOpen: boolean;
  setAdvancedOpen: (value: boolean) => void;
  note: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  showAccountingPreview: boolean;
  setShowAccountingPreview: (value: boolean) => void;
  useAI: boolean;
  
  // Setters
  setNote: (value: string) => void;
  setTitle: (value: string) => void;
  setAmount: (value: string) => void;
  setDate: (value: string) => void;
  setDebitAccountId: (value: string) => void;
  setCreditAccountId: (value: string) => void;
  
  // Handlers
  enableItemization: () => void;
  setShowReceiptUpload: (value: boolean) => void;
  
  // Receipt props
  receipts: Array<{ fileUrl?: string; ocrData?: any }> | undefined;
  uploadedReceipts: Array<{ url: string; ocrData?: any }>;
  isProcessingOCR: boolean;
  
  // Accounts
  userAccounts: any[] | undefined;
}

export function AdvancedFlyout({
  advancedOpen,
  setAdvancedOpen,
  note,
  debitAccountId,
  creditAccountId,
  amount,
  showAccountingPreview,
  setShowAccountingPreview,
  useAI,
  setNote,
  setTitle,
  setAmount,
  setDate,
  setDebitAccountId,
  setCreditAccountId,
  enableItemization,
  setShowReceiptUpload,
  receipts,
  uploadedReceipts,
  isProcessingOCR,
  userAccounts,
}: AdvancedFlyoutProps) {
  if (!advancedOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[55] md:bg-black/20"
        onClick={() => setAdvancedOpen(false)}
      />
      
      {/* Flyout Panel */}
      <aside className={cn(
        "fixed z-[60] bg-white shadow-xl",
        "md:inset-y-6 md:right-6 md:w-full md:max-w-[420px] md:rounded-l-2xl md:border-l",
        "bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl border-t",
        "flex flex-col overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Advanced Options</h3>
          <button
            onClick={() => setAdvancedOpen(false)}
            className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close advanced options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Itemization */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Itemize Receipt</h4>
            <p className="text-xs text-slate-500 mb-3">
              Break this receipt into multiple items and categories
            </p>
            <button
              type="button"
              onClick={() => {
                enableItemization();
                setAdvancedOpen(false);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
            >
              Enable Itemization
            </button>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Notes & Tags</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm resize-none"
              placeholder="Any additional details you want to remember..."
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Attach Receipt</h4>
            <p className="text-xs text-slate-500 mb-3">
              Upload a photo of your receipt for OCR processing
            </p>
            <button
              type="button"
              onClick={() => {
                setShowReceiptUpload(true);
                setAdvancedOpen(false);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Upload Receipt
            </button>
          </div>

          {/* Receipt Preview (if exists) */}
          {((receipts && receipts.length > 0 && receipts[0]) || (uploadedReceipts.length > 0 && uploadedReceipts[0])) && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Receipt Preview</h4>
              <ReceiptPreview
                receiptUrl={receipts?.[0]?.fileUrl || uploadedReceipts[0]?.url || ""}
                ocrData={receipts?.[0]?.ocrData || uploadedReceipts[0]?.ocrData}
                isProcessing={isProcessingOCR}
                onFieldClick={(field, value) => {
                  if (field === "merchant") {
                    setTitle(value as string);
                  } else if (field === "amount") {
                    setAmount((value as number).toFixed(2));
                  } else if (field === "date") {
                    setDate(value as string);
                  }
                }}
              />
            </div>
          )}

          {/* Accounting Preview */}
          {/* Double-Entry Preview with Toggle */}
          {debitAccountId && creditAccountId && amount && (
            <Collapsible open={showAccountingPreview} onOpenChange={setShowAccountingPreview}>
              <CollapsibleTrigger className="w-full text-left text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors py-2 flex items-center justify-between group">
                <span className="flex items-center gap-2">
                  <span>Double-Entry Bookkeeping Preview</span>
                  {useAI && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      AI Suggested
                    </span>
                  )}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200 text-slate-500",
                  showAccountingPreview && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 animate-in slide-in-from-top-2 duration-200">
                <AccountingPreview
                  debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
                  creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
                  amount={parseFloat(amount) || 0}
                  explanation={useAI ? "AI-generated double-entry suggestion. You can edit the accounts below." : "This transaction will be recorded in your books as shown above."}
                  onEdit={() => {
                    // Toggle account editing section
                    setShowAccountingPreview(!showAccountingPreview);
                  }}
                />
                {/* Account Selectors for Editing */}
                {showAccountingPreview && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-900 mb-1 block">Debit Account</label>
                      <select
                        value={debitAccountId || ""}
                        onChange={(e) => setDebitAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="">Select account...</option>
                        {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset").map((acc: any) => (
                          <option key={acc._id} value={acc._id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-900 mb-1 block">Credit Account</label>
                      <select
                        value={creditAccountId || ""}
                        onChange={(e) => setCreditAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="">Select account...</option>
                        {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset").map((acc: any) => (
                          <option key={acc._id} value={acc._id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </aside>
    </>
  );
}

