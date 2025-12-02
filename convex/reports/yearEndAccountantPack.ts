/**
 * Year-End Accountant Pack Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { api } from "../_generated/api";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Year-End Accountant Pack
 */
export const getYearEndAccountantPackData: ReturnType<typeof query> = query({
  args: {
    taxYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const taxYear = args.taxYear || new Date().getFullYear();
    const startDate = new Date(taxYear, 0, 1).getTime();
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59).getTime();

    // Get all the reports
    const trialBalance = await ctx.runQuery(api.reports.getTrialBalanceData, { asOfDate: endDate });
    const generalLedger = await ctx.runQuery(api.reports.getGeneralLedgerData, {
      startDate,
      endDate,
    });
    const pnl = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "blended",
      mode: "advanced",
    });
    const balanceSheet = await ctx.runQuery(api.reports.getBalanceSheetData, { asOfDate: endDate });

    // Get adjustments (entries with source "adjustment")
    const adjustments = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.and(
        q.gte(q.field("date"), startDate),
        q.lte(q.field("date"), endDate),
        q.eq(q.field("source"), "adjustment")
      ))
      .collect();

    const adjustmentsWithLines = await Promise.all(
      adjustments.map(async (entry) => {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .collect();
        return {
          date: entry.date,
          memo: entry.memo,
          lines: lines.map((l: any) => ({
            accountId: l.accountId,
            side: l.side,
            amount: l.amount,
          })),
        };
      })
    );

    return {
      taxYear,
      dateRange: { start: startDate, end: endDate },
      trialBalance,
      generalLedger: {
        entries: generalLedger?.entries || [],
        totalEntries: generalLedger?.entries.length || 0,
      },
      profitAndLoss: pnl,
      balanceSheet,
      adjustments: adjustmentsWithLines,
      adjustmentsCount: adjustmentsWithLines.length,
      notes: "Year-end package prepared for accountant review.",
    };
  },
});

