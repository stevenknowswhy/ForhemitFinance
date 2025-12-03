/**
 * Accounts Receivable Report
 * Note: Full AR tracking requires invoice schema. This works with revenue transactions.
 */

import { query } from "../../../../convex/_generated/server";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Accounts Receivable Summary
 * Note: Full AR tracking requires invoice schema. This works with revenue transactions.
 */
export const getAccountsReceivableData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    // For now, we'll use revenue transactions as a proxy for receivables
    // In a full implementation, this would query an invoices table
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Get recent revenue transactions (last 90 days) as potential receivables
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

    const revenueTransactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return t.amount > 0 && transactionDate >= ninetyDaysAgo;
    });

    // Group by customer/merchant
    const byCustomer: Record<string, Array<{ date: number; amount: number; description: string }>> = {};
    revenueTransactions.forEach((t: any) => {
      const customer = t.merchant || t.merchantName || "Unknown Customer";
      if (!byCustomer[customer]) {
        byCustomer[customer] = [];
      }
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      byCustomer[customer].push({
        date: transactionDate,
        amount: t.amount,
        description: t.description,
      });
    });

    // Calculate aging buckets
    const agingBuckets = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    revenueTransactions.forEach((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      const daysOld = (now - transactionDate) / (24 * 60 * 60 * 1000);
      if (daysOld <= 30) {
        agingBuckets["0-30"] += t.amount;
      } else if (daysOld <= 60) {
        agingBuckets["31-60"] += t.amount;
      } else if (daysOld <= 90) {
        agingBuckets["61-90"] += t.amount;
      } else {
        agingBuckets["90+"] += t.amount;
      }
    });

    const totalOutstanding = Object.values(agingBuckets).reduce((sum, amount) => sum + amount, 0);

    return {
      totalOutstanding,
      agingBuckets,
      customers: Object.entries(byCustomer)
        .map(([customer, transactions]) => ({
          customer,
          totalOwed: transactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: transactions.length,
          oldestTransaction: Math.min(...transactions.map((t: any) => t.date)),
        }))
        .sort((a, b) => b.totalOwed - a.totalOwed),
      note: "This report uses revenue transactions as a proxy. Full AR tracking requires invoice management.",
    };
  },
});

