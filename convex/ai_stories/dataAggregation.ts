/**
 * Financial data aggregation for story generation
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import type { FinancialData } from "./types";
import { limitArray, MAX_CONVEX_ARRAY_LENGTH } from "../helpers/convexLimits";

/**
 * Aggregate financial data for a given period (query function)
 */
export const aggregateFinancialDataQuery = query({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<FinancialData> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    const periodStart = args.periodStart;
    const periodEnd = args.periodEnd;
    const periodType = args.periodType;

    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    // Get all accounts (apply safe limit)
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const safeAccounts = limitArray(accounts, 100);

    // Get all entries for the period (apply safe limit before filtering)
    const allEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const safeAllEntries = limitArray(allEntries, MAX_CONVEX_ARRAY_LENGTH);

    const periodEntries = safeAllEntries.filter(
      (e: any) => e.date >= periodStart && e.date <= periodEnd
    );

    // Get entry lines for period entries (with safety check)
    const entryLines: any[] = [];
    const maxEntryLines = MAX_CONVEX_ARRAY_LENGTH;
    for (const entry of periodEntries) {
      if (entryLines.length >= maxEntryLines) break; // Safety check
      
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      
      const remainingCapacity = maxEntryLines - entryLines.length;
      if (lines.length > remainingCapacity) {
        entryLines.push(...lines.slice(0, remainingCapacity));
        break; // Stop if we've reached the limit
      } else {
        entryLines.push(...lines);
      }
    }

    // Use safe arrays for calculations
    const accountsForCalculation = safeAccounts;
    const entryLinesForCalculation = limitArray(entryLines, MAX_CONVEX_ARRAY_LENGTH);

    // Calculate revenue (income accounts - credits)
    let revenue = 0;
    const incomeAccounts = accountsForCalculation.filter((a: any) => a.type === "income");
    for (const account of incomeAccounts) {
      for (const line of entryLinesForCalculation) {
        if (
          (line as any).accountId === (account as any)._id &&
          (line as any).side === "credit" &&
          (line as any).amount
        ) {
          revenue += (line as any).amount;
        }
      }
    }

    // Calculate expenses (expense accounts - debits)
    let expenses = 0;
    const expenseAccounts = accountsForCalculation.filter((a: any) => a.type === "expense");
    for (const account of expenseAccounts) {
      for (const line of entryLinesForCalculation) {
        if (
          (line as any).accountId === (account as any)._id &&
          (line as any).side === "debit" &&
          (line as any).amount
        ) {
          expenses += (line as any).amount;
        }
      }
    }

    const netIncome = revenue - expenses;

    // Calculate cash flow (asset accounts)
    let startingCash = 0;
    let endingCash = 0;
    const assetAccounts = accountsForCalculation.filter((a: any) => a.type === "asset");

    // Starting balance (before period)
    const entriesBeforePeriod = safeAllEntries.filter((e: any) => e.date < periodStart);
    const linesBeforePeriod: any[] = [];
    for (const entry of entriesBeforePeriod) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      linesBeforePeriod.push(...lines);
    }

    for (const account of assetAccounts) {
      for (const line of linesBeforePeriod) {
        if ((line as any).accountId === (account as any)._id) {
          if ((line as any).side === "debit") {
            startingCash += (line as any).amount;
          } else {
            startingCash -= (line as any).amount;
          }
        }
      }
    }

    // Ending balance (including period)
    for (const account of assetAccounts) {
      for (const line of entryLinesForCalculation) {
        if ((line as any).accountId === (account as any)._id) {
          if ((line as any).side === "debit") {
            endingCash += (line as any).amount;
          } else {
            endingCash -= (line as any).amount;
          }
        }
      }
    }
    endingCash = startingCash + (endingCash - startingCash);

    const cashFlow = endingCash - startingCash;

    // Calculate burn rate (for expenses > revenue)
    const monthlyBurn = expenses / (periodType === "monthly" ? 1 : periodType === "quarterly" ? 3 : 12);
    const burnRate = netIncome < 0 ? Math.abs(monthlyBurn) : 0;
    const runway = endingCash > 0 && burnRate > 0 ? endingCash / burnRate : 0;

    // Calculate debt metrics
    const liabilityAccounts = accountsForCalculation.filter((a: any) => a.type === "liability");
    let totalDebt = 0;
    for (const account of liabilityAccounts) {
      for (const line of entryLinesForCalculation) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          totalDebt += (line as any).amount;
        }
      }
    }
    const debtToIncome = revenue > 0 ? totalDebt / revenue : 0;
    const debtToRevenue = revenue > 0 ? totalDebt / revenue : 0;

    // Calculate growth (compare to previous period)
    const previousPeriodStart = periodStart - (periodEnd - periodStart);
    const previousPeriodEnd = periodStart;
    const previousEntries = safeAllEntries.filter(
      (e: any) => e.date >= previousPeriodStart && e.date < previousPeriodEnd
    );

    let previousRevenue = 0;
    let previousExpenses = 0;
    const previousLines: any[] = [];
    for (const entry of previousEntries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      previousLines.push(...lines);
    }

    for (const account of incomeAccounts) {
      for (const line of previousLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          previousRevenue += (line as any).amount;
        }
      }
    }

    for (const account of expenseAccounts) {
      for (const line of previousLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "debit") {
          previousExpenses += (line as any).amount;
        }
      }
    }

    const revenueGrowth =
      previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const growthRate = revenueGrowth;

    // Category breakdowns
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    for (const account of incomeAccounts) {
      let accountRevenue = 0;
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          accountRevenue += (line as any).amount;
        }
      }
      if (accountRevenue > 0) {
        revenueByCategory[account.name] = accountRevenue;
      }
    }

    for (const account of expenseAccounts) {
      let accountExpenses = 0;
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "debit") {
          accountExpenses += (line as any).amount;
        }
      }
      if (accountExpenses > 0) {
        expensesByCategory[account.name] = accountExpenses;
      }
    }

    const revenueByCategoryArray = Object.entries(revenueByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Period breakdown (monthly for quarterly/annual, weekly for monthly)
    const periodBreakdown: Array<{
      period: string;
      revenue: number;
      expenses: number;
      netIncome: number;
    }> = [];

    if (periodType === "monthly") {
      // Weekly breakdown for monthly
      const weeks = 4;
      const weekDuration = (periodEnd - periodStart) / weeks;
      for (let i = 0; i < weeks; i++) {
        const weekStart = periodStart + i * weekDuration;
        const weekEnd = periodStart + (i + 1) * weekDuration;
        const weekEntries = periodEntries.filter(
          (e: any) => e.date >= weekStart && e.date < weekEnd
        );
        // Calculate week totals (simplified)
        periodBreakdown.push({
          period: `Week ${i + 1}`,
          revenue: revenue / weeks,
          expenses: expenses / weeks,
          netIncome: netIncome / weeks,
        });
      }
    } else if (periodType === "quarterly") {
      // Monthly breakdown for quarterly
      const months = 3;
      const monthDuration = (periodEnd - periodStart) / months;
      for (let i = 0; i < months; i++) {
        const monthStart = periodStart + i * monthDuration;
        const monthEnd = periodStart + (i + 1) * monthDuration;
        periodBreakdown.push({
          period: `Month ${i + 1}`,
          revenue: revenue / months,
          expenses: expenses / months,
          netIncome: netIncome / months,
        });
      }
    } else {
      // Quarterly breakdown for annual
      const quarters = 4;
      for (let i = 0; i < quarters; i++) {
        periodBreakdown.push({
          period: `Q${i + 1}`,
          revenue: revenue / quarters,
          expenses: expenses / quarters,
          netIncome: netIncome / quarters,
        });
      }
    }

    // Account balances
    const accountBalances = accountsForCalculation.map((account: any) => {
      let balance = 0;
      for (const line of entryLinesForCalculation) {
        if ((line as any).accountId === account._id) {
          if (
            (account.type === "asset" || account.type === "expense") &&
            (line as any).side === "debit"
          ) {
            balance += (line as any).amount;
          } else if (
            (account.type === "liability" ||
              account.type === "equity" ||
              account.type === "income") &&
            (line as any).side === "credit"
          ) {
            balance += (line as any).amount;
          } else {
            balance -= (line as any).amount;
          }
        }
      }
      return {
        accountName: account.name,
        balance,
        type: account.type,
      };
    });

    // Transaction counts
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const periodTransactions = transactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= periodStart && transactionDate <= periodEnd;
    });

    const incomeTransactionCount = periodTransactions.filter(
      (t: any) => t.amount > 0
    ).length;
    const expenseTransactionCount = periodTransactions.filter(
      (t: any) => t.amount < 0
    ).length;

    // Month-over-month change
    const monthOverMonthChange = {
      revenue: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0,
      expenses: previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0,
      netIncome:
        previousRevenue - previousExpenses !== 0
          ? ((netIncome - (previousRevenue - previousExpenses)) /
            Math.abs(previousRevenue - previousExpenses)) *
          100
          : 0,
    };

    return {
      periodStart,
      periodEnd,
      periodType,
      revenue,
      expenses,
      netIncome,
      cashFlow,
      startingCash,
      endingCash,
      burnRate,
      runway,
      debtToIncome,
      debtToRevenue,
      growthRate,
      revenueGrowth,
      revenueByCategory: revenueByCategoryArray,
      expensesByCategory: expensesByCategoryArray,
      periodBreakdown,
      accountBalances,
      transactionCount: periodTransactions.length,
      incomeTransactionCount,
      expenseTransactionCount,
      monthOverMonthChange,
      businessType: user.businessType,
      businessEntityType: businessProfile?.entityType,
      accountingMethod: user.preferences.accountingMethod || "cash",
    };
  },
});
