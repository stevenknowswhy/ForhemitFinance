/**
 * Cash Flow Statement Report (Indirect Method)
 */

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getAuthenticatedUser, calculateAccountBalanceFromEntries } from "./utils";

/**
 * Get Cash Flow Statement data (Indirect Method)
 */
export const getCashFlowStatementData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    period: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const period = args.period || "monthly";

    // Calculate net income for the period
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

    let netIncome = 0;
    for (const entry of entries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
        .collect();

      for (const line of lines) {
        const account = accounts.find((a: any) => a._id === line.accountId);
        if (!account) continue;

        if (account.type === "income") {
          if (line.side === "credit") {
            netIncome += line.amount;
          } else {
            netIncome -= line.amount;
          }
        } else if (account.type === "expense") {
          if (line.side === "debit") {
            netIncome -= line.amount;
          } else {
            netIncome += line.amount;
          }
        }
      }
    }

    // Calculate beginning and ending cash
    const assetAccounts = accounts.filter((a: any) => a.type === "asset");
    let beginningCash = 0;
    let endingCash = 0;

    for (const account of assetAccounts) {
      if (account.name.toLowerCase().includes("cash") || 
          account.name.toLowerCase().includes("checking") ||
          account.name.toLowerCase().includes("savings")) {
        beginningCash += await calculateAccountBalanceFromEntries(ctx, user._id, account._id, startDate);
        endingCash += await calculateAccountBalanceFromEntries(ctx, user._id, account._id, endDate);
      }
    }

    // Operating Activities (Indirect Method)

    // Calculate changes in working capital
    const currentAssetAccounts = accounts.filter((a: any) => a.type === "asset");
    const liabilityAccounts = accounts.filter((a: any) => a.type === "liability");

    // Calculate changes in current assets (excluding cash)
    let changeInCurrentAssets = 0;
    for (const account of currentAssetAccounts) {
      if (account.name.toLowerCase().includes("cash") || 
          account.name.toLowerCase().includes("checking") ||
          account.name.toLowerCase().includes("savings")) {
        continue; // Skip cash accounts
      }
      const startBalance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, startDate);
      const endBalance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, endDate);
      changeInCurrentAssets += (endBalance - startBalance);
    }

    // Calculate changes in current liabilities
    let changeInCurrentLiabilities = 0;
    for (const account of liabilityAccounts) {
      const startBalance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, startDate);
      const endBalance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, endDate);
      changeInCurrentLiabilities += (endBalance - startBalance);
    }

    // Cash from operations
    const cashFromOperations = netIncome - changeInCurrentAssets + changeInCurrentLiabilities;

    // Investing Activities (simplified - would need more detail in production)
    const cashFromInvesting = 0; // Placeholder

    // Financing Activities (simplified)
    const cashFromFinancing = 0; // Placeholder

    // Net change in cash
    const netChangeInCash = cashFromOperations + cashFromInvesting + cashFromFinancing;

    // Monthly/Quarterly breakdown
    const periods: Array<{
      period: string;
      netIncome: number;
      cashFromOperations: number;
      cashFromInvesting: number;
      cashFromFinancing: number;
      netChangeInCash: number;
    }> = [];

    if (period === "monthly") {
      const current = new Date(startDate);
      while (current.getTime() <= endDate) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Last day of month

        const periodStartTime = periodStart.getTime();
        const periodEndTime = Math.min(periodEnd.getTime(), endDate);

        // Calculate period net income
        const periodEntries = await ctx.db
          .query("entries_final")
          .withIndex("by_user", (q: any) => q.eq("userId", user._id))
          .filter((q: any) => q.and(
            q.gte(q.field("date"), periodStartTime),
            q.lte(q.field("date"), periodEndTime)
          ))
          .collect();

        let periodNetIncome = 0;
        for (const entry of periodEntries) {
          const lines = await ctx.db
            .query("entry_lines")
            .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
            .collect();

          for (const line of lines) {
            const account = accounts.find((a: any) => a._id === line.accountId);
            if (!account) continue;

            if (account.type === "income") {
              if (line.side === "credit") {
                periodNetIncome += line.amount;
              } else {
                periodNetIncome -= line.amount;
              }
            } else if (account.type === "expense") {
              if (line.side === "debit") {
                periodNetIncome -= line.amount;
              } else {
                periodNetIncome += line.amount;
              }
            }
          }
        }

        periods.push({
          period: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`,
          netIncome: periodNetIncome,
          cashFromOperations: periodNetIncome, // Simplified
          cashFromInvesting: 0,
          cashFromFinancing: 0,
          netChangeInCash: periodNetIncome,
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    return {
      dateRange: { start: startDate, end: endDate },
      period,
      operatingActivities: {
        netIncome,
        adjustments: {
          changeInCurrentAssets: -changeInCurrentAssets,
          changeInCurrentLiabilities: changeInCurrentLiabilities,
        },
        cashFromOperations,
      },
      investingActivities: {
        cashFromInvesting,
      },
      financingActivities: {
        cashFromFinancing,
      },
      netChangeInCash,
      beginningCash,
      endingCash,
      periods,
    };
  },
});

