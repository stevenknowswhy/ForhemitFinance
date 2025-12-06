"use client";

/**
 * ApprovalQueue Component
 * Displays list of pending entries with swipe-to-approve (mobile) and bulk actions
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useCallback } from "react";
import { useOrgId } from "../../hooks/useOrgId";
import { CheckCheck, Loader2, AlertCircle, RefreshCw, Filter, ArrowUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import { useToast } from "@/lib/use-toast";
import { EditEntryModal } from "./ApprovalQueue/components/EditEntryModal";
import { SwipeableEntryItem } from "./ApprovalQueue/components/SwipeableEntryItem";
import { useFilterAndSort } from "./ApprovalQueue/hooks/useFilterAndSort";
import { useAlternatives } from "./ApprovalQueue/hooks/useAlternatives";
import { SortField, SortOrder, ConfidenceFilter, FilterType } from "./ApprovalQueue/types";


interface ApprovalQueueProps {
  filterType?: FilterType;
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
  // getAlternatives is now handled by useAlternatives hook
  const { toast } = useToast();

  const [selectedEntries, setSelectedEntries] = useState<Set<Id<"entries_proposed">>>(new Set());
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ entryId: Id<"entries_proposed"> | null; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  // Swipe state for visual feedback
  const [swipeState, setSwipeState] = useState<Record<string, { direction: 'left' | 'right' | null; delta: number }>>({});

  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByAccount, setFilterByAccount] = useState<string | "all">("all");
  const [filterByConfidence, setFilterByConfidence] = useState<ConfidenceFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Use extracted hooks
  const { alternativesCache } = useAlternatives(pendingEntries, accounts);
  const { filteredAndSortedEntries } = useFilterAndSort({
    entries: pendingEntries,
    searchQuery,
    filterByAccount,
    filterByConfidence,
    sortField,
    sortOrder,
    filterType,
  });

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

  // SwipeableEntryItem is now extracted to a separate component

  const toggleSelect = (entryId: Id<"entries_proposed">) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Filtering and sorting is now handled by useFilterAndSort hook
  // Alternatives fetching is now handled by useAlternatives hook

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

