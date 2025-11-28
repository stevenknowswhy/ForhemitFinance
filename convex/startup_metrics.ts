/**
 * Startup-specific metrics: Burn rate, runway, MMRR, etc.
 * These are critical for early-stage founders
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Calculate monthly burn rate
 * Burn rate = (Starting cash - Ending cash) / Number of months
 */
export const getBurnRate = query({
  args: {
    months: v.optional(v.number()), // Default to last 3 months
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

    const months = args.months || 3;
    const now = Date.now();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);

    // Get all cash accounts (asset accounts)
    const cashAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "asset")
      )
      .collect();

    // Get starting balance (from entry_lines)
    const startingBalance = await calculateAccountBalance(
      ctx,
      cashAccounts.map((a) => a._id),
      startDate.getTime()
    );

    // Get ending balance (current)
    const endingBalance = await calculateAccountBalance(
      ctx,
      cashAccounts.map((a) => a._id),
      now
    );

    const totalBurn = startingBalance - endingBalance;
    const monthlyBurn = totalBurn / months;

    return {
      monthlyBurn: Math.abs(monthlyBurn),
      totalBurn: Math.abs(totalBurn),
      months,
      startingBalance,
      endingBalance,
      runwayMonths: endingBalance / Math.abs(monthlyBurn), // Months until $0
    };
  },
});

/**
 * Calculate cash runway (months until $0 at current burn rate)
 */
export const getRunway = query({
  args: {},
  handler: async (ctx) => {
    const burnRate = await ctx.runQuery("startup_metrics:getBurnRate" as any, {
      months: 3,
    });

    return {
      monthsRemaining: Math.floor(burnRate.runwayMonths),
      currentBalance: burnRate.endingBalance,
      monthlyBurn: burnRate.monthlyBurn,
      status: getRunwayStatus(burnRate.runwayMonths),
    };
  },
});

/**
 * Get top spend categories for the period
 */
export const getTopSpendCategories = query({
  args: {
    months: v.optional(v.number()),
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

    const months = args.months || 1;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get expense accounts
    const expenseAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "expense")
      )
      .collect();

    // Get all expense entries in the period
    const entries = await ctx.db
      .query("entries_final")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate.getTime())
      )
      .collect();

    // Aggregate by account
    const categorySpend: Record<string, number> = {};

    for (const entry of entries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q) => q.eq("entryId", entry._id))
        .collect();

      for (const line of lines) {
        if (line.side === "debit") {
          const account = expenseAccounts.find((a) => a._id === line.accountId);
          if (account) {
            categorySpend[account.name] =
              (categorySpend[account.name] || 0) + line.amount;
          }
        }
      }
    }

    // Sort by amount and return top 10
    return Object.entries(categorySpend)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  },
});

/**
 * Get financial health score (0-100)
 * Based on burn rate, runway, spending trends, etc.
 */
export const getFinancialHealthScore = query({
  args: {},
  handler: async (ctx) => {
    const burnRate = await ctx.runQuery("startup_metrics:getBurnRate" as any, {
      months: 3,
    });

    const runway = await ctx.runQuery("startup_metrics:getRunway" as any, {});

    let score = 100;

    // Deduct points for low runway
    if (runway.monthsRemaining < 3) {
      score -= 40;
    } else if (runway.monthsRemaining < 6) {
      score -= 20;
    } else if (runway.monthsRemaining < 12) {
      score -= 10;
    }

    // Deduct points for high burn rate relative to balance
    const burnRatio = burnRate.monthlyBurn / burnRate.endingBalance;
    if (burnRatio > 0.5) {
      score -= 20;
    } else if (burnRatio > 0.3) {
      score -= 10;
    }

    // TODO: Add more factors:
    // - Spending trend (increasing/decreasing)
    // - Revenue growth
    // - Expense categorization quality

    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        runway: runway.monthsRemaining,
        burnRate: burnRate.monthlyBurn,
        status: runway.status,
      },
    };
  },
});

// Helper functions

async function calculateAccountBalance(
  ctx: any,
  accountIds: string[],
  asOfDate: number
): Promise<number> {
  let balance = 0;

  for (const accountId of accountIds) {
    // Get all entry lines for this account up to the date
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

function getRunwayStatus(months: number): "critical" | "warning" | "healthy" {
  if (months < 3) {
    return "critical";
  } else if (months < 6) {
    return "warning";
  } else {
    return "healthy";
  }
}

