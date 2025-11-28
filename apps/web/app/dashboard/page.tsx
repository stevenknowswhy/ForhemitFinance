"use client";

/**
 * Dashboard Page
 * Protected route - requires authentication
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../components/Header";
import MockPlaidLink from "../components/MockPlaidLink";
import { CashFlowChart } from "./components/CashFlowChart";
import { SpendingByCategoryChart } from "./components/SpendingByCategoryChart";
import { IncomeVsExpensesChart } from "./components/IncomeVsExpensesChart";
import { MonthlyTrendChart } from "./components/MonthlyTrendChart";
import {
  generateCashFlowData,
  generateCategoryData,
  generateMonthlyIncomeVsExpenses,
  generateMonthlyTrends,
} from "./utils/chartData";
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  Tag, 
  Calendar,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  
  // Ensure user exists in Convex database
  useEffect(() => {
    if (isLoaded && user && onboardingStatus?.isAuthenticated && !onboardingStatus.hasCompletedOnboarding) {
      // Auto-complete onboarding if user is authenticated but not onboarded
      completeOnboarding({}).catch(console.error);
    }
  }, [isLoaded, user, onboardingStatus, completeOnboarding]);
  
  // Redirect to onboarding if not completed
  useEffect(() => {
    if (onboardingStatus?.isAuthenticated && !onboardingStatus.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [onboardingStatus, router]);
  // Query mock accounts and transactions
  const mockAccounts = useQuery(api.plaid.getMockAccounts);
  const mockTransactions = useQuery(api.plaid.getMockTransactions, { limit: 50 });
  const mockAnalytics = useQuery(api.plaid.getMockTransactionAnalytics, { days: 30 });

  // Transaction filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"high-to-low" | "low-to-high" | null>(null);
  const [filterType, setFilterType] = useState<"income" | "expense" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

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

  // Generate chart data
  const cashFlowData = generateCashFlowData(mockTransactions);
  const categoryData = generateCategoryData(mockAnalytics);
  const monthlyIncomeVsExpenses = generateMonthlyIncomeVsExpenses(mockTransactions);
  const monthlyTrends = generateMonthlyTrends(mockTransactions, mockAccounts);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Handle Convex query errors gracefully
  if (onboardingStatus === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Connection Issue:</strong> Unable to connect to Convex. 
              This may be due to missing Clerk JWT template configuration.
              <br />
              Please check the browser console for details.
            </p>
          </div>
          <h1 className="text-3xl font-bold mb-8 text-foreground">
            Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
          </h1>
          <p className="text-muted-foreground">Please configure Clerk JWT template to enable full functionality.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (!onboardingStatus.hasCompletedOnboarding) {
    return null; // Will redirect to onboarding
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}!
          </h1>
          <MockPlaidLink />
        </div>

        {/* Accounts Section */}
        <div 
          id="accounts-grid-container"
          className="mb-8"
        >
          {mockAccounts && mockAccounts.length === 0 && (
            <div className="bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 rounded-lg p-6 text-center" style={{ gridColumn: '1 / -1' }}>
              <p className="text-lg text-primary mb-4">
                No accounts connected yet. Connect a bank to get started!
              </p>
              <MockPlaidLink />
            </div>
          )}

          {mockAccounts?.map((account: any) => (
            <div 
              key={account._id} 
              className="bg-card rounded-lg shadow border border-border p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1 truncate">{account.bankName || "Bank"}</div>
                  <div className="text-base font-semibold text-foreground truncate">{account.accountType || account.name}</div>
                  {account.accountNumber && (
                    <div className="text-xs text-muted-foreground mt-1">••••{account.accountNumber}</div>
                  )}
                </div>
              </div>
              <div className={`text-xl font-bold ${(account.balance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${Math.abs(account.balance || 0).toLocaleString()}
              </div>
              {account.availableBalance !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  Available: ${account.availableBalance.toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Analytics Section - KPIs */}
        {mockAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Income</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${mockAnalytics.totalIncome.toLocaleString()}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${mockAnalytics.totalSpent.toLocaleString()}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="text-sm text-muted-foreground mb-1">Net Cash Flow</div>
              <div className={`text-2xl font-bold ${mockAnalytics.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${mockAnalytics.netCashFlow.toLocaleString()}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="text-sm text-muted-foreground mb-1">Avg Daily Spending</div>
              <div className="text-2xl font-bold text-primary">
                ${mockAnalytics.averageDailySpending.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section - Financial Insights */}
        {(cashFlowData.length > 0 || categoryData.length > 0 || monthlyIncomeVsExpenses.length > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Financial Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {cashFlowData.length > 0 && (
                <CashFlowChart data={cashFlowData} />
              )}
              {categoryData.length > 0 && (
                <SpendingByCategoryChart data={categoryData} />
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monthlyIncomeVsExpenses.length > 0 && (
                <IncomeVsExpensesChart data={monthlyIncomeVsExpenses} />
              )}
              {monthlyTrends.length > 0 && (
                <MonthlyTrendChart data={monthlyTrends} />
              )}
            </div>
          </div>
        )}

        {/* Top Categories */}
        {mockAnalytics && mockAnalytics.topCategories.length > 0 && (
          <div className="bg-card rounded-lg shadow border border-border p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">Top Spending Categories</h2>
            <div className="space-y-3">
              {mockAnalytics.topCategories.map((cat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(cat.amount / mockAnalytics.totalSpent) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-bold ml-4 text-foreground">${cat.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-card rounded-lg shadow border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Recent Transactions</h2>
          </div>
          
          {/* Search and Filter Section */}
          <div className="p-6 space-y-4 border-b border-border">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions by merchant, description, category, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Icons Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Sort Icon */}
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
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  sortDirection
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
                title={sortDirection === "high-to-low" ? "Sort: High to Low (click for Low to High)" : sortDirection === "low-to-high" ? "Sort: Low to High (click to clear)" : "Sort by amount"}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Sort</span>
              </button>

              {/* Income Filter */}
              <button
                onClick={() => setFilterType(filterType === "income" ? "all" : "income")}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  filterType === "income"
                    ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
                title="Show only income"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Income</span>
              </button>

              {/* Expense Filter */}
              <button
                onClick={() => setFilterType(filterType === "expense" ? "all" : "expense")}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  filterType === "expense"
                    ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
                title="Show only expenses"
              >
                <Minus className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Expense</span>
              </button>

              {/* Category Filter */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowDatePicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                    selectedCategory
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                  title="Filter by category"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Category</span>
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {(() => {
                      // Get unique categories from transactions
                      const categories = new Set<string>();
                      mockTransactions?.forEach((t: any) => {
                        const cat = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
                        categories.add(cat);
                      });
                      const uniqueCategories = Array.from(categories).sort();

                      return (
                        <>
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
                          {uniqueCategories.map((cat) => (
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
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowCategoryDropdown(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                    dateRange.start || dateRange.end
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                  title="Filter by date range"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Date</span>
                </button>
                {showDatePicker && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-10 p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                        <input
                          type="date"
                          value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      {(dateRange.start || dateRange.end) && (
                        <button
                          onClick={() => {
                            setDateRange({ start: null, end: null });
                            setShowDatePicker(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          Clear Date Filter
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filtered Transactions List */}
          <div className="divide-y divide-border">
            {(() => {
              // Get unique categories from transactions
              const allCategories = useMemo(() => {
                if (!mockTransactions) return [];
                const categories = new Set<string>();
                mockTransactions.forEach((t: any) => {
                  const cat = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
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
                    const category = (t.categoryName || (t.category && t.category[0]) || "Uncategorized").toLowerCase();
                    const date = new Date(t.dateTimestamp || t.date).toLocaleDateString().toLowerCase();
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
                    const cat = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
                    return cat === selectedCategory;
                  });
                }

                // Date range filter
                if (dateRange.start || dateRange.end) {
                  filtered = filtered.filter((t: any) => {
                    const txDate = new Date(t.dateTimestamp || t.date);
                    if (dateRange.start && txDate < dateRange.start) return false;
                    if (dateRange.end) {
                      const endDate = new Date(dateRange.end);
                      endDate.setHours(23, 59, 59, 999);
                      if (txDate > endDate) return false;
                    }
                    return true;
                  });
                }

                // Sort
                if (sortDirection === "high-to-low") {
                  filtered.sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
                } else if (sortDirection === "low-to-high") {
                  filtered.sort((a: any, b: any) => Math.abs(a.amount) - Math.abs(b.amount));
                }

                return filtered;
              }, [mockTransactions, searchQuery, filterType, selectedCategory, dateRange, sortDirection]);

              if (mockTransactions?.length === 0) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    No transactions yet. Connect a bank account to see your transactions.
                  </div>
                );
              }

              if (filteredTransactions.length === 0) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    No transactions match your filters. Try adjusting your search or filter criteria.
                  </div>
                );
              }

              return filteredTransactions.map((transaction: any) => (
                <div key={transaction._id} className="p-4 hover:bg-muted/50 flex items-center justify-between transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{transaction.merchantName || transaction.merchant || transaction.description}</div>
                    <div className="text-sm text-muted-foreground">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(transaction.dateTimestamp || transaction.date).toLocaleDateString()} • {transaction.categoryName || (transaction.category && transaction.category[0]) || "Uncategorized"}
                      {transaction.isPending && <span className="ml-2 text-yellow-600 dark:text-yellow-400">Pending</span>}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

