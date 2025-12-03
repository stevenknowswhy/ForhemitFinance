/**
 * Burn Rate & Runway Report
 */

import { v } from "convex/values";
import { query } from "../../../../convex/_generated/server";
import { getAuthenticatedUser, calculateAccountBalanceFromEntries } from "./utils";

/**
 * Get Burn Rate + Runway Report data
 */
export const getBurnRateRunwayData = query({
  args: {
    months: v.optional(v.number()),
    scenarioRevenueIncrease: v.optional(v.number()), // Percentage increase (e.g., 20 for 20%)
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const months = args.months || 3;
    const now = Date.now();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);

    // Get all cash accounts
    const cashAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q: any) => q.eq("userId", user._id).eq("type", "asset"))
      .collect();

    // Calculate balances
    let startingBalance = 0;
    let endingBalance = 0;
    for (const account of cashAccounts) {
      startingBalance += await calculateAccountBalanceFromEntries(ctx, user._id, account._id, startDate.getTime());
      endingBalance += await calculateAccountBalanceFromEntries(ctx, user._id, account._id, now);
    }

    // If no entry data, use account balances
    if (startingBalance === 0 && endingBalance === 0) {
      cashAccounts.forEach((account: any) => {
        startingBalance += account.balance || 0;
        endingBalance += account.balance || 0;
      });
    }

    // Get transactions for monthly breakdown
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate.getTime() && transactionDate <= now;
    });

    // Calculate monthly burn
    const monthlyData: Record<string, { revenue: number; expenses: number; net: number }> = {};
    transactions.forEach((t: any) => {
      const date = new Date(t.dateTimestamp || new Date(t.date).getTime());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, net: 0 };
      }
      if (t.amount > 0) {
        monthlyData[monthKey].revenue += t.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(t.amount);
      }
      monthlyData[monthKey].net = monthlyData[monthKey].revenue - monthlyData[monthKey].expenses;
    });

    const monthlyBurns = Object.values(monthlyData).map((m: any) => -m.net); // Negative net = burn
    const averageMonthlyBurn = monthlyBurns.length > 0
      ? monthlyBurns.reduce((sum, burn) => sum + burn, 0) / monthlyBurns.length
      : (startingBalance - endingBalance) / months;

    const currentMonthlyBurn = monthlyBurns.length > 0 ? monthlyBurns[monthlyBurns.length - 1] : averageMonthlyBurn;

    // Calculate runway
    const runwayMonths = endingBalance > 0 && averageMonthlyBurn > 0
      ? endingBalance / averageMonthlyBurn
      : null;

    // Scenario analysis
    let scenarioRunway: number | null = null;
    if (args.scenarioRevenueIncrease && monthlyData) {
      const avgMonthlyRevenue = Object.values(monthlyData).reduce((sum, m) => sum + m.revenue, 0) / Object.keys(monthlyData).length;
      const increasedRevenue = avgMonthlyRevenue * (1 + args.scenarioRevenueIncrease / 100);
      const avgMonthlyExpenses = Object.values(monthlyData).reduce((sum, m) => sum + m.expenses, 0) / Object.keys(monthlyData).length;
      const scenarioBurn = avgMonthlyExpenses - increasedRevenue;
      if (scenarioBurn > 0) {
        scenarioRunway = endingBalance / scenarioBurn;
      }
    }

    return {
      months,
      startingBalance,
      endingBalance,
      totalBurn: startingBalance - endingBalance,
      monthlyBurns: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          expenses: data.expenses,
          burn: -data.net,
        })),
      averageMonthlyBurn,
      currentMonthlyBurn,
      runwayMonths,
      scenario: args.scenarioRevenueIncrease ? {
        revenueIncrease: args.scenarioRevenueIncrease,
        scenarioRunway,
      } : null,
    };
  },
});

