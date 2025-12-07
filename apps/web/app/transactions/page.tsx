"use client";

/**
 * Transactions Page
 * Full transaction list with filters and search
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { AddTransactionButton } from "../dashboard/components/AddTransactionButton";
import { ReceiptUploadModal } from "../dashboard/components/ReceiptUploadModal";
import { ReceiptViewer } from "../dashboard/components/ReceiptViewer";
import { useToast } from "@/lib/use-toast";
import { useOrgIdOptional } from "../hooks/useOrgId";
import { useTransactionFilters } from "./hooks/useTransactionFilters";
import { useFilteredTransactions } from "./hooks/useFilteredTransactions";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionList } from "./components/TransactionList";
import { Pagination } from "./components/Pagination";
import { EditTransactionModal } from "./components/EditTransactionModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentCalendar } from "./components/PaymentCalendar";
import { BillsView } from "./components/BillsView";
import { VendorsView } from "./components/VendorsView";
import { SubscriptionsView } from "./components/SubscriptionsView";

type Tab = "activity" | "bills" | "calendar" | "vendors" | "subscriptions";

export default function TransactionsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  // Query transactions (Activity Tab)
  const { orgId } = useOrgIdOptional();
  const mockTransactions = useQuery(api.plaid.getMockTransactions, { limit: 100 });

  // Transaction filters
  const filters = useTransactionFilters();
  const filteredTransactions = useFilteredTransactions(mockTransactions, filters);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchQuery, filters.filterType, filters.selectedCategory, filters.dateRange, filters.sortDirection, filters.businessFilter]);

  // Modal state
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Id<"transactions_raw"> | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState<Id<"transactions_raw"> | null>(null);
  const [showReceiptViewer, setShowReceiptViewer] = useState<Id<"transactions_raw"> | null>(null);

  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const { toast } = useToast();

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "activity", label: "Transactions" },
    { id: "calendar", label: "Calendar" },
    { id: "bills", label: "Bills" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "vendors", label: "Vendors" },
  ];

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
        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-6",
                activeTab === tab.id ? "" : "bg-background hover:bg-muted"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Search and Filter Section */}
              <TransactionFilters
                filters={{
                  ...filters,
                  showCategoryDropdown: filters.showCategoryDropdown,
                  showDatePicker: filters.showDatePicker,
                  categoryDropdownRef: filters.categoryDropdownRef,
                  datePickerRef: filters.datePickerRef,
                }}
                allCategories={allCategories}
                onSearchChange={filters.setSearchQuery}
                onToggleSort={filters.toggleSort}
                onToggleFilterType={filters.toggleFilterType}
                onToggleBusinessFilter={filters.toggleBusinessFilter}
                onCategorySelect={(category) => {
                  filters.setSelectedCategory(category);
                  filters.setShowCategoryDropdown(false);
                }}
                onCategoryDropdownToggle={() => {
                  filters.setShowCategoryDropdown(!filters.showCategoryDropdown);
                  filters.setShowDatePicker(false);
                }}
              />

              {/* Transactions List */}
              {mockTransactions?.length === 0 ? (
                <div className="bg-card rounded-lg shadow border border-border">
                  <div className="p-8 text-center text-muted-foreground">
                    No transactions yet. Connect a bank account to see your transactions.
                  </div>
                </div>
              ) : (
                <>
                  <TransactionList
                    transactions={paginatedTransactions}
                    onEdit={setEditingTransaction}
                    onDelete={setShowDeleteConfirm}
                    onUploadReceipt={setShowReceiptUpload}
                    onViewReceipt={setShowReceiptViewer}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTransactions.length}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === "calendar" && <PaymentCalendar />}

          {activeTab === "bills" && <BillsView />}

          {activeTab === "subscriptions" && <SubscriptionsView />}

          {activeTab === "vendors" && <VendorsView />}
        </div>
      </div>

      {/* Universal "+" Button */}
      {activeTab === "activity" && <AddTransactionButton />}



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
