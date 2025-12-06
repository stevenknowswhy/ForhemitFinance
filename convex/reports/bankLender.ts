/**
 * Bank/Lender Application Snapshot Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "./utils";

/**
 * Get comprehensive report data for Bank/Lender Application Snapshot
 */
export const getBankLenderReportData = query({
  args: {
    startDate: v.optional(v.number()), // Timestamp in milliseconds
    endDate: v.optional(v.number()), // Timestamp in milliseconds
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    // Get business profile
    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Get transactions for date range
    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000); // Default: last 12 months
    const endDate = args.endDate || Date.now();

    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter transactions by date range
    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate revenue and expenses
    const revenue = transactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netIncome = revenue - expenses;

    // Group by category for top categories
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

    // Calculate monthly breakdown
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    transactions.forEach((t: any) => {
      const date = new Date(t.dateTimestamp || new Date(t.date).getTime());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      if (t.amount > 0) {
        monthlyData[monthKey].revenue += t.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(t.amount);
      }
    });

    const monthlyBreakdown = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        netIncome: data.revenue - data.expenses,
      }));

    // Calculate average monthly revenue and expenses
    const months = Object.keys(monthlyData).length || 1;
    const averageMonthlyRevenue = revenue / months;
    const averageMonthlyExpenses = expenses / months;

    // Calculate month-over-month growth (if we have at least 2 months)
    let monthOverMonthGrowth = null;
    if (monthlyBreakdown.length >= 2) {
      const lastMonth = monthlyBreakdown[monthlyBreakdown.length - 1];
      const previousMonth = monthlyBreakdown[monthlyBreakdown.length - 2];
      if (previousMonth.revenue > 0) {
        monthOverMonthGrowth = ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
      }
    }

    // Calculate net margin
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return {
      businessProfile: businessProfile ? {
        businessName: businessProfile.legalBusinessName || businessProfile.dbaTradeName,
        businessType: businessProfile.businessCategory,
        ein: businessProfile.einTaxId,
        industry: businessProfile.businessCategory,
        address: businessProfile.registeredAddress || businessProfile.headquartersAddress,
      } : null,
      accounts: accounts.map((a: any) => ({
        name: a.name,
        type: a.type,
        balance: a.balance || 0,
      })),
      dateRange: {
        start: startDate,
        end: endDate,
      },
      summary: {
        revenue,
        expenses,
        netIncome,
        netMargin,
        averageMonthlyRevenue,
        averageMonthlyExpenses,
      },
      topRevenueCategories,
      topExpenseCategories,
      monthlyBreakdown,
      metrics: {
        netMargin,
        averageMonthlyRevenue: averageMonthlyRevenue,
        averageMonthlyExpenses: averageMonthlyExpenses,
        monthOverMonthGrowth,
      },
    };
  },
});

