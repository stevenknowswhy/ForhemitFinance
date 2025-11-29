"use client";

/**
 * Analytics Page with Tabbed Navigation
 * Business, Personal, and Blended views
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { AddTransactionButton } from "../dashboard/components/AddTransactionButton";
import { DashboardCard } from "../dashboard/components/DashboardCard";
import { CashFlowChart } from "../dashboard/components/CashFlowChart";
import { SpendingByCategoryChart } from "../dashboard/components/SpendingByCategoryChart";
import { IncomeVsExpensesChart } from "../dashboard/components/IncomeVsExpensesChart";
import { MonthlyTrendChart } from "../dashboard/components/MonthlyTrendChart";
import {
  generateCashFlowData,
  generateCategoryData,
  generateMonthlyIncomeVsExpenses,
  generateMonthlyTrends,
} from "../dashboard/utils/chartData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Briefcase, User, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "business" | "personal" | "blended";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Get last viewed tab from localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics-last-tab");
      if (saved && ["business", "personal", "blended"].includes(saved)) {
        return saved as TabType;
      }
    }
    return "blended";
  });

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("analytics-last-tab", activeTab);
    }
  }, [activeTab]);

  // Toggle state for blended view
  const [showBusinessInBlended, setShowBusinessInBlended] = useState(true);
  const [showPersonalInBlended, setShowPersonalInBlended] = useState(true);
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  
  // Query data for all tabs
  const mockAccounts = useQuery(api.plaid.getMockAccounts);
  const allTransactionsRaw = useQuery(api.plaid.getMockTransactions, { limit: 1000 });
  
  // Classification stats - temporarily disabled until Convex syncs
  // IMPORTANT: Run `npx convex dev` in a separate terminal to sync the new functions
  // Once synced, uncomment these lines and remove the fallback code below
  // const classificationStats = useQuery(api.plaid.getAccountClassificationStats);
  const classificationStats: any = undefined;
  
  // Filtered queries - temporarily using fallback until Convex syncs
  // TODO: After running `npx convex dev`, replace these with:
  // const businessTransactions = useQuery(api.plaid.getFilteredTransactions, { limit: 1000, filterType: "business" });
  // const personalTransactions = useQuery(api.plaid.getFilteredTransactions, { limit: 1000, filterType: "personal" });
  // const allTransactions = useQuery(api.plaid.getFilteredTransactions, { limit: 1000, filterType: "all" });
  
  // Fallback: Filter transactions client-side until Convex syncs
  const businessTransactions = useMemo(() => {
    if (!allTransactionsRaw) return [];
    return allTransactionsRaw.filter((t: any) => t.isBusiness === true);
  }, [allTransactionsRaw]);
  
  const personalTransactions = useMemo(() => {
    if (!allTransactionsRaw) return [];
    return allTransactionsRaw.filter((t: any) => t.isBusiness === false);
  }, [allTransactionsRaw]);
  
  const allTransactions = allTransactionsRaw || [];

  // Analytics queries - temporarily using fallback until Convex syncs
  // TODO: After running `npx convex dev`, replace these with:
  // const businessAnalytics = useQuery(api.plaid.getFilteredTransactionAnalytics, { days: 30, filterType: "business" });
  // const personalAnalytics = useQuery(api.plaid.getFilteredTransactionAnalytics, { days: 30, filterType: "personal" });
  // const blendedAnalytics = useQuery(api.plaid.getFilteredTransactionAnalytics, { days: 30, filterType: "all" });
  
  // Fallback: Use existing analytics and filter client-side
  const allAnalytics = useQuery(api.plaid.getMockTransactionAnalytics, { days: 30 });
  
  // Calculate filtered analytics client-side
  const businessAnalytics = useMemo(() => {
    if (!allAnalytics || !businessTransactions) return null;
    // Calculate business totals from filtered transactions
    const businessTotalSpent = businessTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const businessTotalIncome = businessTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Get business categories
    const byCategory: Record<string, number> = {};
    businessTransactions.forEach((t: any) => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      totalSpent: Math.round(businessTotalSpent * 100) / 100,
      totalIncome: Math.round(businessTotalIncome * 100) / 100,
      netCashFlow: Math.round((businessTotalIncome - businessTotalSpent) * 100) / 100,
      transactionCount: businessTransactions.length,
      topCategories,
      averageDailySpending: Math.round((businessTotalSpent / 30) * 100) / 100,
    };
  }, [businessTransactions, allAnalytics]);
  
  const personalAnalytics = useMemo(() => {
    if (!allAnalytics || !personalTransactions) return null;
    // Calculate personal totals from filtered transactions
    const personalTotalSpent = personalTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const personalTotalIncome = personalTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Get personal categories
    const byCategory: Record<string, number> = {};
    personalTransactions.forEach((t: any) => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      totalSpent: Math.round(personalTotalSpent * 100) / 100,
      totalIncome: Math.round(personalTotalIncome * 100) / 100,
      netCashFlow: Math.round((personalTotalIncome - personalTotalSpent) * 100) / 100,
      transactionCount: personalTransactions.length,
      topCategories,
      averageDailySpending: Math.round((personalTotalSpent / 30) * 100) / 100,
    };
  }, [personalTransactions, allAnalytics]);
  
  const blendedAnalytics = allAnalytics;

  // Calculate burn rate for business view
  const businessBurnRate = useMemo(() => {
    if (!businessAnalytics) return 0;
    return businessAnalytics.netCashFlow < 0 
      ? Math.abs(businessAnalytics.netCashFlow) 
      : 0;
  }, [businessAnalytics]);

  // Calculate runway (months until $0 at current burn rate)
  const businessRunway = useMemo(() => {
    if (!businessBurnRate || businessBurnRate === 0) return null;
    const businessAccounts = mockAccounts?.filter(a => a.isBusiness === true) || [];
    const totalBalance = businessAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    if (totalBalance <= 0) return null;
    const months = totalBalance / businessBurnRate;
    return Math.floor(months);
  }, [businessBurnRate, mockAccounts]);

  // Get transactions and accounts for current view
  const getCurrentData = () => {
    if (activeTab === "business") {
      return {
        transactions: businessTransactions || [],
        analytics: businessAnalytics,
        accounts: mockAccounts?.filter(a => a.isBusiness === true) || [],
      };
    } else if (activeTab === "personal") {
      return {
        transactions: personalTransactions || [],
        analytics: personalAnalytics,
        accounts: mockAccounts?.filter(a => a.isBusiness === false) || [],
      };
    } else {
      // Blended view
      const transactions = allTransactions || [];
      return {
        transactions: transactions,
        analytics: blendedAnalytics,
        accounts: mockAccounts || [],
      };
    }
  };

  const { transactions, analytics, accounts } = getCurrentData();

  // Generate chart data
  const getChartData = () => {
    if (activeTab === "blended") {
      // For blended, we need to combine business and personal
      const businessTx = businessTransactions || [];
      const personalTx = personalTransactions || [];
      let combinedTx = [];
      
      if (showBusinessInBlended && showPersonalInBlended) {
        combinedTx = [...businessTx, ...personalTx];
      } else if (showBusinessInBlended) {
        combinedTx = businessTx;
      } else if (showPersonalInBlended) {
        combinedTx = personalTx;
      }

      return {
        cashFlow: generateCashFlowData(combinedTx, "all"),
        category: generateCategoryData(blendedAnalytics),
        monthlyIncomeVsExpenses: generateMonthlyIncomeVsExpenses(combinedTx, "all"),
        monthlyTrends: generateMonthlyTrends(combinedTx, accounts, "all"),
      };
    } else {
      const filterType = activeTab;
      return {
        cashFlow: generateCashFlowData(transactions, filterType),
        category: generateCategoryData(analytics),
        monthlyIncomeVsExpenses: generateMonthlyIncomeVsExpenses(transactions, filterType),
        monthlyTrends: generateMonthlyTrends(transactions, accounts, filterType),
      };
    }
  };

  const chartData = getChartData();

  // Calculate classification progress
  const classificationProgress = classificationStats?.overallClassificationPercent || 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Financial Analytics
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === "business" && "Business-only financial insights"}
                {activeTab === "personal" && "Personal spending and savings"}
                {activeTab === "blended" && "Complete financial picture"}
              </p>
            </div>
          </div>

          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger 
              value="business" 
              className="relative"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Business</span>
                {classificationProgress > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {classificationProgress}%
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="personal"
              className="relative"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Personal</span>
                {classificationProgress > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {classificationProgress}%
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="blended"
              className="relative"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Blended</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            {businessAnalytics ? (
              <>
                {/* Business KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <DashboardCard
                    title="Business Revenue"
                    value={`$${businessAnalytics.totalIncome.toLocaleString()}`}
                    valueClassName="text-green-600 dark:text-green-400"
                    tooltip="Total business income from all business-tagged transactions"
                  />
                  <DashboardCard
                    title="Business Expenses"
                    value={`$${businessAnalytics.totalSpent.toLocaleString()}`}
                    valueClassName="text-red-600 dark:text-red-400"
                    tooltip="Total business expenses from all business-tagged transactions"
                  />
                  <DashboardCard
                    title="Net Cash Flow"
                    value={`$${businessAnalytics.netCashFlow.toLocaleString()}`}
                    valueClassName={businessAnalytics.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                    tooltip="Business income minus business expenses"
                  />
                  <DashboardCard
                    title="Burn Rate"
                    value={`$${businessBurnRate.toLocaleString()}`}
                    subtitle={businessRunway ? `${businessRunway} months runway` : "Positive cash flow"}
                    valueClassName={businessBurnRate > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                    tooltip="Monthly net cash burn. Runway shows months until $0 at current burn rate."
                  />
                </div>

                {/* Business Charts */}
                {chartData.cashFlow.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CashFlowChart data={chartData.cashFlow} />
                    {chartData.category.length > 0 && (
                      <SpendingByCategoryChart data={chartData.category} />
                    )}
                  </div>
                )}

                {chartData.monthlyIncomeVsExpenses.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <IncomeVsExpensesChart data={chartData.monthlyIncomeVsExpenses} />
                    {chartData.monthlyTrends.length > 0 && (
                      <MonthlyTrendChart data={chartData.monthlyTrends} />
                    )}
                  </div>
                )}

                {/* Business Category Breakdown */}
                {businessAnalytics.topCategories && businessAnalytics.topCategories.length > 0 && (
                  <div className="bg-card rounded-lg shadow border border-border p-6">
                    <h3 className="text-xl font-bold mb-4 text-foreground">Top Business Categories</h3>
                    <div className="space-y-3">
                      {businessAnalytics.topCategories.map((cat: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="font-medium text-foreground">{cat.category}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${(cat.amount / businessAnalytics.totalSpent) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="font-bold ml-4 text-foreground">${cat.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No business data yet. Tag transactions as business to see insights.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-6">
            {personalAnalytics ? (
              <>
                {/* Personal KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <DashboardCard
                    title="Personal Income"
                    value={`$${personalAnalytics.totalIncome.toLocaleString()}`}
                    valueClassName="text-green-600 dark:text-green-400"
                    tooltip="Total personal income from all personal-tagged transactions"
                  />
                  <DashboardCard
                    title="Personal Spending"
                    value={`$${personalAnalytics.totalSpent.toLocaleString()}`}
                    valueClassName="text-red-600 dark:text-red-400"
                    tooltip="Total personal expenses from all personal-tagged transactions"
                  />
                  <DashboardCard
                    title="Net Cash Flow"
                    value={`$${personalAnalytics.netCashFlow.toLocaleString()}`}
                    valueClassName={personalAnalytics.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                    tooltip="Personal income minus personal expenses"
                  />
                  <DashboardCard
                    title="Avg Daily Spending"
                    value={`$${personalAnalytics.averageDailySpending.toLocaleString()}`}
                    valueClassName="text-primary"
                    tooltip="Average daily personal spending over the last 30 days"
                  />
                </div>

                {/* Personal Charts */}
                {chartData.cashFlow.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CashFlowChart data={chartData.cashFlow} />
                    {chartData.category.length > 0 && (
                      <SpendingByCategoryChart data={chartData.category} />
                    )}
                  </div>
                )}

                {chartData.monthlyIncomeVsExpenses.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <IncomeVsExpensesChart data={chartData.monthlyIncomeVsExpenses} />
                    {chartData.monthlyTrends.length > 0 && (
                      <MonthlyTrendChart data={chartData.monthlyTrends} />
                    )}
                  </div>
                )}

                {/* Personal Category Breakdown */}
                {personalAnalytics.topCategories && personalAnalytics.topCategories.length > 0 && (
                  <div className="bg-card rounded-lg shadow border border-border p-6">
                    <h3 className="text-xl font-bold mb-4 text-foreground">Top Personal Categories</h3>
                    <div className="space-y-3">
                      {personalAnalytics.topCategories.map((cat: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="font-medium text-foreground">{cat.category}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${(cat.amount / personalAnalytics.totalSpent) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="font-bold ml-4 text-foreground">${cat.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No personal data yet. Tag transactions as personal to see insights.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Blended Tab */}
          <TabsContent value="blended" className="space-y-6">
            {/* Toggle controls for blended view */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">Show:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBusinessInBlended}
                  onChange={(e) => setShowBusinessInBlended(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Business</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPersonalInBlended}
                  onChange={(e) => setShowPersonalInBlended(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Personal</span>
              </label>
            </div>

            {blendedAnalytics ? (
              <>
                {/* Blended KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <DashboardCard
                    title="Total Income"
                    value={`$${blendedAnalytics.totalIncome.toLocaleString()}`}
                    valueClassName="text-green-600 dark:text-green-400"
                    tooltip="Combined income from business and personal transactions"
                  />
                  <DashboardCard
                    title="Total Spending"
                    value={`$${blendedAnalytics.totalSpent.toLocaleString()}`}
                    valueClassName="text-red-600 dark:text-red-400"
                    tooltip="Combined expenses from business and personal transactions"
                  />
                  <DashboardCard
                    title="Net Cash Flow"
                    value={`$${blendedAnalytics.netCashFlow.toLocaleString()}`}
                    valueClassName={blendedAnalytics.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                    tooltip="Overall financial health: income minus expenses"
                  />
                  <DashboardCard
                    title="Transaction Count"
                    value={blendedAnalytics.transactionCount.toLocaleString()}
                    valueClassName="text-primary"
                    tooltip="Total number of transactions (business + personal)"
                  />
                </div>

                {/* Comparison Cards */}
                {businessAnalytics && personalAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg shadow border border-border p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-foreground">Business</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Revenue</span>
                          <span className="font-medium text-foreground">${businessAnalytics.totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Expenses</span>
                          <span className="font-medium text-foreground">${businessAnalytics.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-sm font-medium text-foreground">Net</span>
                          <span className={cn(
                            "font-bold",
                            businessAnalytics.netCashFlow >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          )}>
                            ${businessAnalytics.netCashFlow.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-lg shadow border border-border p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-foreground">Personal</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Income</span>
                          <span className="font-medium text-foreground">${personalAnalytics.totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Spending</span>
                          <span className="font-medium text-foreground">${personalAnalytics.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-sm font-medium text-foreground">Net</span>
                          <span className={cn(
                            "font-bold",
                            personalAnalytics.netCashFlow >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          )}>
                            ${personalAnalytics.netCashFlow.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blended Charts */}
                {chartData.cashFlow.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CashFlowChart data={chartData.cashFlow} />
                    {chartData.category.length > 0 && (
                      <SpendingByCategoryChart data={chartData.category} />
                    )}
                  </div>
                )}

                {chartData.monthlyIncomeVsExpenses.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <IncomeVsExpensesChart data={chartData.monthlyIncomeVsExpenses} />
                    {chartData.monthlyTrends.length > 0 && (
                      <MonthlyTrendChart data={chartData.monthlyTrends} />
                    )}
                  </div>
                )}

                {/* Blended Category Breakdown */}
                {blendedAnalytics.topCategories && blendedAnalytics.topCategories.length > 0 && (
                  <div className="bg-card rounded-lg shadow border border-border p-6">
                    <h3 className="text-xl font-bold mb-4 text-foreground">Top Spending Categories (All)</h3>
                    <div className="space-y-3">
                      {blendedAnalytics.topCategories.map((cat: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="font-medium text-foreground">{cat.category}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${(cat.amount / blendedAnalytics.totalSpent) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="font-bold ml-4 text-foreground">${cat.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No analytics data yet. Connect a bank account to see insights.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Universal "+" Button */}
      <AddTransactionButton />
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}
