/**
 * Personal Tab Component
 */

"use client";

import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { CashFlowChart } from "../../dashboard/components/CashFlowChart";
import { SpendingByCategoryChart } from "../../dashboard/components/SpendingByCategoryChart";
import { IncomeVsExpensesChart } from "../../dashboard/components/IncomeVsExpensesChart";
import { MonthlyTrendChart } from "../../dashboard/components/MonthlyTrendChart";
import { TopCategoriesList } from "./TopCategoriesList";
import type { AnalyticsData } from "../types";

interface PersonalTabProps {
  analytics: AnalyticsData | null;
  chartData: {
    cashFlow: any[];
    category: any[];
    monthlyIncomeVsExpenses: any[];
    monthlyTrends: any[];
  };
}

export function PersonalTab({ analytics, chartData }: PersonalTabProps) {
  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No personal data yet. Tag transactions as personal to see insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <DashboardCard
          title="Personal Income"
          value={`$${analytics.totalIncome.toLocaleString()}`}
          valueClassName="text-green-600 dark:text-green-400"
          tooltip="Total personal income from all personal-tagged transactions"
        />
        <DashboardCard
          title="Personal Spending"
          value={`$${analytics.totalSpent.toLocaleString()}`}
          valueClassName="text-red-600 dark:text-red-400"
          tooltip="Total personal expenses from all personal-tagged transactions"
        />
        <DashboardCard
          title="Net Cash Flow"
          value={`$${analytics.netCashFlow.toLocaleString()}`}
          valueClassName={analytics.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          tooltip="Personal income minus personal expenses"
        />
        <DashboardCard
          title="Avg Daily Spending"
          value={`$${analytics.averageDailySpending.toLocaleString()}`}
          valueClassName="text-primary"
          tooltip="Average daily personal spending over the last 30 days"
        />
      </div>

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

      <TopCategoriesList
        title="Top Personal Categories"
        categories={analytics.topCategories}
        totalSpent={analytics.totalSpent}
      />
    </div>
  );
}

