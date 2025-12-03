/**
 * Business KPI Dashboard Report
 */

import { v } from "convex/values";
import { query } from "../../../../convex/_generated/server";
import { api } from "../../../../convex/_generated/api";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Business KPI Dashboard Report data
 */
export const getKPIDashboardData: ReturnType<typeof query> = query({
  args: {
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
    const startDate = args.startDate || now - (365 * 24 * 60 * 60 * 1000);

    // Get P&L data
    const pnlData = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "business",
      mode: "advanced",
    });

    // Calculate gross margin
    const grossMargin = pnlData && pnlData.revenue.total > 0
      ? ((pnlData.revenue.total - pnlData.expenses.total) / pnlData.revenue.total) * 100
      : 0;

    // Calculate revenue growth
    const previousStartDate = startDate - (endDate - startDate);
    const previousPnL = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate: previousStartDate,
      endDate: startDate,
      filterType: "business",
      mode: "simple",
    });

    const revenueGrowth = previousPnL && previousPnL.revenue.total > 0
      ? ((pnlData?.revenue.total || 0) - previousPnL.revenue.total) / previousPnL.revenue.total * 100
      : null;

    // Get transactions for ARPU and product stats
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate && t.isBusiness === true;
    });

    // Calculate ARPU (Average Revenue Per User/Transaction)
    const revenueTransactions = transactions.filter((t: any) => t.amount > 0);
    const arpu = revenueTransactions.length > 0
      ? revenueTransactions.reduce((sum, t) => sum + t.amount, 0) / revenueTransactions.length
      : 0;

    // Owner compensation (expenses categorized as owner compensation)
    const ownerCompensation = transactions
      .filter((t: any) => {
        const category = (t.categoryName || (t.category && t.category[0]) || "").toLowerCase();
        return t.amount < 0 && (
          category.includes("compensation") ||
          category.includes("salary") ||
          category.includes("owner") ||
          category.includes("draw")
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Product/revenue stream breakdown
    const revenueByProduct: Record<string, number> = {};
    transactions.forEach((t: any) => {
      if (t.amount > 0) {
        const product = t.merchant || t.merchantName || t.description || "Other";
        revenueByProduct[product] = (revenueByProduct[product] || 0) + t.amount;
      }
    });

    const topProducts = Object.entries(revenueByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([product, amount]) => ({ product, amount }));

    return {
      dateRange: { start: startDate, end: endDate },
      revenue: pnlData?.revenue.total || 0,
      expenses: pnlData?.expenses.total || 0,
      grossMargin,
      revenueGrowth,
      arpu,
      ownerCompensation,
      topProducts,
      // Note: CAC, LTV, and Churn would require additional data tracking
      // These are placeholders for when that data becomes available
      cac: null, // Customer Acquisition Cost - requires marketing spend tracking
      ltv: null, // Lifetime Value - requires customer lifetime data
      churn: null, // Churn rate - requires subscription tracking
    };
  },
});

