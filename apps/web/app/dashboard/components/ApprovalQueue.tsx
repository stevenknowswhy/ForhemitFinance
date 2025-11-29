"use client";

/**
 * ApprovalQueue Component
 * Displays list of pending entries with swipe-to-approve (mobile) and bulk actions
 */

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { EntryPreview } from "./EntryPreview";
import { Check, X, Edit2, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface EditEntryModalProps {
  entry: any;
  accounts: any[];
  onSave: (entryId: Id<"entries_proposed">, edits: any) => void;
  onClose: () => void;
}

function EditEntryModal({ entry, accounts, onSave, onClose }: EditEntryModalProps) {
  const [debitAccountId, setDebitAccountId] = useState(entry.debitAccountId);
  const [creditAccountId, setCreditAccountId] = useState(entry.creditAccountId);
  const [amount, setAmount] = useState(entry.amount);
  const [memo, setMemo] = useState(entry.memo || "");
  const [isBusiness, setIsBusiness] = useState(entry.isBusiness);

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

  const debitAccounts = accounts.filter(a => 
    a.type === "asset" || a.type === "expense" || a.type === "equity"
  );
  const creditAccounts = accounts.filter(a => 
    a.type === "asset" || a.type === "liability" || a.type === "income" || a.type === "equity"
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-foreground">Edit Entry</h2>
        
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
              {debitAccounts.map((acc) => (
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
              {creditAccounts.map((acc) => (
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
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApprovalQueue() {
  const pendingEntries = useQuery(api.transactions.getPendingTransactions);
  const accounts = useQuery(api.accounts.getAll);
  const approveEntry = useMutation(api.transactions.approveEntry);
  const rejectEntry = useMutation(api.transactions.rejectEntry);
  const getAlternatives = useAction(api.ai_entries.getAlternativeSuggestions);
  
  const [selectedEntries, setSelectedEntries] = useState<Set<Id<"entries_proposed">>>(new Set());
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alternativesCache, setAlternativesCache] = useState<Record<string, any[]>>({});

  // Swipe-to-approve state (mobile)
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number; entryId: Id<"entries_proposed"> | null }>({
    x: 0,
    y: 0,
    entryId: null,
  });
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});

  const handleApprove = async (entryId: Id<"entries_proposed">) => {
    setIsProcessing(true);
    try {
      await approveEntry({ entryId });
    } catch (error) {
      console.error("Failed to approve entry:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (entryId: Id<"entries_proposed">) => {
    setIsProcessing(true);
    try {
      await rejectEntry({ entryId });
    } catch (error) {
      console.error("Failed to reject entry:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEntries.size === 0) return;
    
    setIsProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedEntries).map((entryId) => approveEntry({ entryId }))
      );
      setSelectedEntries(new Set());
    } catch (error) {
      console.error("Failed to bulk approve:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async (entryId: Id<"entries_proposed">, edits: any) => {
    setIsProcessing(true);
    try {
      await approveEntry({ entryId, edits });
      setEditingEntry(null);
    } catch (error) {
      console.error("Failed to save edit:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Swipe handlers (mobile)
  const handleTouchStart = (e: React.TouchEvent, entryId: Id<"entries_proposed">) => {
    const touch = e.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY, entryId });
  };

  const handleTouchMove = (e: React.TouchEvent, entryId: Id<"entries_proposed">) => {
    if (swipeStart.entryId !== entryId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStart.x;
    
    // Only allow right swipe (positive deltaX) for approve
    if (deltaX > 0 && deltaX < 150) {
      setSwipeOffset({ ...swipeOffset, [entryId]: deltaX });
    }
  };

  const handleTouchEnd = (entryId: Id<"entries_proposed">) => {
    const offset = swipeOffset[entryId] || 0;
    
    if (offset > 100) {
      // Swipe threshold reached - approve
      handleApprove(entryId);
    }
    
    // Reset swipe state
    setSwipeOffset({ ...swipeOffset, [entryId]: 0 });
    setSwipeStart({ x: 0, y: 0, entryId: null });
  };

  const toggleSelect = (entryId: Id<"entries_proposed">) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Fetch alternatives for entries with low confidence
  useEffect(() => {
    if (!pendingEntries || !accounts) return;

    const fetchAlternatives = async () => {
      const lowConfidenceEntries = pendingEntries.filter(
        (entry: any) => (entry.confidence || 0) < 0.7 && entry.transactionId && !alternativesCache[entry._id]
      );

      for (const entry of lowConfidenceEntries) {
        if (!entry.transactionId) continue; // Skip if no transaction ID
        try {
          const result = await getAlternatives({ transactionId: entry.transactionId });
          if (result && result.alternatives) {
            // Map alternatives to include account names
            // Note: Account IDs from getAlternativeSuggestions are strings, need to match with Convex IDs
            const mappedAlternatives = result.alternatives.map((alt: any) => {
              // Convert string IDs to match Convex ID format for comparison
              const debitAcc = accounts.find((a: any) => 
                a._id === alt.debitAccountId || String(a._id) === String(alt.debitAccountId)
              );
              const creditAcc = accounts.find((a: any) => 
                a._id === alt.creditAccountId || String(a._id) === String(alt.creditAccountId)
              );
              return {
                debitAccountId: alt.debitAccountId,
                creditAccountId: alt.creditAccountId,
                debitAccountName: debitAcc?.name || "Unknown",
                creditAccountName: creditAcc?.name || "Unknown",
                explanation: alt.explanation,
                confidence: alt.confidence,
              };
            });
            setAlternativesCache((prev) => ({
              ...prev,
              [entry._id]: mappedAlternatives,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch alternatives for entry:", error);
        }
      }
    };

    fetchAlternatives();
  }, [pendingEntries, accounts, getAlternatives, alternativesCache]);

  if (!pendingEntries) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingEntries.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <CheckCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">All caught up!</p>
        <p className="text-sm mt-2">No pending entries to approve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedEntries.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {selectedEntries.size} entr{selectedEntries.size === 1 ? "y" : "ies"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedEntries(new Set())}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-4 h-4 inline mr-1" />
                  Approve All
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {pendingEntries.map((entry: any) => {
          const swipe = swipeOffset[entry._id] || 0;
          const isSelected = selectedEntries.has(entry._id);

          return (
            <div
              key={entry._id}
              className={cn(
                "relative transition-transform",
                swipe > 0 && "translate-x-4"
              )}
              onTouchStart={(e) => handleTouchStart(e, entry._id)}
              onTouchMove={(e) => handleTouchMove(e, entry._id)}
              onTouchEnd={() => handleTouchEnd(entry._id)}
            >
              {/* Swipe indicator (mobile) */}
              {swipe > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-green-600 rounded-l-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              )}

              {/* Entry Preview with selection checkbox */}
              <div className={cn(
                "relative",
                isSelected && "ring-2 ring-primary"
              )}>
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(entry._id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
                <div className={cn(isSelected && "ml-10")}>
                  <EntryPreview
                    entryId={entry._id}
                    debitAccountName={entry.debitAccount?.name || "Unknown"}
                    creditAccountName={entry.creditAccount?.name || "Unknown"}
                    amount={entry.amount}
                    explanation={entry.explanation || "No explanation available"}
                    confidence={entry.confidence || 0.5}
                    memo={entry.memo}
                    alternatives={alternativesCache[entry._id] || []}
                    onApprove={() => handleApprove(entry._id)}
                    onReject={() => handleReject(entry._id)}
                    onEdit={() => handleEdit(entry)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingEntry && accounts && (
        <EditEntryModal
          entry={editingEntry}
          accounts={accounts}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

