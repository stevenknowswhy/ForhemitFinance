// @ts-nocheck
/**
 * Plaid integration for bank account connections and transaction syncing
 * Uses the Plaid Node.js SDK
 */

import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

/**
 * Get Plaid client configuration
 */
function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV || "sandbox";

  if (!clientId || !secret) {
    throw new Error("Plaid credentials not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in environment variables.");
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  return new PlaidApi(configuration);
}

/**
 * Create a Plaid Link token for the frontend
 * This token is used to initialize Plaid Link
 */
export const createLinkToken = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const plaidClient = getPlaidClient();

    try {
      const request = {
        user: {
          client_user_id: user._id,
        },
        client_name: "EZ Financial",
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us],
        language: "en",
      };

      const response = await plaidClient.linkTokenCreate(request);
      return { linkToken: response.data.link_token };
    } catch (error: any) {
      console.error("Error creating Plaid link token:", error);
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  },
});

/**
 * Exchange Plaid public token for access token
 * Called after user completes Plaid Link flow
 */
export const exchangePublicToken: ReturnType<typeof action> = action({
  args: {
    publicToken: v.string(),
    institutionId: v.string(),
    institutionName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const plaidClient = getPlaidClient();

    try {
      // Exchange public token for access token
      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token: args.publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Store institution connection
      const institutionId = await ctx.runMutation(api.plaid.storeInstitution, {
        plaidItemId: itemId,
        plaidInstitutionId: args.institutionId,
        name: args.institutionName,
        accessTokenEncrypted: accessToken, // TODO: Encrypt this in production
      });

      // Trigger initial account and transaction sync
      await ctx.scheduler.runAfter(0, api.plaid.syncAccounts, {
        institutionId,
      });

      return { institutionId, success: true };
    } catch (error: any) {
      console.error("Error exchanging public token:", error);
      throw new Error(`Failed to connect bank: ${error.message}`);
    }
  },
});

/**
 * Store institution connection in database
 */
export const storeInstitution = mutation({
  args: {
    plaidItemId: v.string(),
    plaidInstitutionId: v.string(),
    name: v.string(),
    accessTokenEncrypted: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const institutionId = await ctx.db.insert("institutions", {
      userId: user._id,
      plaidItemId: args.plaidItemId,
      plaidInstitutionId: args.plaidInstitutionId,
      name: args.name,
      accessTokenEncrypted: args.accessTokenEncrypted,
      syncStatus: "active",
      createdAt: Date.now(),
    });

    return institutionId;
  },
});

/**
 * Sync accounts from Plaid
 * Creates/updates account records
 */
export const syncAccounts = action({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const institution = await ctx.runQuery(api.plaid.getInstitution, {
      institutionId: args.institutionId,
    });

    if (!institution) {
      throw new Error("Institution not found");
    }

    const plaidClient = getPlaidClient();

    try {
      // Get accounts from Plaid
      const accountsResponse = await plaidClient.accountsGet({
        access_token: institution.accessTokenEncrypted,
      });

      const plaidAccounts = accountsResponse.data.accounts;

      // Create/update accounts
      for (const account of plaidAccounts) {
        // Map Plaid account type to our account type
        let accountType: "asset" | "liability" = "asset";
        if (account.type === "credit" || account.type === "loan") {
          accountType = "liability";
        }

        await ctx.runMutation(api.plaid.upsertAccount, {
          institutionId: args.institutionId,
          plaidAccountId: account.account_id,
          name: account.name,
          type: accountType,
          balance: account.balances.current || 0,
          mask: account.mask || undefined,
          subtype: account.subtype || undefined,
        });
      }

      // Trigger transaction sync
      await ctx.scheduler.runAfter(0, api.plaid.syncTransactions, {
        institutionId: args.institutionId,
      });

      return { success: true, accountCount: plaidAccounts.length };
    } catch (error: any) {
      console.error("Error syncing accounts:", error);
      
      // Update institution status to error
      await ctx.runMutation(api.plaid.updateInstitutionStatus, {
        institutionId: args.institutionId,
        status: "error",
      });

      throw new Error(`Failed to sync accounts: ${error.message}`);
    }
  },
});

/**
 * Upsert account record
 */
export const upsertAccount = mutation({
  args: {
    institutionId: v.id("institutions"),
    plaidAccountId: v.string(),
    name: v.string(),
    type: v.union(v.literal("asset"), v.literal("liability")),
    balance: v.number(),
    mask: v.optional(v.string()),
    subtype: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const institution = await ctx.db.get(args.institutionId);
    if (!institution) {
      throw new Error("Institution not found");
    }

    // Check if account already exists
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", institution.userId))
      .filter((q) => q.eq(q.field("plaidAccountId"), args.plaidAccountId))
      .first();

    if (existing) {
      // Update existing account
      await ctx.db.patch(existing._id, {
        name: args.name,
        balance: args.balance,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new account
      const accountId = await ctx.db.insert("accounts", {
        userId: institution.userId,
        name: args.name,
        type: args.type,
        isBusiness: true,
        plaidAccountId: args.plaidAccountId,
        institutionId: args.institutionId,
        balance: args.balance,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return accountId;
    }
  },
});

/**
 * Sync transactions from Plaid
 * Fetches new transactions and creates proposed entries
 */
export const syncTransactions = action({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const institution = await ctx.runQuery(api.plaid.getInstitution, {
      institutionId: args.institutionId,
    });

    if (!institution) {
      throw new Error("Institution not found");
    }

    // Get last sync time (default to 90 days ago for first sync)
    const lastSync = institution.lastSyncAt || Date.now() - 90 * 24 * 60 * 60 * 1000;
    const startDate = new Date(lastSync);
    startDate.setDate(startDate.getDate() - 1); // Add 1 day buffer
    const endDate = new Date();

    const plaidClient = getPlaidClient();

    try {
      // Get user's accounts for this institution
      const accounts = await ctx.runQuery(api.accounts.getByInstitution, {
        institutionId: args.institutionId,
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found for institution");
      }

      // Fetch transactions from Plaid
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: institution.accessTokenEncrypted,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        account_ids: accounts.map((a) => a.plaidAccountId).filter((id): id is string => !!id),
      } as any);

      const plaidTransactions = transactionsResponse.data.transactions;
      let importedCount = 0;

      // Process each transaction
      for (const txn of plaidTransactions) {
        const account = accounts.find((a) => a.plaidAccountId === txn.account_id);
        if (!account) continue;

        // Check if transaction already exists
        const existing = await ctx.runQuery(api.transactions.getByPlaidId, {
          plaidTransactionId: txn.transaction_id,
        });

        if (existing) continue; // Skip duplicates

        // Create raw transaction
        const transactionId = await ctx.runMutation(api.transactions.createRaw, {
          accountId: account._id,
          plaidTransactionId: txn.transaction_id,
          amount: txn.amount,
          date: txn.date,
          merchant: txn.merchant_name || undefined,
          description: txn.name,
          category: txn.category || undefined,
          // plaidCategory: txn.category || undefined, // Not in schema, removed
          isPending: txn.pending,
        });

        // Process transaction to generate proposed entry
        await ctx.runMutation(api.transactions.processTransaction, {
          transactionId,
        });

        importedCount++;
      }

      // Update last sync time
      await ctx.runMutation(api.plaid.updateLastSync, {
        institutionId: args.institutionId,
      });

      return { success: true, count: importedCount, total: plaidTransactions.length };
    } catch (error: any) {
      console.error("Error syncing transactions:", error);
      
      // Update institution status to error
      await ctx.runMutation(api.plaid.updateInstitutionStatus, {
        institutionId: args.institutionId,
        status: "error",
      });

      throw new Error(`Failed to sync transactions: ${error.message}`);
    }
  },
});

/**
 * Get institution by ID
 */
export const getInstitution = query({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.institutionId);
  },
});

/**
 * Get all institutions for current user
 */
export const getUserInstitutions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db
      .query("institutions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Update last sync time
 */
export const updateLastSync = mutation({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.institutionId, {
      lastSyncAt: Date.now(),
    });
  },
});

/**
 * Update institution sync status
 */
export const updateInstitutionStatus = mutation({
  args: {
    institutionId: v.id("institutions"),
    status: v.union(v.literal("active"), v.literal("error"), v.literal("disconnected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.institutionId, {
      syncStatus: args.status,
    });
  },
});

// ============================================================================
// MOCK PLAID INTEGRATION - For testing without Plaid credentials
// ============================================================================

/**
 * Mock bank connection
 * Creates mock bank accounts and generates realistic transactions
 */
export const mockConnectBank = mutation({
  args: {
    bankId: v.string(),
    bankName: v.string(),
    accountTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Create mock accounts
    const accountIds: Id<"accounts">[] = [];
    
    for (const accountType of args.accountTypes) {
      const accountId = await ctx.db.insert("accounts", {
        userId: user._id,
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
        isActive: true,
        connectedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      accountIds.push(accountId);
    }

    // Generate transactions directly (can't use scheduler in mutations)
    await generateMockTransactionsInternal(ctx, {
      userId: user._id,
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
          isPending: isPending,
          source: "mock",
          transactionType: isIncome ? "credit" : "debit",
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
    accountIds: v.array(v.id("accounts")),
    bankId: v.string(),
  },
  handler: async (ctx, args) => {
    return await generateMockTransactionsInternal(ctx, args);
  },
});

/**
 * Query connected accounts (works for both real and mock)
 */
export const getMockAccounts = query({
  args: {},
  handler: async (ctx) => {
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
  handler: async (ctx, args) => {
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

    // Apply limit
    if (args.limit) {
      transactions = transactions.slice(0, args.limit);
    }

    return transactions;
  },
});

/**
 * Get transaction analytics
 */
export const getMockTransactionAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by date
    const transactions = allTransactions.filter(t => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= startDate;
    });

    // Calculate totals
    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });

    // Top spending categories
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Daily spending trend
    const dailySpending: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const date = new Date(t.dateTimestamp || new Date(t.date).getTime()).toLocaleDateString();
        dailySpending[date] = (dailySpending[date] || 0) + Math.abs(t.amount);
      }
    });

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netCashFlow: Math.round((totalIncome - totalSpent) * 100) / 100,
      transactionCount: transactions.length,
      topCategories,
      dailySpending,
      averageDailySpending: Math.round((totalSpent / days) * 100) / 100,
    };
  },
});
