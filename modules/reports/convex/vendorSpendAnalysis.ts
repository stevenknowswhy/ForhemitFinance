/**
 * Vendor Spend Analysis Report
 */

import { v } from "convex/values";
import { query } from "../../../../convex/_generated/server";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Vendor Spend Analysis
 */
export const getVendorSpendAnalysisData = query({
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

    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return t.amount < 0 && transactionDate >= startDate && transactionDate <= endDate;
    });

    // Group by vendor
    const vendorSpend: Record<string, { total: number; transactions: number; lastTransaction: number }> = {};
    transactions.forEach((t: any) => {
      const vendor = t.merchant || t.merchantName || "Unknown Vendor";
      if (!vendorSpend[vendor]) {
        vendorSpend[vendor] = { total: 0, transactions: 0, lastTransaction: 0 };
      }
      vendorSpend[vendor].total += Math.abs(t.amount);
      vendorSpend[vendor].transactions += 1;
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      if (transactionDate > vendorSpend[vendor].lastTransaction) {
        vendorSpend[vendor].lastTransaction = transactionDate;
      }
    });

    const topVendors = Object.entries(vendorSpend)
      .map(([vendor, data]) => ({
        vendor,
        totalSpent: data.total,
        transactionCount: data.transactions,
        averageTransaction: data.total / data.transactions,
        lastTransaction: data.lastTransaction,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      dateRange: { start: startDate, end: endDate },
      totalSpend: topVendors.reduce((sum, v) => sum + v.totalSpent, 0),
      topVendors,
      vendorCount: topVendors.length,
    };
  },
});

