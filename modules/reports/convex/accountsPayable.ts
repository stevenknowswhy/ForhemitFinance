/**
 * Accounts Payable Report
 * Note: Full AP tracking requires bills schema. This works with expense transactions.
 */

import { query } from "../../../../convex/_generated/server";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Accounts Payable Summary
 * Note: Full AP tracking requires bills schema. This works with expense transactions.
 */
export const getAccountsPayableData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    // Get expense transactions as a proxy for payables
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const expenseTransactions = allTransactions.filter((t: any) => t.amount < 0);

    // Group by vendor
    const byVendor: Record<string, Array<{ date: number; amount: number; description: string }>> = {};
    expenseTransactions.forEach((t: any) => {
      const vendor = t.merchant || t.merchantName || "Unknown Vendor";
      if (!byVendor[vendor]) {
        byVendor[vendor] = [];
      }
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      byVendor[vendor].push({
        date: transactionDate,
        amount: Math.abs(t.amount),
        description: t.description,
      });
    });

    // Calculate due dates (assuming 30-day payment terms)
    const outstandingBills = expenseTransactions
      .map((t: any) => {
        const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
        const dueDate = transactionDate + (30 * 24 * 60 * 60 * 1000);
        return {
          vendor: t.merchant || t.merchantName || "Unknown Vendor",
          amount: Math.abs(t.amount),
          date: transactionDate,
          dueDate,
          description: t.description,
          isOverdue: dueDate < now,
        };
      })
      .filter((bill: any) => bill.dueDate >= now - (90 * 24 * 60 * 60 * 1000)) // Last 90 days
      .sort((a, b) => a.dueDate - b.dueDate);

    const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + bill.amount, 0);

    return {
      totalOutstanding,
      outstandingBills,
      vendors: Object.entries(byVendor)
        .map(([vendor, transactions]) => ({
          vendor,
          totalOwed: transactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: transactions.length,
        }))
        .sort((a, b) => b.totalOwed - a.totalOwed),
      note: "This report uses expense transactions as a proxy. Full AP tracking requires bill management.",
    };
  },
});

