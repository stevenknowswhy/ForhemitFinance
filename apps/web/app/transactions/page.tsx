"use client";

/**
 * Transactions Page
 * Full transaction list with filters and search
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { AddTransactionButton } from "../dashboard/components/AddTransactionButton";
import { ApprovalQueue } from "../dashboard/components/ApprovalQueue";
import { ReceiptUploadModal } from "../dashboard/components/ReceiptUploadModal";
import { ReceiptViewer } from "../dashboard/components/ReceiptViewer";
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  Tag, 
  Calendar,
  X,
  Edit2,
  Trash2,
  Receipt,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";
import { useToast } from "@/lib/use-toast";
import { formatTransactionDate, parseLocalDate } from "@/lib/dateUtils";
import { useOrgIdOptional } from "../hooks/useOrgId";

export default function TransactionsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  
  // Query transactions
  const { orgId } = useOrgIdOptional();
  const mockTransactions = useQuery(api.plaid.getMockTransactions, { limit: 100 });
  const pendingEntries = useQuery(api.transactions.getPendingTransactions, orgId ? { orgId } : "skip");

  // Transaction filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"high-to-low" | "low-to-high" | null>(null);
  const [filterType, setFilterType] = useState<"income" | "expense" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [businessFilter, setBusinessFilter] = useState<"all" | "business" | "personal">("all");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Id<"transactions_raw"> | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState<Id<"transactions_raw"> | null>(null);
  const [showReceiptViewer, setShowReceiptViewer] = useState<Id<"transactions_raw"> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const { toast } = useToast();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showCategoryDropdown || showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCategoryDropdown, showDatePicker]);

  // Get unique categories from transactions
  const allCategories = useMemo(() => {
    if (!mockTransactions) return [];
    const categories = new Set<string>();
    mockTransactions.forEach((t: any) => {
      const cat = t.categoryName || (t.category && t.category[0]) || t.merchant || "Uncategorized";
      categories.add(cat);
    });
    return Array.from(categories).sort();
  }, [mockTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!mockTransactions) return [];

    let filtered = [...mockTransactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t: any) => {
        const merchant = (t.merchantName || t.merchant || t.description || "").toLowerCase();
        const description = (t.description || "").toLowerCase();
        const category = (t.categoryName || (t.category && t.category[0]) || t.merchant || "Uncategorized").toLowerCase();
        const date = formatTransactionDate(t.dateTimestamp || t.date).toLowerCase();
        return merchant.includes(query) || description.includes(query) || category.includes(query) || date.includes(query);
      });
    }

    // Type filter (income/expense)
    if (filterType === "income") {
      filtered = filtered.filter((t: any) => t.amount >= 0);
    } else if (filterType === "expense") {
      filtered = filtered.filter((t: any) => t.amount < 0);
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((t: any) => {
        const cat = t.categoryName || (t.category && t.category[0]) || t.merchant || "Uncategorized";
        return cat === selectedCategory;
      });
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((t: any) => {
        // Parse date as local date to avoid timezone issues
        const txDate = typeof t.dateTimestamp === 'number' 
          ? new Date(t.dateTimestamp)
          : parseLocalDate(t.date);
        if (dateRange.start && txDate < dateRange.start) return false;
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (txDate > endDate) return false;
        }
        return true;
      });
    }

    // Business/Personal filter
    if (businessFilter === "business") {
      filtered = filtered.filter((t: any) => t.isBusiness === true);
    } else if (businessFilter === "personal") {
      filtered = filtered.filter((t: any) => t.isBusiness === false);
    }

    // Sort
    if (sortDirection === "high-to-low") {
      filtered.sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortDirection === "low-to-high") {
      filtered.sort((a: any, b: any) => Math.abs(a.amount) - Math.abs(b.amount));
    }

    return filtered;
  }, [mockTransactions, searchQuery, filterType, selectedCategory, dateRange, sortDirection, businessFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, selectedCategory, dateRange, sortDirection, businessFilter]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (!onboardingStatus?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Transactions</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Search and Filter Section */}
        <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (sortDirection === null) {
                  setSortDirection("high-to-low");
                } else if (sortDirection === "high-to-low") {
                  setSortDirection("low-to-high");
                } else {
                  setSortDirection(null);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                sortDirection
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </button>

            <button
              onClick={() => {
                if (filterType === "all") {
                  setFilterType("income");
                } else if (filterType === "income") {
                  setFilterType("expense");
                } else {
                  setFilterType("all");
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                filterType === "income"
                  ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                  : filterType === "expense"
                  ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {filterType === "all" ? (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <Minus className="w-3.5 h-3.5" />
                </>
              ) : filterType === "income" ? (
                <Plus className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              {filterType === "all" ? "All" : filterType === "income" ? "Income" : "Expense"}
            </button>

            <div className="relative" ref={categoryDropdownRef}>
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowDatePicker(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                  selectedCategory
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Tag className="w-4 h-4" />
                Category
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                      !selectedCategory ? "bg-primary/10 text-primary" : "text-foreground"
                    )}
                  >
                    All Categories
                  </button>
                  {allCategories.map((cat: any) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                        selectedCategory === cat ? "bg-primary/10 text-primary" : "text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setBusinessFilter(
                  businessFilter === "all"
                    ? "business"
                    : businessFilter === "business"
                    ? "personal"
                    : "all"
                );
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                businessFilter !== "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Tag className="w-4 h-4" />
              {businessFilter === "all"
                ? "All"
                : businessFilter === "business"
                ? "Business"
                : "Personal"}
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card rounded-lg shadow border border-border divide-y divide-border">
          {mockTransactions?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No transactions yet. Connect a bank account to see your transactions.
            </div>
          )}

          {mockTransactions && mockTransactions.length > 0 && filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No transactions match your filters.
            </div>
          )}

          {paginatedTransactions.length > 0 && paginatedTransactions.map((transaction: any) => (
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
                        onClick={() => setShowReceiptViewer(transaction._id)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="View receipts"
                      >
                        <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowReceiptUpload(transaction._id)}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                      title="Upload receipt"
                    >
                      <Receipt className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(transaction._id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  currentPage === 1
                    ? "border-border bg-background text-muted-foreground opacity-50 cursor-not-allowed"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 text-sm rounded-lg border transition-colors",
                        currentPage === pageNum
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  currentPage === totalPages
                    ? "border-border bg-background text-muted-foreground opacity-50 cursor-not-allowed"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Universal "+" Button */}
      <AddTransactionButton />
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={async (updates) => {
            try {
              await updateTransaction({
                transactionId: editingTransaction._id,
                ...updates,
              });
              setEditingTransaction(null);
              toast({
                title: "Transaction updated",
                description: "The transaction has been updated successfully.",
              });
            } catch (error: any) {
              console.error("Failed to update transaction:", error);
              toast({
                title: "Update failed",
                description: error?.message || "Failed to update transaction. Please try again.",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          transactionId={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={async () => {
            try {
              await deleteTransaction({ transactionId: showDeleteConfirm });
              setShowDeleteConfirm(null);
              toast({
                title: "Transaction deleted",
                description: "The transaction has been deleted successfully.",
              });
            } catch (error: any) {
              console.error("Failed to delete transaction:", error);
              toast({
                title: "Delete failed",
                description: error?.message || "Failed to delete transaction. Please try again.",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <ReceiptUploadModal
          transactionId={showReceiptUpload}
          onClose={() => setShowReceiptUpload(null)}
          onUploadComplete={(receiptUrls) => {
            console.log("Receipts uploaded:", receiptUrls);
          }}
        />
      )}

      {/* Receipt Viewer Modal */}
      {showReceiptViewer && (
        <ReceiptViewer
          transactionId={showReceiptViewer}
          onClose={() => setShowReceiptViewer(null)}
        />
      )}
    </div>
  );
}

/**
 * Edit Transaction Modal Component
 */
function EditTransactionModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: any;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}) {
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

/**
 * Delete Confirmation Modal Component
 */
function DeleteConfirmModal({
  transactionId,
  onClose,
  onConfirm,
}: {
  transactionId: Id<"transactions_raw">;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-foreground mb-4">Delete Transaction</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors",
              "bg-red-600 hover:bg-red-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

