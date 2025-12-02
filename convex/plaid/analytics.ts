/**
 * Transaction analytics queries
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";
import { limitArray, normalizeLimit, MAX_CONVEX_ARRAY_LENGTH, DEFAULT_QUERY_LIMIT } from "../helpers/convexLimits";

/**
 * Get transaction analytics
 */
export const getMockTransactionAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Collect transactions with safe limit to prevent exceeding Convex array limits
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply safe limit before filtering (to prevent processing too many)
    const safeTransactions = limitArray(allTransactions, MAX_CONVEX_ARRAY_LENGTH);

    // Filter by date
    const transactions = safeTransactions.filter(t => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate;
    });

    // Calculate totals
    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    // Top spending categories
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Daily spending trend
    const dailySpending: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const date = new Date(t.dateTimestamp || new Date(t.date).getTime()).toLocaleDateString();
        dailySpending[date] = (dailySpending[date] || 0) + Math.abs(t.amount);
      }
    });

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netCashFlow: Math.round((totalIncome - totalSpent) * 100) / 100,
      transactionCount: transactions.length,
      topCategories,
      dailySpending,
      averageDailySpending: Math.round((totalSpent / days) * 100) / 100,
    };
  },
});

/**
 * Get transaction analytics filtered by business/personal classification
 * Phase 1: Updated to use org context
 */
export const getFilteredTransactionAnalytics = query({
  args: {
    days: v.optional(v.number()),
    filterType: v.optional(v.union(v.literal("business"), v.literal("personal"), v.literal("all"))),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Phase 1: Use org context helper
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filterType = args.filterType || "all";

    // Phase 1: Query by orgId instead of userId
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Apply safe limit before filtering (to prevent processing too many)
    const safeTransactions = limitArray(allTransactions, MAX_CONVEX_ARRAY_LENGTH);

    // Filter by date
    let transactions = safeTransactions.filter(t => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate;
    });

    // Filter by business/personal classification
    if (filterType === "business") {
      transactions = transactions.filter(t => t.isBusiness === true);
    } else if (filterType === "personal") {
      transactions = transactions.filter(t => t.isBusiness === false);
    }
    // "all" includes everything (no filter)

    // Calculate totals
    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    // Top spending categories
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Daily spending trend
    const dailySpending: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const date = new Date(t.dateTimestamp || new Date(t.date).getTime()).toLocaleDateString();
        dailySpending[date] = (dailySpending[date] || 0) + Math.abs(t.amount);
      }
    });

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netCashFlow: Math.round((totalIncome - totalSpent) * 100) / 100,
      transactionCount: transactions.length,
      topCategories,
      dailySpending,
      averageDailySpending: Math.round((totalSpent / days) * 100) / 100,
      filterType,
    };
  },
});

/**
 * Get transactions filtered by business/personal classification
 */
export const getFilteredTransactions = query({
  args: {
    limit: v.optional(v.number()),
    filterType: v.optional(v.union(v.literal("business"), v.literal("personal"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by business/personal classification
    const filterType = args.filterType || "all";
    if (filterType === "business") {
      transactions = transactions.filter(t => t.isBusiness === true);
    } else if (filterType === "personal") {
      transactions = transactions.filter(t => t.isBusiness === false);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => {
      const dateA = a.dateTimestamp || new Date(a.date).getTime();
      const dateB = b.dateTimestamp || new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Apply safe limit using helper function
    const safeLimit = normalizeLimit(args.limit, DEFAULT_QUERY_LIMIT);
    return limitArray(transactions, safeLimit);
  },
});

/**
 * Get account classification statistics
 */
export const getAccountClassificationStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply safe limits (accounts and transactions should be reasonable, but safety first)
    const safeAccounts = limitArray(accounts, DEFAULT_QUERY_LIMIT);
    const safeTransactions = limitArray(transactions, MAX_CONVEX_ARRAY_LENGTH);

    const totalAccounts = safeAccounts.length;
    const classifiedAccounts = safeAccounts.filter(a => a.isBusiness !== undefined).length;
    const businessAccounts = safeAccounts.filter(a => a.isBusiness === true).length;
    const personalAccounts = safeAccounts.filter(a => a.isBusiness === false).length;

    const totalTransactions = safeTransactions.length;
    const classifiedTransactions = safeTransactions.filter(t => t.isBusiness !== undefined).length;
    const businessTransactions = safeTransactions.filter(t => t.isBusiness === true).length;
    const personalTransactions = safeTransactions.filter(t => t.isBusiness === false).length;

    const accountClassificationPercent = totalAccounts > 0
      ? Math.round((classifiedAccounts / totalAccounts) * 100)
      : 0;

    const transactionClassificationPercent = totalTransactions > 0
      ? Math.round((classifiedTransactions / totalTransactions) * 100)
      : 0;

    return {
      accounts: {
        total: totalAccounts,
        classified: classifiedAccounts,
        business: businessAccounts,
        personal: personalAccounts,
        classificationPercent: accountClassificationPercent,
      },
      transactions: {
        total: totalTransactions,
        classified: classifiedTransactions,
        business: businessTransactions,
        personal: personalTransactions,
        classificationPercent: transactionClassificationPercent,
      },
      overallClassificationPercent: Math.round(
        (accountClassificationPercent + transactionClassificationPercent) / 2
      ),
    };
  },
});

