/**
 * Generate investor-ready reports
 * P&L, cash flow, burn rate charts, etc.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Generate P&L statement for a period
 */
export const generateProfitAndLoss = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all entries in the period
    const entries = await ctx.db
      .query("entries_final")
      .withIndex("by_user_date", (q) =>
        q
          .eq("userId", user._id)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    // Get income accounts
    const incomeAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "income")
      )
      .collect();

    // Get expense accounts
    const expenseAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "expense")
      )
      .collect();

    // Calculate revenue
    const revenue: Record<string, number> = {};
    let totalRevenue = 0;

    for (const account of incomeAccounts) {
      revenue[account.name] = 0;
    }

    // Calculate expenses
    const expenses: Record<string, number> = {};
    let totalExpenses = 0;

    for (const account of expenseAccounts) {
      expenses[account.name] = 0;
    }

    // Process entries
    for (const entry of entries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q) => q.eq("entryId", entry._id))
        .collect();

      for (const line of lines) {
        const incomeAccount = incomeAccounts.find(
          (a) => a._id === line.accountId
        );
        const expenseAccount = expenseAccounts.find(
          (a) => a._id === line.accountId
        );

        if (incomeAccount && line.side === "credit") {
          revenue[incomeAccount.name] =
            (revenue[incomeAccount.name] || 0) + line.amount;
          totalRevenue += line.amount;
        }

        if (expenseAccount && line.side === "debit") {
          expenses[expenseAccount.name] =
            (expenses[expenseAccount.name] || 0) + line.amount;
          totalExpenses += line.amount;
        }
      }
    }

    const netIncome = totalRevenue - totalExpenses;

    return {
      period: {
        start: args.startDate,
        end: args.endDate,
      },
      revenue: {
        items: Object.entries(revenue).map(([name, amount]) => ({
          name,
          amount,
        })),
        total: totalRevenue,
      },
      expenses: {
        items: Object.entries(expenses).map(([name, amount]) => ({
          name,
          amount,
        })),
        total: totalExpenses,
      },
      netIncome,
      margin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
    };
  },
});

/**
 * Generate cash flow statement
 */
export const generateCashFlow = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get cash accounts
    const cashAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "asset")
      )
      .collect();

    // Calculate starting balance
    const startingBalance = await calculateCashBalance(
      ctx,
      cashAccounts.map((a) => a._id),
      args.startDate
    );

    // Calculate ending balance
    const endingBalance = await calculateCashBalance(
      ctx,
      cashAccounts.map((a) => a._id),
      args.endDate
    );

    // Get entries in period
    const entries = await ctx.db
      .query("entries_final")
      .withIndex("by_user_date", (q) =>
        q
          .eq("userId", user._id)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    let cashIn = 0;
    let cashOut = 0;

    for (const entry of entries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q) => q.eq("entryId", entry._id))
        .collect();

      for (const line of lines) {
        const isCashAccount = cashAccounts.some(
          (a) => a._id === line.accountId
        );

        if (isCashAccount) {
          if (line.side === "debit") {
            cashIn += line.amount;
          } else {
            cashOut += line.amount;
          }
        }
      }
    }

    const netCashFlow = cashIn - cashOut;

    return {
      period: {
        start: args.startDate,
        end: args.endDate,
      },
      startingBalance,
      cashIn,
      cashOut,
      netCashFlow,
      endingBalance,
    };
  },
});

/**
 * Generate investor pack (all reports combined)
 */
export const generateInvestorPack: ReturnType<typeof query> = query({
  args: {
    period: v.union(
      v.literal("last_month"),
      v.literal("last_quarter"),
      v.literal("last_year"),
      v.literal("ytd")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let startDate: number;
    let endDate = now;

    switch (args.period) {
      case "last_month":
        startDate = new Date(now).setMonth(new Date(now).getMonth() - 1);
        break;
      case "last_quarter":
        startDate = new Date(now).setMonth(new Date(now).getMonth() - 3);
        break;
      case "last_year":
        startDate = new Date(now).setFullYear(new Date(now).getFullYear() - 1);
        break;
      case "ytd":
        startDate = new Date(new Date(now).getFullYear(), 0, 1).getTime();
        break;
    }

    const pnl = await ctx.runQuery(api.investor_reports.generateProfitAndLoss, {
      startDate,
      endDate,
    });

    const cashFlow = await ctx.runQuery(api.investor_reports.generateCashFlow, {
      startDate,
      endDate,
    });

    const burnRate = await ctx.runQuery(api.startup_metrics.getBurnRate, {
      months: 3,
    });

    const runway = await ctx.runQuery("startup_metrics:getRunway" as any, {});

    const topSpend = await ctx.runQuery(
      "startup_metrics:getTopSpendCategories" as any,
      { months: 1 }
    );

    return {
      generatedAt: now,
      period: args.period,
      profitAndLoss: pnl,
      cashFlow,
      burnRate: {
        monthly: burnRate.monthlyBurn,
        total: burnRate.totalBurn,
      },
      runway: {
        monthsRemaining: runway.monthsRemaining,
        status: runway.status,
      },
      topSpendCategories: topSpend,
    };
  },
});

// Helper function
async function calculateCashBalance(
  ctx: any,
  accountIds: string[],
  asOfDate: number
): Promise<number> {
  let balance = 0;

  for (const accountId of accountIds) {
    const entries = await ctx.db
      .query("entries_final")
      .filter((q: any) => q.lte(q.field("date"), asOfDate))
      .collect();

    for (const entry of entries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
        .filter((q: any) => q.eq(q.field("accountId"), accountId))
        .collect();

      for (const line of lines) {
        if (line.side === "debit") {
          balance += line.amount;
        } else {
          balance -= line.amount;
        }
      }
    }
  }

  return balance;
}

