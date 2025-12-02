/**
 * General Ledger Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthenticatedUser } from "./utils";

/**
 * Get General Ledger Report data
 */
export const getGeneralLedgerData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();

    // Get entries in date range
    const entries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.and(
        q.gte(q.field("date"), startDate),
        q.lte(q.field("date"), endDate)
      ))
      .collect();

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const accountMap = new Map(accounts.map((a: any) => [a._id, a]));

    // Build ledger entries
    const ledgerEntries: Array<{
      date: number;
      entryId: string;
      memo: string;
      account: string;
      accountId: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    // If filtering by account
    if (args.accountId) {
      let runningBalance = 0;
      for (const entry of entries.sort((a, b) => a.date - b.date)) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), args.accountId))
          .collect();

        for (const line of lines) {
          const account = accountMap.get(line.accountId);
          if (!account) continue;

          if (account.type === "asset" || account.type === "expense") {
            if (line.side === "debit") {
              runningBalance += line.amount;
            } else {
              runningBalance -= line.amount;
            }
          } else {
            if (line.side === "credit") {
              runningBalance += line.amount;
            } else {
              runningBalance -= line.amount;
            }
          }

          ledgerEntries.push({
            date: entry.date,
            entryId: entry._id,
            memo: entry.memo,
            account: account.name,
            accountId: account._id,
            debit: line.side === "debit" ? line.amount : 0,
            credit: line.side === "credit" ? line.amount : 0,
            balance: runningBalance,
          });
        }
      }
    } else {
      // All accounts
      for (const entry of entries.sort((a, b) => a.date - b.date)) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .collect();

        for (const line of lines) {
          const account = accountMap.get(line.accountId);
          if (!account) continue;

          ledgerEntries.push({
            date: entry.date,
            entryId: entry._id,
            memo: entry.memo,
            account: account.name,
            accountId: account._id,
            debit: line.side === "debit" ? line.amount : 0,
            credit: line.side === "credit" ? line.amount : 0,
            balance: 0, // Would need to calculate running balance per account
          });
        }
      }
    }

    return {
      dateRange: { start: startDate, end: endDate },
      accountId: args.accountId,
      entries: ledgerEntries,
      accounts: accounts.map((a: any) => ({
        _id: a._id,
        name: a.name,
        type: a.type,
      })),
    };
  },
});

