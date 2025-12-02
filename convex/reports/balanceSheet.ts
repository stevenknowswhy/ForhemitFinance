/**
 * Balance Sheet Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser, calculateAccountBalanceFromEntries } from "./utils";

/**
 * Get Balance Sheet data
 */
export const getBalanceSheetData = query({
  args: {
    asOfDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const asOfDate = args.asOfDate || Date.now();

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Calculate balances for each account type
    const assets: Array<{ account: string; balance: number }> = [];
    const liabilities: Array<{ account: string; balance: number }> = [];
    const equity: Array<{ account: string; balance: number }> = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      const balance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, asOfDate);

      if (account.type === "asset") {
        assets.push({ account: account.name, balance });
        totalAssets += balance;
      } else if (account.type === "liability") {
        liabilities.push({ account: account.name, balance: Math.abs(balance) });
        totalLiabilities += Math.abs(balance);
      } else if (account.type === "equity") {
        equity.push({ account: account.name, balance });
        totalEquity += balance;
      }
    }

    // If no entry data, use account balances
    if (totalAssets === 0 && totalLiabilities === 0 && totalEquity === 0) {
      accounts.forEach((account: any) => {
        const balance = account.balance || 0;
        if (account.type === "asset") {
          assets.push({ account: account.name, balance });
          totalAssets += balance;
        } else if (account.type === "liability") {
          liabilities.push({ account: account.name, balance: Math.abs(balance) });
          totalLiabilities += Math.abs(balance);
        } else if (account.type === "equity") {
          equity.push({ account: account.name, balance });
          totalEquity += balance;
        }
      });
    }

    // Calculate retained earnings (net income from all entries up to asOfDate)
    // Get all income and expense entries
    const allEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.lte(q.field("date"), asOfDate))
      .collect();

    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const entry of allEntries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
        .collect();

      for (const line of lines) {
        const account = accounts.find((a: any) => a._id === line.accountId);
        if (!account) continue;

        if (account.type === "income") {
          if (line.side === "credit") {
            totalRevenue += line.amount;
          } else {
            totalRevenue -= line.amount;
          }
        } else if (account.type === "expense") {
          if (line.side === "debit") {
            totalExpenses += line.amount;
          } else {
            totalExpenses -= line.amount;
          }
        }
      }
    }

    const retainedEarnings = totalRevenue - totalExpenses;

    return {
      asOfDate,
      assets: {
        items: assets,
        total: totalAssets,
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities,
      },
      equity: {
        items: equity,
        total: totalEquity,
        retainedEarnings,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity + retainedEarnings,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01,
    };
  },
});

