/**
 * Business Tab Component
 */

"use client";

import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { CashFlowChart } from "../../dashboard/components/CashFlowChart";
import { SpendingByCategoryChart } from "../../dashboard/components/SpendingByCategoryChart";
import { IncomeVsExpensesChart } from "../../dashboard/components/IncomeVsExpensesChart";
import { MonthlyTrendChart } from "../../dashboard/components/MonthlyTrendChart";
import { TopCategoriesList } from "./TopCategoriesList";
import type { AnalyticsData } from "../types";

interface BusinessTabProps {
  analytics: AnalyticsData | null;
  burnRate: number;
  runway: number | null;
  chartData: {
    cashFlow: any[];
    category: any[];
    monthlyIncomeVsExpenses: any[];
    monthlyTrends: any[];
  };
}

export function BusinessTab({ analytics, burnRate, runway, chartData }: BusinessTabProps) {
  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No business data yet. Tag transactions as business to see insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <DashboardCard
          title="Business Revenue"
          value={`$${analytics.totalIncome.toLocaleString()}`}
          valueClassName="text-green-600 dark:text-green-400"
          tooltip="Total business income from all business-tagged transactions"
        />
        <DashboardCard
          title="Business Expenses"
          value={`$${analytics.totalSpent.toLocaleString()}`}
          valueClassName="text-red-600 dark:text-red-400"
          tooltip="Total business expenses from all business-tagged transactions"
        />
        <DashboardCard
          title="Net Cash Flow"
          value={`$${analytics.netCashFlow.toLocaleString()}`}
          valueClassName={analytics.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          tooltip="Business income minus business expenses"
        />
        <DashboardCard
          title="Burn Rate"
          value={`$${burnRate.toLocaleString()}`}
          subtitle={runway ? `${runway} months runway` : "Positive cash flow"}
          valueClassName={burnRate > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
          tooltip="Monthly net cash burn. Runway shows months until $0 at current burn rate."
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
        title="Top Business Categories"
        categories={analytics.topCategories}
        totalSpent={analytics.totalSpent}
      />
    </div>
  );
}

