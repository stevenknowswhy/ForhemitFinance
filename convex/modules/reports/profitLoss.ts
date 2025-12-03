/**
 * Profit & Loss (P&L) Statement Report
 */

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getAuthenticatedUser, calculateAccountBalanceFromEntries, isReportsModuleEnabled } from "./utils";

/**
 * Get Profit & Loss (P&L) Statement data
 * Returns null if reports module is not enabled
 */
export const getProfitAndLossData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    filterType: v.optional(v.union(
      v.literal("business"),
      v.literal("personal"),
      v.literal("blended")
    )),
    mode: v.optional(v.union(
      v.literal("simple"),
      v.literal("advanced")
    )),
    breakdownBy: v.optional(v.union(
      v.literal("category"),
      v.literal("product"),
      v.literal("revenue_stream")
    )),
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    // Check module enablement if orgId provided
    if (args.orgId) {
      const isEnabled = await isReportsModuleEnabled(ctx, args.orgId);
      if (!isEnabled) {
        return null; // Module not enabled, return null
      }
    }

    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const filterType = args.filterType || "blended";
    const mode = args.mode || "simple";

    // Get all accounts
    const allAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter accounts based on type
    let accounts = allAccounts;
    if (filterType === "business") {
      accounts = accounts.filter((a: any) => a.isBusiness === true);
    } else if (filterType === "personal") {
      accounts = accounts.filter((a: any) => a.isBusiness === false);
    }

    // Get income accounts
    const incomeAccounts = accounts.filter((a: any) => a.type === "income");
    // Get expense accounts
    const expenseAccounts = accounts.filter((a: any) => a.type === "expense");

    // Calculate revenue from income accounts
    const revenueItems: Array<{ account: string; amount: number }> = [];
    let totalRevenue = 0;

    for (const account of incomeAccounts) {
      const balance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, endDate);
      // For income accounts, we need to filter by date range
      // Get entries in date range
      const entries = await ctx.db
        .query("entries_final")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        ))
        .collect();

      let accountRevenue = 0;
      for (const entry of entries) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), account._id))
          .collect();

        for (const line of lines) {
          if (line.side === "credit") {
            accountRevenue += line.amount;
          } else {
            accountRevenue -= line.amount;
          }
        }
      }

      if (accountRevenue > 0) {
        revenueItems.push({ account: account.name, amount: accountRevenue });
        totalRevenue += accountRevenue;
      }
    }

    // Calculate expenses from expense accounts
    const expenseItems: Array<{ account: string; amount: number }> = [];
    let totalExpenses = 0;

    for (const account of expenseAccounts) {
      const entries = await ctx.db
        .query("entries_final")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        ))
        .collect();

      let accountExpense = 0;
      for (const entry of entries) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), account._id))
          .collect();

        for (const line of lines) {
          if (line.side === "debit") {
            accountExpense += line.amount;
          } else {
            accountExpense -= line.amount;
          }
        }
      }

      if (accountExpense > 0) {
        expenseItems.push({ account: account.name, amount: accountExpense });
        totalExpenses += accountExpense;
      }
    }

    // Also calculate from transactions if we don't have enough entry data
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      const inRange = transactionDate >= startDate && transactionDate <= endDate;
      if (filterType === "business") {
        return inRange && t.isBusiness === true;
      } else if (filterType === "personal") {
        return inRange && t.isBusiness === false;
      }
      return inRange;
    });

    // If we have transactions but no entry data, use transactions
    if (revenueItems.length === 0 && expenseItems.length === 0) {
      transactions.forEach((t: any) => {
        if (t.amount > 0) {
          totalRevenue += t.amount;
        } else {
          totalExpenses += Math.abs(t.amount);
        }
      });
    }

    const netIncome = totalRevenue - totalExpenses;

    // Group by category if breakdown requested
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

    return {
      dateRange: { start: startDate, end: endDate },
      filterType,
      mode,
      revenue: {
        total: totalRevenue,
        items: revenueItems,
        byCategory: Object.entries(revenueByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      expenses: {
        total: totalExpenses,
        items: expenseItems,
        byCategory: Object.entries(expensesByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      netIncome,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    };
  },
});

