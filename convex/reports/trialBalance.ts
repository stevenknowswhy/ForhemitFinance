/**
 * Trial Balance Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Trial Balance data
 */
export const getTrialBalanceData = query({
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

    const trialBalance: Array<{
      account: string;
      accountId: string;
      accountType: string;
      debit: number;
      credit: number;
    }> = [];

    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      // Get all entry lines for this account up to asOfDate
      const entries = await ctx.db
        .query("entries_final")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.lte(q.field("date"), asOfDate))
        .collect();

      let debitTotal = 0;
      let creditTotal = 0;

      for (const entry of entries) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), account._id))
          .collect();

        for (const line of lines) {
          if (line.side === "debit") {
            debitTotal += line.amount;
          } else {
            creditTotal += line.amount;
          }
        }
      }

      // For assets and expenses: normal balance is debit
      // For liabilities, equity, and income: normal balance is credit
      if (account.type === "asset" || account.type === "expense") {
        if (debitTotal > creditTotal) {
          trialBalance.push({
            account: account.name,
            accountId: account._id,
            accountType: account.type,
            debit: debitTotal - creditTotal,
            credit: 0,
          });
          totalDebits += debitTotal - creditTotal;
        } else {
          trialBalance.push({
            account: account.name,
            accountId: account._id,
            accountType: account.type,
            debit: 0,
            credit: creditTotal - debitTotal,
          });
          totalCredits += creditTotal - debitTotal;
        }
      } else {
        // liability, equity, income
        if (creditTotal > debitTotal) {
          trialBalance.push({
            account: account.name,
            accountId: account._id,
            accountType: account.type,
            debit: 0,
            credit: creditTotal - debitTotal,
          });
          totalCredits += creditTotal - debitTotal;
        } else {
          trialBalance.push({
            account: account.name,
            accountId: account._id,
            accountType: account.type,
            debit: debitTotal - creditTotal,
            credit: 0,
          });
          totalDebits += debitTotal - creditTotal;
        }
      }
    }

    // If no entry data, use account balances
    if (totalDebits === 0 && totalCredits === 0) {
      accounts.forEach((account: any) => {
        const balance = account.balance || 0;
        if (account.type === "asset" || account.type === "expense") {
          if (balance > 0) {
            trialBalance.push({
              account: account.name,
              accountId: account._id,
              accountType: account.type,
              debit: balance,
              credit: 0,
            });
            totalDebits += balance;
          }
        } else {
          if (balance > 0) {
            trialBalance.push({
              account: account.name,
              accountId: account._id,
              accountType: account.type,
              debit: 0,
              credit: balance,
            });
            totalCredits += balance;
          }
        }
      });
    }

    return {
      asOfDate,
      entries: trialBalance.sort((a, b) => {
        // Sort by account type order: assets, liabilities, equity, income, expenses
        const typeOrder: Record<string, number> = {
          asset: 1,
          liability: 2,
          equity: 3,
          income: 4,
          expense: 5,
        };
        return (typeOrder[a.accountType] || 99) - (typeOrder[b.accountType] || 99);
      }),
      totals: {
        debits: totalDebits,
        credits: totalCredits,
      },
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      difference: totalDebits - totalCredits,
    };
  },
});

