/**
 * Blended Tab Component
 */

"use client";

import { useState, useMemo } from "react";
import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { CashFlowChart } from "../../dashboard/components/CashFlowChart";
import { SpendingByCategoryChart } from "../../dashboard/components/SpendingByCategoryChart";
import { IncomeVsExpensesChart } from "../../dashboard/components/IncomeVsExpensesChart";
import { MonthlyTrendChart } from "../../dashboard/components/MonthlyTrendChart";
import { TopCategoriesList } from "./TopCategoriesList";
import { getChartData } from "../utils/chartData";
import type { AnalyticsData } from "../types";

interface BlendedTabProps {
  blendedAnalytics: any;
  businessAnalytics: AnalyticsData | null;
  personalAnalytics: AnalyticsData | null;
  businessTransactions: any[];
  personalTransactions: any[];
  accounts: any[];
}

export function BlendedTab({
  blendedAnalytics,
  businessAnalytics,
  personalAnalytics,
  businessTransactions,
  personalTransactions,
  accounts,
}: BlendedTabProps) {
  const [showBusinessInBlended, setShowBusinessInBlended] = useState(true);
  const [showPersonalInBlended, setShowPersonalInBlended] = useState(true);

  // Generate chart data based on toggle state
  const chartData = useMemo(() => {
    return getChartData(
      "blended",
      [],
      accounts,
      blendedAnalytics,
      businessTransactions,
      personalTransactions,
      showBusinessInBlended,
      showPersonalInBlended
    );
  }, [businessTransactions, personalTransactions, accounts, blendedAnalytics, showBusinessInBlended, showPersonalInBlended]);

  if (!blendedAnalytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No analytics data yet. Connect a bank account to see insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {blendedAnalytics.topCategories && blendedAnalytics.topCategories.length > 0 && (
        <TopCategoriesList
          title="Top Spending Categories (All)"
          categories={blendedAnalytics.topCategories}
          totalSpent={blendedAnalytics.totalSpent}
        />
      )}
    </div>
  );
}

