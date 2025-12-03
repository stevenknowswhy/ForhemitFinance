/**
 * Monthly/Quarterly Financial Summary Report
 */

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { api } from "../../_generated/api";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Monthly / Quarterly Financial Summary
 */
export const getFinancialSummaryData: ReturnType<typeof query> = query({
  args: {
    period: v.union(v.literal("monthly"), v.literal("quarterly")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const now = Date.now();
    const endDate = args.endDate || now;
    const startDate = args.startDate || (args.period === "quarterly"
      ? now - (90 * 24 * 60 * 60 * 1000)
      : now - (30 * 24 * 60 * 60 * 1000));

    // Get P&L data
    const pnlData = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "blended",
      mode: "simple",
    });

    // Get cash flow data
    const cashFlowData = await ctx.runQuery(api.reports.getCashFlowStatementData, {
      startDate,
      endDate,
      period: args.period,
    });

    // Get top categories
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
      if (t.amount > 0) {
        revenueByCategory[category] = (revenueByCategory[category] || 0) + t.amount;
      } else {
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    const topRevenueCategories = Object.entries(revenueByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Calculate trends (compare to previous period)
    const previousStartDate = startDate - (endDate - startDate);
    const previousPnL = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate: previousStartDate,
      endDate: startDate,
      filterType: "blended",
      mode: "simple",
    });

    const revenueTrend = previousPnL && previousPnL.revenue.total > 0
      ? ((pnlData?.revenue.total || 0) - previousPnL.revenue.total) / previousPnL.revenue.total * 100
      : null;

    const expenseTrend = previousPnL && previousPnL.expenses.total > 0
      ? ((pnlData?.expenses.total || 0) - previousPnL.expenses.total) / previousPnL.expenses.total * 100
      : null;

    return {
      period: args.period,
      dateRange: { start: startDate, end: endDate },
      revenue: pnlData?.revenue.total || 0,
      expenses: pnlData?.expenses.total || 0,
      profit: pnlData?.netIncome || 0,
      cashFlow: cashFlowData?.netChangeInCash || 0,
      topRevenueCategories,
      topExpenseCategories,
      trends: {
        revenue: revenueTrend,
        expenses: expenseTrend,
      },
    };
  },
});

