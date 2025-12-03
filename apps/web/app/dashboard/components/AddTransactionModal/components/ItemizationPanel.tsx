/**
 * ItemizationPanel Component
 * Displays the itemized receipt section with line items management
 */

"use client";

import { Plus, Trash2, Sparkles, Loader2, X, Check, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategorySelector } from "../../CategorySelector";
import { AccountingPreview } from "../../AccountingPreview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { LineItem, ReceiptOCRData } from "../types";
import { parseAmount } from "../utils/calculationHelpers";

interface ItemizationPanelProps {
  // Line items state
  lineItems: LineItem[];
  lineItemsTotal: number;
  totalsMatch: boolean;
  totalsDifference: number;
  amount: string;
  
  // Line items handlers
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string) => void;
  disableItemization: () => void;
  
  // AI for line items
  handleLineItemAI: (lineItemId: string) => Promise<void>;
  lineItemAILoading: Record<string, boolean>;
  lineItemAISuggestions: Record<string, any[]>;
  
  // Receipt OCR
  receiptOCRData: ReceiptOCRData | null;
  setLineItems: (items: LineItem[]) => void;
  
  // Accounts
  userAccounts: any[] | undefined;
}

export function ItemizationPanel({
  lineItems,
  lineItemsTotal,
  totalsMatch,
  totalsDifference,
  amount,
  addLineItem,
  removeLineItem,
  updateLineItem,
  disableItemization,
  handleLineItemAI,
  lineItemAILoading,
  lineItemAISuggestions,
  receiptOCRData,
  setLineItems,
  userAccounts,
}: ItemizationPanelProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Itemized Receipt</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Break this receipt into multiple items and categories
          </p>
        </div>
        <button
          type="button"
          onClick={() => disableItemization()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to simple
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {/* Parse Receipt Items Button */}
          {receiptOCRData?.items && receiptOCRData.items.length > 0 && lineItems.length === 0 && (
            <button
              type="button"
              onClick={() => {
                // Pre-fill line items from OCR
                                                  setLineItems(receiptOCRData.items?.map((item: any, index: number) => ({
                                                    id: Date.now().toString() + index,
                                                    description: item.description || "",
                                                    category: "",
                                                    amount: item.amount.toFixed(2),
                                                    tax: "",
                                                    tip: "",
                                                    debitAccountId: "",
                                                    creditAccountId: "",
                                                  })) || []);;
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              Parse Receipt Items
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {lineItems.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            No line items yet. Click "Add Item" to start itemizing.
          </p>
          <button
            type="button"
            onClick={addLineItem}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={item.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Item {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Description *
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="e.g., Coffee, Office Chair, Software Subscription"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => handleLineItemAI(item.id)}
                      disabled={lineItemAILoading[item.id] || !item.description || !item.amount}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all",
                        item.description && item.amount && !lineItemAILoading[item.id]
                          ? "text-primary hover:bg-primary/10"
                          : "text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                      title="Use AI to suggest category and accounts"
                    >
                      {lineItemAILoading[item.id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <CategorySelector
                    value={item.category}
                    onChange={(cat) => updateLineItem(item.id, "category", cat)}
                    className="text-sm"
                    placeholder="Select category..."
                    isNewCategory={lineItemAISuggestions[item.id]?.some((s: any) => s.category === item.category && s.isNewCategory) || false}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Tax (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={item.tax}
                      onChange={(e) => updateLineItem(item.id, "tax", e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Tip (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={item.tip}
                      onChange={(e) => updateLineItem(item.id, "tip", e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Double-Entry Preview for Line Item */}
              {item.debitAccountId && item.creditAccountId && item.amount && (
                <Collapsible>
                  <CollapsibleTrigger className="w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center justify-between">
                    <span>Double-Entry Preview</span>
                    <ChevronDown className="w-3 h-3" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <AccountingPreview
                      debitAccountName={userAccounts?.find((a: any) => a._id === item.debitAccountId)?.name || "Unknown"}
                      creditAccountName={userAccounts?.find((a: any) => a._id === item.creditAccountId)?.name || "Unknown"}
                      amount={parseFloat(item.amount) || 0}
                      explanation="This line item will be recorded as shown above."
                      className="text-xs"
                    />
                    {/* Account Selectors for Editing */}
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Debit Account</label>
                        <select
                          value={item.debitAccountId || ""}
                          onChange={(e) => updateLineItem(item.id, "debitAccountId", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                        >
                          <option value="">Select account...</option>
                          {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset").map((acc: any) => (
                            <option key={acc._id} value={acc._id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Credit Account</label>
                        <select
                          value={item.creditAccountId || ""}
                          onChange={(e) => updateLineItem(item.id, "creditAccountId", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                        >
                          <option value="">Select account...</option>
                          {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset").map((acc: any) => (
                            <option key={acc._id} value={acc._id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Double Entry Accounts for Line Item */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">
                    Double Entry Accounts
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* AI Suggestion Button */}
                    <button
                      type="button"
                      onClick={() => handleLineItemAI(item.id)}
                      disabled={lineItemAILoading[item.id] || !item.description || !item.amount}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                        item.description && item.amount && !lineItemAILoading[item.id]
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                      title="Use AI to suggest accounts"
                    >
                      {lineItemAILoading[item.id] ? (
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
                    {(item.debitAccountId || item.creditAccountId) && (
                      <button
                        type="button"
                        onClick={() => {
                          updateLineItem(item.id, "debitAccountId", "");
                          updateLineItem(item.id, "creditAccountId", "");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
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
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      Debit Account
                    </label>
                    <select
                      value={item.debitAccountId || ""}
                      onChange={(e) => updateLineItem(item.id, "debitAccountId", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs min-h-[36px]"
                    >
                      <option value="">Select...</option>
                      {userAccounts?.filter((a: any) => a.type === "expense" || a.type === "asset" || a.type === "cost").map((account: any) => (
                        <option key={account._id} value={account._id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      Credit Account
                    </label>
                    <select
                      value={item.creditAccountId || ""}
                      onChange={(e) => updateLineItem(item.id, "creditAccountId", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs min-h-[36px]"
                    >
                      <option value="">Select...</option>
                      {userAccounts?.filter((a: any) => a.type === "liability" || a.type === "asset" || a.type === "revenue" || a.type === "equity").map((account: any) => (
                        <option key={account._id} value={account._id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Save indicator for line item */}
                {item.debitAccountId && item.creditAccountId && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2 pt-1">
                    <Check className="w-3 h-3" />
                    <span>Accounts saved for this item</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Line Items Summary */}
      {lineItems.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Itemized Subtotal:</span>
            <span className="font-semibold text-foreground">
              ${lineItemsTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Transaction Total:</span>
            <span className="font-semibold text-foreground">
              ${parseAmount(amount).toFixed(2)}
            </span>
          </div>
          {!totalsMatch && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Totals don't match
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Itemized total (${lineItemsTotal.toFixed(2)}) differs from transaction total (${parseAmount(amount).toFixed(2)}) by ${totalsDifference.toFixed(2)}. 
                  You can still save, but the difference will be tracked separately.
                </p>
              </div>
            </div>
          )}
          {totalsMatch && lineItems.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span>Itemized total matches transaction total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

