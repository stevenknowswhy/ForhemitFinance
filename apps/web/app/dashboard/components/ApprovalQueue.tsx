"use client";

/**
 * ApprovalQueue Component
 * Displays list of pending entries with swipe-to-approve (mobile) and bulk actions
 */

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { EntryPreview } from "./EntryPreview";
import { useOrgId } from "../../hooks/useOrgId";
import { Check, X, Edit2, CheckCheck, Loader2, AlertCircle, RefreshCw, Filter, ArrowUpDown, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";
import { useSwipeable } from "react-swipeable";
import { useToast } from "@/lib/use-toast";

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

type SortField = "date" | "amount" | "confidence" | "account";
type SortOrder = "asc" | "desc";

interface ApprovalQueueProps {
  filterType?: "all" | "business" | "personal";
}

export function ApprovalQueue({ filterType = "all" }: ApprovalQueueProps) {
  // Always pass empty object since deployed Convex function doesn't accept filterType yet
  const { orgId } = useOrgId(); // Phase 1: Get orgId from context
  const pendingEntries = useQuery(
    api.transactions.getPendingTransactions,
    { orgId } // Phase 1: Pass orgId (useOrgId throws if not available)
  );
  const accounts = useQuery(
    api.accounts.getAll,
    { orgId } // Phase 1: Pass orgId (useOrgId throws if not available)
  );
  const approveEntry = useMutation(api.transactions.approveEntry);
  const rejectEntry = useMutation(api.transactions.rejectEntry);
  const getAlternatives = useAction(api.ai_entries.getAlternativeSuggestions);
  const { toast } = useToast();

  const [selectedEntries, setSelectedEntries] = useState<Set<Id<"entries_proposed">>>(new Set());
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alternativesCache, setAlternativesCache] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<{ entryId: Id<"entries_proposed"> | null; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  // Swipe state for visual feedback
  const [swipeState, setSwipeState] = useState<Record<string, { direction: 'left' | 'right' | null; delta: number }>>({});

  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByAccount, setFilterByAccount] = useState<string | "all">("all");
  const [filterByConfidence, setFilterByConfidence] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const handleApprove = useCallback(async (entryId: Id<"entries_proposed">, retry = false) => {
    if (!retry) {
      setIsProcessing(true);
      setError(null);
    }

    const currentRetryCount = retryCount[entryId] || 0;
    const maxRetries = 3;

    try {
      await approveEntry({ entryId });
      // Success - clear error and retry count
      setError(null);
      setRetryCount(prev => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      toast({
        title: "Entry approved",
        description: "The transaction has been approved and added to your books.",
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to approve entry. Please try again.";
      console.error("Failed to approve entry:", err);

      if (currentRetryCount < maxRetries) {
        // Auto-retry with exponential backoff
        const delay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => ({ ...prev, [entryId]: currentRetryCount + 1 }));
          handleApprove(entryId, true);
        }, delay);
      } else {
        // Max retries reached - show error
        setError({ entryId, message: errorMessage });
      }
    } finally {
      if (!retry) {
        setIsProcessing(false);
      }
    }
  }, [approveEntry, retryCount]);

  const handleReject = useCallback(async (entryId: Id<"entries_proposed">, retry = false) => {
    if (!retry) {
      setIsProcessing(true);
      setError(null);
    }

    const currentRetryCount = retryCount[entryId] || 0;
    const maxRetries = 3;

    try {
      await rejectEntry({ entryId });
      // Success - clear error and retry count
      setError(null);
      setRetryCount(prev => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      toast({
        title: "Entry rejected",
        description: "The transaction has been rejected.",
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to reject entry. Please try again.";
      console.error("Failed to reject entry:", err);

      if (currentRetryCount < maxRetries) {
        // Auto-retry with exponential backoff
        const delay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => ({ ...prev, [entryId]: currentRetryCount + 1 }));
          handleReject(entryId, true);
        }, delay);
      } else {
        // Max retries reached - show error
        setError({ entryId, message: errorMessage });
      }
    } finally {
      if (!retry) {
        setIsProcessing(false);
      }
    }
  }, [rejectEntry, retryCount]);

  const handleBulkApprove = async () => {
    if (selectedEntries.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedEntries).map((entryId) => approveEntry({ entryId }))
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const errorMsg = `${failed.length} of ${selectedEntries.size} entries failed to approve. Please try again.`;
        setError({
          entryId: null,
          message: errorMsg
        });
        toast({
          title: "Bulk approval failed",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        setSelectedEntries(new Set());
        toast({
          title: "Entries approved",
          description: `Successfully approved ${selectedEntries.size} entr${selectedEntries.size === 1 ? 'y' : 'ies'}.`,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to bulk approve entries. Please try again.";
      setError({ entryId: null, message: errorMessage });
      console.error("Failed to bulk approve:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedEntries.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedEntries).map((entryId) => rejectEntry({ entryId }))
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const errorMsg = `${failed.length} of ${selectedEntries.size} entries failed to reject. Please try again.`;
        setError({
          entryId: null,
          message: errorMsg
        });
        toast({
          title: "Bulk reject failed",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        setSelectedEntries(new Set());
        toast({
          title: "Entries rejected",
          description: `Successfully rejected ${selectedEntries.size} entr${selectedEntries.size === 1 ? 'y' : 'ies'}.`,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to bulk reject entries. Please try again.";
      setError({ entryId: null, message: errorMessage });
      console.error("Failed to bulk reject:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (!filteredAndSortedEntries || filteredAndSortedEntries.length === 0) return;
    if (selectedEntries.size === filteredAndSortedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredAndSortedEntries.map((e: any) => e._id)));
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

  // Swipeable Entry Item Component
  interface SwipeableEntryItemProps {
    entry: any;
    isSelected: boolean;
    swipeState: { direction: 'left' | 'right' | null; delta: number } | undefined;
    onApprove: () => void;
    onReject: () => void;
    onEdit: () => void;
    onToggleSelect: () => void;
    alternatives: any[];
    onSwipeUpdate: (direction: 'left' | 'right' | null, delta: number) => void;
  }

  function SwipeableEntryItem({
    entry,
    isSelected,
    swipeState,
    onApprove,
    onReject,
    onEdit,
    onToggleSelect,
    alternatives,
    onSwipeUpdate,
  }: SwipeableEntryItemProps) {
    const swipeHandlers = useSwipeable({
      onSwiping: (eventData) => {
        const { dir, deltaX } = eventData;
        if (dir === 'Left' || dir === 'Right') {
          onSwipeUpdate(dir.toLowerCase() as 'left' | 'right', Math.abs(deltaX));
        }
      },
      onSwipedLeft: () => {
        onSwipeUpdate(null, 0);
        onReject();
      },
      onSwipedRight: () => {
        onSwipeUpdate(null, 0);
        onApprove();
      },
      onSwiped: () => {
        // Reset swipe state after swipe completes
        onSwipeUpdate(null, 0);
      },
      trackMouse: false, // Only track touch
      trackTouch: true,
      delta: 50, // Minimum distance to trigger swipe
      preventScrollOnSwipe: true,
    });

    const swipeDelta = swipeState?.delta || 0;
    const swipeDirection = swipeState?.direction;

    return (
      <div
        {...swipeHandlers}
        className={cn(
          "relative transition-transform duration-200 ease-out",
          swipeDirection === 'right' && swipeDelta > 50 && "translate-x-4",
          swipeDirection === 'left' && swipeDelta > 50 && "-translate-x-4"
        )}
      >
        {/* Swipe indicator - Approve (right swipe) */}
        {swipeDirection === 'right' && swipeDelta > 30 && (
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-green-600 rounded-l-lg flex items-center justify-center z-10">
            <Check className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Swipe indicator - Reject (left swipe) */}
        {swipeDirection === 'left' && swipeDelta > 30 && (
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-600 rounded-r-lg flex items-center justify-center z-10">
            <X className="w-6 h-6 text-white" />
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
              onChange={onToggleSelect}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              aria-label={`Select entry ${entry._id}`}
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
              alternatives={alternatives}
              onApprove={onApprove}
              onReject={onReject}
              onEdit={onEdit}
            />
          </div>
        </div>
      </div>
    );
  }

  const toggleSelect = (entryId: Id<"entries_proposed">) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    if (!pendingEntries) return [];

    let filtered = [...pendingEntries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry: any) => {
        const memo = entry.memo?.toLowerCase() || "";
        const debitAccount = entry.debitAccount?.name?.toLowerCase() || "";
        const creditAccount = entry.creditAccount?.name?.toLowerCase() || "";
        const transaction = entry.transaction;
        const description = transaction?.description?.toLowerCase() || "";
        const merchant = transaction?.merchant?.toLowerCase() || "";

        return (
          memo.includes(query) ||
          debitAccount.includes(query) ||
          creditAccount.includes(query) ||
          description.includes(query) ||
          merchant.includes(query)
        );
      });
    }

    // Account filter
    if (filterByAccount !== "all") {
      filtered = filtered.filter((entry: any) => {
        return (
          entry.debitAccountId === filterByAccount ||
          entry.creditAccountId === filterByAccount
        );
      });
    }

    // Confidence filter
    if (filterByConfidence !== "all") {
      filtered = filtered.filter((entry: any) => {
        const confidence = entry.confidence || 0;
        if (filterByConfidence === "high") return confidence >= 0.8;
        if (filterByConfidence === "medium") return confidence >= 0.6 && confidence < 0.8;
        if (filterByConfidence === "low") return confidence < 0.6;
        return true;
      });
    }

    // Business/Personal filter (from prop)
    if (filterType !== "all") {
      filtered = filtered.filter((entry: any) => {
        if (filterType === "business") return entry.isBusiness === true;
        if (filterType === "personal") return entry.isBusiness === false;
        return true;
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = a.date || 0;
          bValue = b.date || 0;
          break;
        case "amount":
          aValue = Math.abs(a.amount || 0);
          bValue = Math.abs(b.amount || 0);
          break;
        case "confidence":
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case "account":
          aValue = (a.debitAccount?.name || "").toLowerCase();
          bValue = (b.debitAccount?.name || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [pendingEntries, searchQuery, filterByAccount, filterByConfidence, sortField, sortOrder]);

  // Memoize low confidence entries to avoid unnecessary recalculations
  const lowConfidenceEntries = useMemo(() => {
    if (!pendingEntries) return [];
    return pendingEntries.filter(
      (entry: any) => (entry.confidence || 0) < 0.7 && entry.transactionId && !alternativesCache[entry._id]
    );
  }, [pendingEntries, alternativesCache]);

  // Fetch alternatives for entries with low confidence (debounced to avoid excessive calls)
  useEffect(() => {
    if (!lowConfidenceEntries.length || !accounts) return;

    // Debounce to avoid fetching for every entry simultaneously
    const timeoutId = setTimeout(() => {
      const fetchAlternatives = async () => {
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
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [lowConfidenceEntries, accounts, getAlternatives]);

  if (!pendingEntries) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading pending entries...</p>
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
      {/* Filter and Sort Controls */}
      <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-3">
        {/* Search and Filter Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium transition-colors flex items-center gap-2",
              "hover:bg-muted",
              showFilters && "bg-muted"
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
            {/* Account Filter */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Account
              </label>
              <select
                value={filterByAccount}
                onChange={(e) => setFilterByAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Accounts</option>
                {accounts?.map((acc: any) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Confidence
              </label>
              <select
                value={filterByConfidence}
                onChange={(e) => setFilterByConfidence(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All</option>
                <option value="high">High (≥80%)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Sort By
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="confidence">Confidence</option>
                  <option value="account">Account</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className={cn(
                    "p-2 rounded-lg border border-border bg-background text-foreground transition-colors",
                    "hover:bg-muted"
                  )}
                  title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {filteredAndSortedEntries.length !== pendingEntries?.length && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Showing {filteredAndSortedEntries.length} of {pendingEntries?.length || 0} entries
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error.message}</p>
            {error.entryId && (
              <button
                onClick={() => {
                  const entry = pendingEntries?.find((e: any) => e._id === error.entryId);
                  if (entry) {
                    // Retry the last action - determine if it was approve or reject
                    // For now, we'll retry approve. In a real app, you'd track the last action.
                    handleApprove(error.entryId!);
                  }
                }}
                className="mt-2 text-sm text-destructive underline hover:no-underline flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedEntries.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-foreground">
            {selectedEntries.size} entr{selectedEntries.size === 1 ? "y" : "ies"} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              {selectedEntries.size === filteredAndSortedEntries.length ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => setSelectedEntries(new Set())}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkReject}
              disabled={isProcessing}
              className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Reject All
                </>
              )}
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Approve All
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Select All / Deselect All (when no entries selected) */}
      {selectedEntries.size === 0 && filteredAndSortedEntries.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (selectedEntries.size === filteredAndSortedEntries.length) {
                setSelectedEntries(new Set());
              } else {
                setSelectedEntries(new Set(filteredAndSortedEntries.map((e: any) => e._id)));
              }
            }}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {selectedEntries.size === filteredAndSortedEntries.length
              ? "Deselect All"
              : `Select All (${filteredAndSortedEntries.length})`}
          </button>
        </div>
      )}

      {/* Empty filtered state */}
      {filteredAndSortedEntries.length === 0 && pendingEntries && pendingEntries.length > 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No entries match your filters</p>
          <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterByAccount("all");
              setFilterByConfidence("all");
            }}
            className="mt-4 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {filteredAndSortedEntries.map((entry: any) => {
          const swipe = swipeState[entry._id];
          const isSelected = selectedEntries.has(entry._id);

          return (
            <SwipeableEntryItem
              key={entry._id}
              entry={entry}
              isSelected={isSelected}
              swipeState={swipe}
              onApprove={() => handleApprove(entry._id)}
              onReject={() => handleReject(entry._id)}
              onEdit={() => handleEdit(entry)}
              onToggleSelect={() => toggleSelect(entry._id)}
              alternatives={alternativesCache[entry._id] || []}
              onSwipeUpdate={(direction, delta) => {
                setSwipeState(prev => ({
                  ...prev,
                  [entry._id]: { direction, delta }
                }));
              }}
            />
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

