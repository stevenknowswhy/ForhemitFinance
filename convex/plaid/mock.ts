/**
 * Mock Plaid integration for testing without Plaid credentials
 */

import { v } from "convex/values";
import { mutation, internalMutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";
import { limitArray, normalizeLimit, MAX_CONVEX_ARRAY_LENGTH } from "../helpers/convexLimits";

/**
 * Mock bank connection
 * Creates mock bank accounts and generates realistic transactions
 */
export const mockConnectBank = mutation({
  args: {
    bankId: v.string(),
    bankName: v.string(),
    accountTypes: v.array(v.string()),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args): Promise<any> => {
    // Phase 1: Use org context helper
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.MANAGE_INTEGRATIONS);

    // Create mock accounts
    const accountIds: Id<"accounts">[] = [];

    for (const accountType of args.accountTypes) {
      const accountId = await ctx.db.insert("accounts", {
        userId,
        orgId, // Phase 1: Add orgId
        name: `${args.bankName} ${accountType}`,
        type: accountType === "Credit Card" ? "liability" : "asset",
        isBusiness: true,
        bankId: args.bankId,
        bankName: args.bankName,
        accountType: accountType,
        accountNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        balance: accountType === "Credit Card"
          ? -(Math.floor(Math.random() * 5000) + 500) // Credit card balance (negative)
          : Math.floor(Math.random() * 50000) + 5000, // Positive balance
        availableBalance: accountType === "Credit Card"
          ? Math.floor(Math.random() * 10000) + 1000 // Available credit
          : Math.floor(Math.random() * 45000) + 4500, // Available balance
        currency: "USD",
        status: "active",
        activatedAt: Date.now(),
        connectedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      accountIds.push(accountId);
    }

    // Generate transactions directly (can't use scheduler in mutations)
    await generateMockTransactionsInternal(ctx, {
      userId,
      orgId, // Phase 1: Pass orgId
      accountIds,
      bankId: args.bankId,
    });

    return { success: true, accountIds };
  },
});

/**
 * Internal helper to generate mock transactions
 */
async function generateMockTransactionsInternal(
  ctx: any,
  args: {
    userId: Id<"users">;
    orgId: Id<"organizations">; // Phase 1: Add orgId
    accountIds: Id<"accounts">[];
    bankId: string;
  }
) {
  const categories = [
    { name: "Groceries", merchants: ["Whole Foods", "Trader Joe's", "Safeway", "Kroger"], avgAmount: 75 },
    { name: "Restaurants", merchants: ["Chipotle", "Starbucks", "McDonald's", "Subway"], avgAmount: 25 },
    { name: "Gas", merchants: ["Shell", "Chevron", "BP", "Exxon"], avgAmount: 50 },
    { name: "Entertainment", merchants: ["Netflix", "Spotify", "AMC Theaters", "iTunes"], avgAmount: 35 },
    { name: "Shopping", merchants: ["Amazon", "Target", "Walmart", "Costco"], avgAmount: 120 },
    { name: "Utilities", merchants: ["PG&E", "Comcast", "AT&T", "Water District"], avgAmount: 150 },
    { name: "Healthcare", merchants: ["CVS Pharmacy", "Walgreens", "Kaiser", "LabCorp"], avgAmount: 85 },
    { name: "Transportation", merchants: ["Uber", "Lyft", "BART", "Parking"], avgAmount: 30 },
    { name: "Income", merchants: ["Payroll Deposit", "Direct Deposit", "Transfer"], avgAmount: 3500 },
  ];

  const cities = [
    { city: "San Francisco", state: "CA" },
    { city: "New York", state: "NY" },
    { city: "Los Angeles", state: "CA" },
    { city: "Chicago", state: "IL" },
    { city: "Austin", state: "TX" },
  ];

  // Generate 90 days of transactions
  const today = Date.now();
  const daysBack = 90;
  let transactionCount = 0;

  for (const accountId of args.accountIds) {
    const account = await ctx.db.get(accountId);
    if (!account) continue;

    // Generate 3-8 transactions per day for the past 90 days
    for (let day = 0; day < daysBack; day++) {
      const numTransactions = Math.floor(Math.random() * 6) + 3;

      for (let i = 0; i < numTransactions; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const isIncome = category.name === "Income";
        const isPending = day < 2 && Math.random() < 0.3; // 30% of recent transactions pending
        const status = isPending ? "pending" : "posted";
        const now = Date.now();

        // Calculate transaction date (spread throughout the day)
        const daysAgo = day;
        const hoursAgo = Math.floor(Math.random() * 24);
        const transactionDate = today - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);

        // Calculate amount with some variance
        const variance = 0.3; // 30% variance
        const baseAmount = category.avgAmount;
        const amount = baseAmount * (1 + (Math.random() * variance * 2 - variance));
        const roundedAmount = Math.round(amount * 100) / 100;

        const merchant = category.merchants[Math.floor(Math.random() * category.merchants.length)];
        const location = cities[Math.floor(Math.random() * cities.length)];

        await ctx.db.insert("transactions_raw", {
          userId: args.userId,
          orgId: args.orgId, // Phase 1: Add orgId
          accountId,
          transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: isIncome ? roundedAmount : -roundedAmount,
          currency: "USD",
          date: new Date(transactionDate).toISOString().split('T')[0], // ISO date string
          dateTimestamp: transactionDate, // Numeric timestamp for sorting
          description: `${merchant} - ${location.city}`,
          merchant: merchant,
          merchantName: merchant,
          category: [category.name], // Array format for compatibility
          categoryName: category.name, // Single name for easy access
          status: status,
          source: "mock",
          transactionType: isIncome ? "credit" : "debit",
          isBusiness: account.isBusiness, // Phase 1: Inherit from account
          location: {
            city: location.city,
            state: location.state,
          },
          createdAt: Date.now(),
        });

        transactionCount++;
      }
    }
  }

  return { transactionsGenerated: transactionCount, accountsProcessed: args.accountIds.length };
}

/**
 * Generate mock transactions (internal mutation)
 * Can be called via scheduler in production
 */
export const generateMockTransactions = internalMutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"), // Phase 1: Add orgId
    accountIds: v.array(v.id("accounts")),
    bankId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await generateMockTransactionsInternal(ctx, args);
  },
});

/**
 * Query connected accounts (works for both real and mock)
 */
export const getMockAccounts = query({
  args: {},
  handler: async (ctx): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    // Get accounts that have bankId (mock accounts) or are linked to institutions (real Plaid)
    const allAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter for bank accounts (have bankId or institutionId)
    return allAccounts.filter(account =>
      account.bankId !== undefined || account.institutionId !== undefined
    );
  },
});

/**
 * Query transactions with filters (works for both real and mock)
 */
export const getMockTransactions = query({
  args: {
    accountId: v.optional(v.id("accounts")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply filters
    if (args.accountId) {
      transactions = transactions.filter(t => t.accountId === args.accountId);
    }

    if (args.startDate) {
      transactions = transactions.filter(t =>
        (t.dateTimestamp || new Date(t.date).getTime()) >= args.startDate!
      );
    }

    if (args.endDate) {
      transactions = transactions.filter(t =>
        (t.dateTimestamp || new Date(t.date).getTime()) <= args.endDate!
      );
    }

    if (args.category) {
      transactions = transactions.filter(t =>
        t.categoryName === args.category ||
        (t.category && t.category.includes(args.category!))
      );
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => {
      const dateA = a.dateTimestamp || new Date(a.date).getTime();
      const dateB = b.dateTimestamp || new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Apply limit using helper function to ensure we never exceed Convex's maximum
    // Default to max allowed if no limit specified (for export scenarios)
    const safeLimit = normalizeLimit(args.limit, MAX_CONVEX_ARRAY_LENGTH);
    return limitArray(transactions, safeLimit);
  },
});

