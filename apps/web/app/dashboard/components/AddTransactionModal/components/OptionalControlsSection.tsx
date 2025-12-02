/**
 * OptionalControlsSection Component
 * Displays optional controls for simple mode (More Details, Itemization, Receipt Upload, Double Entry Accounts)
 */

"use client";

import { ChevronDown, ArrowRight, Sparkles, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AccountingPreview } from "../../AccountingPreview";
import { ReceiptSection } from "./ReceiptSection";

interface OptionalControlsSectionProps {
  // Form values
  note: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  
  // Setters
  setNote: (value: string) => void;
  setDescription: (value: string) => void;
  setDebitAccountId: (value: string) => void;
  setCreditAccountId: (value: string) => void;
  setTitle: (value: string) => void;
  setAmount: (value: string) => void;
  setDate: (value: string) => void;
  setUseAI: (value: boolean) => void;
  
  // UI state
  showMoreDetails: boolean;
  setShowMoreDetails: (value: boolean) => void;
  showAccountingPreview: boolean;
  setShowAccountingPreview: (value: boolean) => void;
  
  // Handlers
  handleItemizationToggle: (value: boolean) => void;
  handleDoubleEntryAI: () => Promise<void>;
  setShowReceiptUpload: (value: boolean) => void;
  
  // Receipt props
  receipts: Array<{ fileUrl?: string; ocrData?: any }> | undefined;
  uploadedReceipts: Array<{ url: string; ocrData?: any }>;
  isProcessingOCR: boolean;
  
  // AI props
  isAILoading: boolean;
  canUseAI: boolean;
  useAI: boolean;
  title: string;
  
  // Accounts
  userAccounts: any[] | undefined;
}

export function OptionalControlsSection({
  note,
  description,
  debitAccountId,
  creditAccountId,
  amount,
  setNote,
  setDescription,
  setDebitAccountId,
  setCreditAccountId,
  setTitle,
  setAmount,
  setDate,
  setUseAI,
  showMoreDetails,
  setShowMoreDetails,
  showAccountingPreview,
  setShowAccountingPreview,
  handleItemizationToggle,
  handleDoubleEntryAI,
  setShowReceiptUpload,
  receipts,
  uploadedReceipts,
  isProcessingOCR,
  isAILoading,
  canUseAI,
  useAI,
  title,
  userAccounts,
}: OptionalControlsSectionProps) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-200/50">
      {/* More Details */}
      <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
        <CollapsibleTrigger className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group">
          <span className="group-hover:underline">Want to add more details?</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            showMoreDetails && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Want to add a note for your future self?
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none text-base min-h-[44px]"
              placeholder="Any additional details you want to remember..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 block">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm resize-none min-h-[44px]"
              placeholder="Add more details about this transaction..."
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Itemization */}
      <button
        type="button"
        onClick={() => handleItemizationToggle(true)}
        className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group"
      >
        <span className="group-hover:underline">Want to itemize this receipt?</span>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Receipt Upload */}
      <ReceiptSection
        receipts={receipts}
        uploadedReceipts={uploadedReceipts}
        isProcessingOCR={isProcessingOCR}
        onFieldClick={(field, value) => {
          if (field === "merchant") {
            setTitle(value as string);
          } else if (field === "amount") {
            setAmount((value as number).toFixed(2));
          } else if (field === "date") {
            setDate(value as string);
          }
        }}
        onUploadClick={() => setShowReceiptUpload(true)}
        showInMobile={false}
      />

      {/* Double Entry Accounts - Full CRUD */}
      <Collapsible open={showAccountingPreview} onOpenChange={setShowAccountingPreview}>
        <CollapsibleTrigger className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group">
          <span className="group-hover:underline">
            {debitAccountId && creditAccountId 
              ? "See how this will be recorded in your books?" 
              : "Want to set up double-entry accounts?"}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            showAccountingPreview && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Accounting Preview - Show if accounts are set */}
          {debitAccountId && creditAccountId && (
            <AccountingPreview
              debitAccountName={userAccounts?.find((a: any) => a._id === debitAccountId)?.name || "Unknown"}
              creditAccountName={userAccounts?.find((a: any) => a._id === creditAccountId)?.name || "Unknown"}
              amount={parseFloat(amount) || 0}
              explanation={useAI ? "AI-generated double-entry suggestion. You can edit the accounts below." : "This transaction will be recorded in your books as shown above."}
            />
          )}

          {/* Double Entry Account Selectors */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Double Entry Accounts
              </label>
              <div className="flex items-center gap-2">
                {/* AI Suggestion Button */}
                <button
                  type="button"
                  onClick={handleDoubleEntryAI}
                  disabled={isAILoading || !title || !amount || !canUseAI}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "bg-primary/10 text-primary hover:bg-primary/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isAILoading && "opacity-75"
                  )}
                  title="Use AI to suggest accounts"
                >
                  {isAILoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>AI</span>
                    </>
                  )}
                </button>
                {/* Clear Button */}
                {(debitAccountId || creditAccountId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDebitAccountId("");
                      setCreditAccountId("");
                      setUseAI(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Clear accounts"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1.5 block">
                  Debit Account
                </label>
                <select
                  value={debitAccountId || ""}
                  onChange={(e) => setDebitAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px]"
                >
                  <option value="">Select account...</option>
                  {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset" || a.type === "cost").map((acc: any) => (
                    <option key={acc._id} value={acc._id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1.5 block">
                  Credit Account
                </label>
                <select
                  value={creditAccountId || ""}
                  onChange={(e) => setCreditAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px]"
                >
                  <option value="">Select account...</option>
                  {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset" || a.type === "revenue" || a.type === "equity").map((acc: any) => (
                    <option key={acc._id} value={acc._id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save indicator */}
            {debitAccountId && creditAccountId && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 pt-1">
                <Check className="w-3 h-3" />
                <span>Accounts saved. These will be used when you save the transaction.</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

