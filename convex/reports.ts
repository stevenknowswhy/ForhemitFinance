/**
 * Reports data aggregation functions
 * Aggregates data from business profile, accounts, transactions, and analytics
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Get comprehensive report data for Bank/Lender Application Snapshot
 */
export const getBankLenderReportData = query({
  args: {
    startDate: v.optional(v.number()), // Timestamp in milliseconds
    endDate: v.optional(v.number()), // Timestamp in milliseconds
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    // Get business profile
    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Get transactions for date range
    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000); // Default: last 12 months
    const endDate = args.endDate || Date.now();

    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter transactions by date range
    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate revenue and expenses
    const revenue = transactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netIncome = revenue - expenses;

    // Group by category for top categories
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
      if (t.amount > 0) {
        revenueByCategory[category] = (revenueByCategory[category] || 0) + t.amount;
      } else {
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    const topRevenueCategories = Object.entries(revenueByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Calculate monthly breakdown
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    transactions.forEach((t: any) => {
      const date = new Date(t.dateTimestamp || new Date(t.date).getTime());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      if (t.amount > 0) {
        monthlyData[monthKey].revenue += t.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(t.amount);
      }
    });

    // Calculate cash flow metrics
    const monthsInPeriod = Math.max(1, Math.ceil((endDate - startDate) / (30 * 24 * 60 * 60 * 1000)));
    const averageMonthlyRevenue = revenue / monthsInPeriod;
    const averageMonthlyExpenses = expenses / monthsInPeriod;
    const averageMonthlyBurnRate = averageMonthlyExpenses - averageMonthlyRevenue;

    // Calculate total cash on hand (sum of asset accounts)
    const assetAccounts = accounts.filter((a: any) => a.type === "asset");
    const totalCashOnHand = assetAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // Calculate total available credit and outstanding balances
    const liabilityAccounts = accounts.filter((a: any) => a.type === "liability");
    const totalAvailableCredit = liabilityAccounts.reduce((sum, a) => sum + (a.availableBalance || 0), 0);
    const totalOutstandingBalances = liabilityAccounts.reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

    // Calculate runway (if burn rate is negative)
    let estimatedRunwayMonths: number | null = null;
    if (averageMonthlyBurnRate > 0 && totalCashOnHand > 0) {
      estimatedRunwayMonths = totalCashOnHand / averageMonthlyBurnRate;
    }

    // Calculate key ratios
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    const averageMonthlyRevenueValue = averageMonthlyRevenue;
    const averageMonthlyExpensesValue = averageMonthlyExpenses;

    // Calculate growth metrics (if we have enough data)
    const monthlyKeys = Object.keys(monthlyData).sort();
    let monthOverMonthGrowth: number | null = null;
    if (monthlyKeys.length >= 2) {
      const lastMonth = monthlyData[monthlyKeys[monthlyKeys.length - 1]];
      const prevMonth = monthlyData[monthlyKeys[monthlyKeys.length - 2]];
      if (prevMonth.revenue > 0) {
        monthOverMonthGrowth = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
      }
    }

    return {
      businessProfile,
      user,
      accounts: accounts.map((a: any) => ({
        _id: a._id,
        name: a.name,
        type: a.type,
        bankName: a.bankName,
        accountType: a.accountType,
        accountNumber: a.accountNumber,
        balance: a.balance || 0,
        availableBalance: a.availableBalance || 0,
      })),
      dateRange: {
        start: startDate,
        end: endDate,
      },
      financials: {
        revenue,
        expenses,
        netIncome,
        topRevenueCategories,
        topExpenseCategories,
        monthlyData: Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data })),
      },
      cashFlow: {
        totalCashOnHand,
        totalAvailableCredit,
        totalOutstandingBalances,
        averageMonthlyBurnRate,
        estimatedRunwayMonths,
      },
      metrics: {
        netMargin,
        averageMonthlyRevenue: averageMonthlyRevenueValue,
        averageMonthlyExpenses: averageMonthlyExpensesValue,
        monthOverMonthGrowth,
      },
    };
  },
});

/**
 * Helper function to get user and authenticate
 */
async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
    .first();

  return user;
}

/**
 * Helper function to calculate account balance from entry lines
 */
async function calculateAccountBalanceFromEntries(
  ctx: any,
  userId: string,
  accountId: string,
  asOfDate?: number
): Promise<number> {
  let balance = 0;

  // Get all entries up to the date (if provided)
  const allEntries = await ctx.db
    .query("entries_final")
    .withIndex("by_user", (q: any) => q.eq("userId", userId as any))
    .collect();

  const entries = asOfDate
    ? allEntries.filter((e: any) => e.date <= asOfDate)
    : allEntries;

  // Get all entry lines for this account
  for (const entry of entries) {
    const lines = await ctx.db
      .query("entry_lines")
      .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
      .filter((q: any) => q.eq(q.field("accountId"), accountId))
      .collect();

    for (const line of lines) {
      // For assets and expenses: debit increases, credit decreases
      // For liabilities, equity, and income: credit increases, debit decreases
      const account = await ctx.db.get(accountId);
      if (!account) continue;

      if (account.type === "asset" || account.type === "expense") {
        if (line.side === "debit") {
          balance += line.amount;
        } else {
          balance -= line.amount;
        }
      } else {
        // liability, equity, income
        if (line.side === "credit") {
          balance += line.amount;
        } else {
          balance -= line.amount;
        }
      }
    }
  }

  return balance;
}

/**
 * Get Profit & Loss (P&L) Statement data
 */
export const getProfitAndLossData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    filterType: v.optional(v.union(
      v.literal("business"),
      v.literal("personal"),
      v.literal("blended")
    )),
    mode: v.optional(v.union(
      v.literal("simple"),
      v.literal("advanced")
    )),
    breakdownBy: v.optional(v.union(
      v.literal("category"),
      v.literal("product"),
      v.literal("revenue_stream")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const startDate = args.startDate || Date.now() - (365 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const filterType = args.filterType || "blended";
    const mode = args.mode || "simple";

    // Get all accounts
    const allAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter accounts based on type
    let accounts = allAccounts;
    if (filterType === "business") {
      accounts = accounts.filter((a: any) => a.isBusiness === true);
    } else if (filterType === "personal") {
      accounts = accounts.filter((a: any) => a.isBusiness === false);
    }

    // Get income accounts
    const incomeAccounts = accounts.filter((a: any) => a.type === "income");
    // Get expense accounts
    const expenseAccounts = accounts.filter((a: any) => a.type === "expense");

    // Calculate revenue from income accounts
    const revenueItems: Array<{ account: string; amount: number }> = [];
    let totalRevenue = 0;

    for (const account of incomeAccounts) {
      const balance = await calculateAccountBalanceFromEntries(ctx, user._id, account._id, endDate);
      // For income accounts, we need to filter by date range
      // Get entries in date range
      const entries = await ctx.db
        .query("entries_final")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        ))
        .collect();

      let accountRevenue = 0;
      for (const entry of entries) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), account._id))
          .collect();

        for (const line of lines) {
          if (line.side === "credit") {
            accountRevenue += line.amount;
          } else {
            accountRevenue -= line.amount;
          }
        }
      }

      if (accountRevenue > 0) {
        revenueItems.push({ account: account.name, amount: accountRevenue });
        totalRevenue += accountRevenue;
      }
    }

    // Calculate expenses from expense accounts
    const expenseItems: Array<{ account: string; amount: number }> = [];
    let totalExpenses = 0;

    for (const account of expenseAccounts) {
      const entries = await ctx.db
        .query("entries_final")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        ))
        .collect();

      let accountExpense = 0;
      for (const entry of entries) {
        const lines = await ctx.db
          .query("entry_lines")
          .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
          .filter((q: any) => q.eq(q.field("accountId"), account._id))
          .collect();

        for (const line of lines) {
          if (line.side === "debit") {
            accountExpense += line.amount;
          } else {
            accountExpense -= line.amount;
          }
        }
      }

      if (accountExpense > 0) {
        expenseItems.push({ account: account.name, amount: accountExpense });
        totalExpenses += accountExpense;
      }
    }

    // Also calculate from transactions if we don't have enough entry data
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      const inRange = transactionDate >= startDate && transactionDate <= endDate;
      if (filterType === "business") {
        return inRange && t.isBusiness === true;
      } else if (filterType === "personal") {
        return inRange && t.isBusiness === false;
      }
      return inRange;
    });

    // If we have transactions but no entry data, use transactions
    if (revenueItems.length === 0 && expenseItems.length === 0) {
      transactions.forEach((t: any) => {
        if (t.amount > 0) {
          totalRevenue += t.amount;
        } else {
          totalExpenses += Math.abs(t.amount);
        }
      });
    }

    const netIncome = totalRevenue - totalExpenses;

    // Group by category if breakdown requested
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
      if (t.amount > 0) {
        revenueByCategory[category] = (revenueByCategory[category] || 0) + t.amount;
      } else {
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    return {
      dateRange: { start: startDate, end: endDate },
      filterType,
      mode,
      revenue: {
        total: totalRevenue,
        items: revenueItems,
        byCategory: Object.entries(revenueByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      expenses: {
        total: totalExpenses,
        items: expenseItems,
        byCategory: Object.entries(expensesByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      netIncome,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    };
  },
});

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

/**
 * Get Monthly / Quarterly Financial Summary
 */
export const getFinancialSummaryData: ReturnType<typeof query> = query({
  args: {
    period: v.union(v.literal("monthly"), v.literal("quarterly")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const now = Date.now();
    const endDate = args.endDate || now;
    const startDate = args.startDate || (args.period === "quarterly"
      ? now - (90 * 24 * 60 * 60 * 1000)
      : now - (30 * 24 * 60 * 60 * 1000));

    // Get P&L data
    const pnlData = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "blended",
      mode: "simple",
    });

    // Get cash flow data
    const cashFlowData = await ctx.runQuery(api.reports.getCashFlowStatementData, {
      startDate,
      endDate,
      period: args.period,
    });

    // Get top categories
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
      if (t.amount > 0) {
        revenueByCategory[category] = (revenueByCategory[category] || 0) + t.amount;
      } else {
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    const topRevenueCategories = Object.entries(revenueByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Calculate trends (compare to previous period)
    const previousStartDate = startDate - (endDate - startDate);
    const previousPnL = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate: previousStartDate,
      endDate: startDate,
      filterType: "blended",
      mode: "simple",
    });

    const revenueTrend = previousPnL && previousPnL.revenue.total > 0
      ? ((pnlData?.revenue.total || 0) - previousPnL.revenue.total) / previousPnL.revenue.total * 100
      : null;

    const expenseTrend = previousPnL && previousPnL.expenses.total > 0
      ? ((pnlData?.expenses.total || 0) - previousPnL.expenses.total) / previousPnL.expenses.total * 100
      : null;

    return {
      period: args.period,
      dateRange: { start: startDate, end: endDate },
      revenue: pnlData?.revenue.total || 0,
      expenses: pnlData?.expenses.total || 0,
      profit: pnlData?.netIncome || 0,
      cashFlow: cashFlowData?.netChangeInCash || 0,
      topRevenueCategories,
      topExpenseCategories,
      trends: {
        revenue: revenueTrend,
        expenses: expenseTrend,
      },
    };
  },
});

/**
 * Get Business KPI Dashboard Report data
 */
export const getKPIDashboardData: ReturnType<typeof query> = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const now = Date.now();
    const endDate = args.endDate || now;
    const startDate = args.startDate || now - (365 * 24 * 60 * 60 * 1000);

    // Get P&L data
    const pnlData = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate,
      endDate,
      filterType: "business",
      mode: "advanced",
    });

    // Calculate gross margin
    const grossMargin = pnlData && pnlData.revenue.total > 0
      ? ((pnlData.revenue.total - pnlData.expenses.total) / pnlData.revenue.total) * 100
      : 0;

    // Calculate revenue growth
    const previousStartDate = startDate - (endDate - startDate);
    const previousPnL = await ctx.runQuery(api.reports.getProfitAndLossData, {
      startDate: previousStartDate,
      endDate: startDate,
      filterType: "business",
      mode: "simple",
    });

    const revenueGrowth = previousPnL && previousPnL.revenue.total > 0
      ? ((pnlData?.revenue.total || 0) - previousPnL.revenue.total) / previousPnL.revenue.total * 100
      : null;

    // Get transactions for ARPU and product stats
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate && transactionDate <= endDate && t.isBusiness === true;
    });

    // Calculate ARPU (Average Revenue Per User/Transaction)
    const revenueTransactions = transactions.filter((t: any) => t.amount > 0);
    const arpu = revenueTransactions.length > 0
      ? revenueTransactions.reduce((sum, t) => sum + t.amount, 0) / revenueTransactions.length
      : 0;

    // Owner compensation (expenses categorized as owner compensation)
    const ownerCompensation = transactions
      .filter((t: any) => {
        const category = (t.categoryName || (t.category && t.category[0]) || "").toLowerCase();
        return t.amount < 0 && (
          category.includes("compensation") ||
          category.includes("salary") ||
          category.includes("owner") ||
          category.includes("draw")
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Product/revenue stream breakdown
    const revenueByProduct: Record<string, number> = {};
    transactions.forEach((t: any) => {
      if (t.amount > 0) {
        const product = t.merchant || t.merchantName || t.description || "Other";
        revenueByProduct[product] = (revenueByProduct[product] || 0) + t.amount;
      }
    });

    const topProducts = Object.entries(revenueByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([product, amount]) => ({ product, amount }));

    return {
      dateRange: { start: startDate, end: endDate },
      revenue: pnlData?.revenue.total || 0,
      expenses: pnlData?.expenses.total || 0,
      grossMargin,
      revenueGrowth,
      arpu,
      ownerCompensation,
      topProducts,
      // Note: CAC, LTV, and Churn would require additional data tracking
      // These are placeholders for when that data becomes available
      cac: null, // Customer Acquisition Cost - requires marketing spend tracking
      ltv: null, // Lifetime Value - requires customer lifetime data
      churn: null, // Churn rate - requires subscription tracking
    };
  },
});

/**
 * Get Accounts Receivable Summary
 * Note: Full AR tracking requires invoice schema. This works with revenue transactions.
 */
export const getAccountsReceivableData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    // For now, we'll use revenue transactions as a proxy for receivables
    // In a full implementation, this would query an invoices table
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Get recent revenue transactions (last 90 days) as potential receivables
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

    const revenueTransactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return t.amount > 0 && transactionDate >= ninetyDaysAgo;
    });

    // Group by customer/merchant
    const byCustomer: Record<string, Array<{ date: number; amount: number; description: string }>> = {};
    revenueTransactions.forEach((t: any) => {
      const customer = t.merchant || t.merchantName || "Unknown Customer";
      if (!byCustomer[customer]) {
        byCustomer[customer] = [];
      }
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      byCustomer[customer].push({
        date: transactionDate,
        amount: t.amount,
        description: t.description,
      });
    });

    // Calculate aging buckets
    const agingBuckets = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    revenueTransactions.forEach((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      const daysOld = (now - transactionDate) / (24 * 60 * 60 * 1000);
      if (daysOld <= 30) {
        agingBuckets["0-30"] += t.amount;
      } else if (daysOld <= 60) {
        agingBuckets["31-60"] += t.amount;
      } else if (daysOld <= 90) {
        agingBuckets["61-90"] += t.amount;
      } else {
        agingBuckets["90+"] += t.amount;
      }
    });

    const totalOutstanding = Object.values(agingBuckets).reduce((sum, amount) => sum + amount, 0);

    return {
      totalOutstanding,
      agingBuckets,
      customers: Object.entries(byCustomer)
        .map(([customer, transactions]) => ({
          customer,
          totalOwed: transactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: transactions.length,
          oldestTransaction: Math.min(...transactions.map((t: any) => t.date)),
        }))
        .sort((a, b) => b.totalOwed - a.totalOwed),
      note: "This report uses revenue transactions as a proxy. Full AR tracking requires invoice management.",
    };
  },
});

/**
 * Get Accounts Payable Summary
 * Note: Full AP tracking requires bills schema. This works with expense transactions.
 */
export const getAccountsPayableData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    // Get expense transactions as a proxy for payables
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const expenseTransactions = allTransactions.filter((t: any) => t.amount < 0);

    // Group by vendor
    const byVendor: Record<string, Array<{ date: number; amount: number; description: string }>> = {};
    expenseTransactions.forEach((t: any) => {
      const vendor = t.merchant || t.merchantName || "Unknown Vendor";
      if (!byVendor[vendor]) {
        byVendor[vendor] = [];
      }
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      byVendor[vendor].push({
        date: transactionDate,
        amount: Math.abs(t.amount),
        description: t.description,
      });
    });

    // Calculate due dates (assuming 30-day payment terms)
    const outstandingBills = expenseTransactions
      .map((t: any) => {
        const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
        const dueDate = transactionDate + (30 * 24 * 60 * 60 * 1000);
        return {
          vendor: t.merchant || t.merchantName || "Unknown Vendor",
          amount: Math.abs(t.amount),
          date: transactionDate,
          dueDate,
          description: t.description,
          isOverdue: dueDate < now,
        };
      })
      .filter((bill: any) => bill.dueDate >= now - (90 * 24 * 60 * 60 * 1000)) // Last 90 days
      .sort((a, b) => a.dueDate - b.dueDate);

    const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + bill.amount, 0);

    return {
      totalOutstanding,
      outstandingBills,
      vendors: Object.entries(byVendor)
        .map(([vendor, transactions]) => ({
          vendor,
          totalOwed: transactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: transactions.length,
        }))
        .sort((a, b) => b.totalOwed - a.totalOwed),
      note: "This report uses expense transactions as a proxy. Full AP tracking requires bill management.",
    };
  },
});

/**
 * Get Vendor Spend Analysis
 */
export const getVendorSpendAnalysisData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return null;
    }

    const now = Date.now();
    const endDate = args.endDate || now;
    const startDate = args.startDate || now - (365 * 24 * 60 * 60 * 1000);

    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const transactions = allTransactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return t.amount < 0 && transactionDate >= startDate && transactionDate <= endDate;
    });

    // Group by vendor
    const vendorSpend: Record<string, { total: number; transactions: number; lastTransaction: number }> = {};
    transactions.forEach((t: any) => {
      const vendor = t.merchant || t.merchantName || "Unknown Vendor";
      if (!vendorSpend[vendor]) {
        vendorSpend[vendor] = { total: 0, transactions: 0, lastTransaction: 0 };
      }
      vendorSpend[vendor].total += Math.abs(t.amount);
      vendorSpend[vendor].transactions += 1;
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      if (transactionDate > vendorSpend[vendor].lastTransaction) {
        vendorSpend[vendor].lastTransaction = transactionDate;
      }
    });

    const topVendors = Object.entries(vendorSpend)
      .map(([vendor, data]) => ({
        vendor,
        totalSpent: data.total,
        transactionCount: data.transactions,
        averageTransaction: data.total / data.transactions,
        lastTransaction: data.lastTransaction,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      dateRange: { start: startDate, end: endDate },
      totalSpend: topVendors.reduce((sum, v) => sum + v.totalSpent, 0),
      topVendors,
      vendorCount: topVendors.length,
    };
  },
});

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

