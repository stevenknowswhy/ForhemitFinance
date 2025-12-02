/**
 * Tax Preparation Report
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { api } from "../_generated/api";
import { getAuthenticatedUser } from "./utils";

/**
 * Get Tax Preparation Packet data
 */
export const getTaxPreparationData: ReturnType<typeof query> = query({
  args: {
    taxYear: v.optional(v.number()), // e.g., 2024
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const taxYear = args.taxYear || new Date().getFullYear();
    const startDate = new Date(taxYear, 0, 1).getTime();
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59).getTime();

    // Get P&L for the year
    const pnlData = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "business",
      mode: "advanced",
    });

    // Get all transactions
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Categorize expenses for tax deductions
    const deductibleCategories: Record<string, number> = {};
    const taxCategories = [
      "office supplies", "software", "equipment", "travel", "meals", "entertainment",
      "utilities", "rent", "insurance", "professional services", "marketing",
      "home office", "vehicle", "mileage", "depreciation", "interest",
    ];

    transactions.forEach((t: any) => {
      if (t.amount < 0) {
        const category = (t.categoryName || (t.category && t.category[0]) || "").toLowerCase();
        const matchingCategory = taxCategories.find((tc: any) => category.includes(tc));
        if (matchingCategory) {
          deductibleCategories[matchingCategory] = (deductibleCategories[matchingCategory] || 0) + Math.abs(t.amount);
        }
      }
    });

    // Home office expenses
    const homeOfficeExpenses = transactions
      .filter((t: any) => {
        const category = (t.categoryName || (t.category && t.category[0]) || "").toLowerCase();
        return t.amount < 0 && category.includes("home office");
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Mileage (would need to be tracked separately, using vehicle expenses as proxy)
    const vehicleExpenses = transactions
      .filter((t: any) => {
        const category = (t.categoryName || (t.category && t.category[0]) || "").toLowerCase();
        return t.amount < 0 && (category.includes("vehicle") || category.includes("mileage") || category.includes("gas"));
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      taxYear,
      dateRange: { start: startDate, end: endDate },
      profit: pnlData?.netIncome || 0,
      totalExpenses: pnlData?.expenses.total || 0,
      deductibleCategories: Object.entries(deductibleCategories)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      homeOfficeExpenses,
      vehicleExpenses,
      mileage: null, // Would need separate mileage tracking
      note: "Mileage tracking requires separate entry. Vehicle expenses shown as proxy.",
    };
  },
});

