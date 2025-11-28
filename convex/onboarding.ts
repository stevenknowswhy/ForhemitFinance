/**
 * User onboarding functions
 * Creates default accounts and initial setup for new users
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Default chart of accounts for new users
 * Based on business type
 */
const DEFAULT_ACCOUNTS = {
  // Asset accounts
  assets: [
    { name: "Checking Account", type: "asset" as const, isBusiness: true },
    { name: "Savings Account", type: "asset" as const, isBusiness: true },
    { name: "Cash", type: "asset" as const, isBusiness: true },
  ],
  // Liability accounts
  liabilities: [
    { name: "Credit Card", type: "liability" as const, isBusiness: true },
    { name: "Loans Payable", type: "liability" as const, isBusiness: true },
  ],
  // Equity accounts
  equity: [
    { name: "Owner's Equity", type: "equity" as const, isBusiness: true },
    { name: "Retained Earnings", type: "equity" as const, isBusiness: true },
  ],
  // Income accounts
  income: [
    { name: "Revenue", type: "income" as const, isBusiness: true },
    { name: "Service Revenue", type: "income" as const, isBusiness: true },
    { name: "Product Sales", type: "income" as const, isBusiness: true },
  ],
  // Expense accounts
  expenses: [
    { name: "Office Supplies", type: "expense" as const, isBusiness: true },
    { name: "Software & Subscriptions", type: "expense" as const, isBusiness: true },
    { name: "Marketing & Advertising", type: "expense" as const, isBusiness: true },
    { name: "Meals & Entertainment", type: "expense" as const, isBusiness: true },
    { name: "Travel", type: "expense" as const, isBusiness: true },
    { name: "Professional Services", type: "expense" as const, isBusiness: true },
    { name: "Rent", type: "expense" as const, isBusiness: true },
    { name: "Utilities", type: "expense" as const, isBusiness: true },
    { name: "Insurance", type: "expense" as const, isBusiness: true },
    { name: "Uncategorized Expenses", type: "expense" as const, isBusiness: true },
  ],
};

/**
 * Create default accounts for a new user
 */
export const createDefaultAccounts = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const accountIds: Record<string, string> = {};

    // Create all default accounts
    for (const account of [
      ...DEFAULT_ACCOUNTS.assets,
      ...DEFAULT_ACCOUNTS.liabilities,
      ...DEFAULT_ACCOUNTS.equity,
      ...DEFAULT_ACCOUNTS.income,
      ...DEFAULT_ACCOUNTS.expenses,
    ]) {
      const accountId = await ctx.db.insert("accounts", {
        userId: args.userId,
        name: account.name,
        type: account.type,
        isBusiness: account.isBusiness,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Store account ID by name for easy lookup
      accountIds[account.name] = accountId;
    }

    return { accountIds, success: true };
  },
});

/**
 * Complete onboarding for a new user
 * Creates user record and default accounts
 */
export const completeOnboarding = mutation({
  args: {
    businessType: v.optional(
      v.union(
        v.literal("creator"),
        v.literal("tradesperson"),
        v.literal("wellness"),
        v.literal("tutor"),
        v.literal("real_estate"),
        v.literal("agency"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (existingUser) {
      // User already exists, check if they have accounts
      const accounts = await ctx.db
        .query("accounts")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .collect();
      
      // If no accounts, create them
      if (accounts.length === 0) {
        for (const account of [
          ...DEFAULT_ACCOUNTS.assets,
          ...DEFAULT_ACCOUNTS.liabilities,
          ...DEFAULT_ACCOUNTS.equity,
          ...DEFAULT_ACCOUNTS.income,
          ...DEFAULT_ACCOUNTS.expenses,
        ]) {
          await ctx.db.insert("accounts", {
            userId: existingUser._id,
            name: account.name,
            type: account.type,
            isBusiness: account.isBusiness,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
      
      return { userId: existingUser._id, isNew: false };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: identity.email!,
      name: identity.name || undefined,
      businessType: args.businessType,
      subscriptionTier: "solo", // Default tier
      preferences: {
        defaultCurrency: "USD",
        aiInsightLevel: "medium",
        notificationsEnabled: true,
      },
      createdAt: Date.now(),
    });

    // Create default accounts directly (can't use ctx.runMutation in mutations)
    // Inline the account creation logic here
    for (const account of [
      ...DEFAULT_ACCOUNTS.assets,
      ...DEFAULT_ACCOUNTS.liabilities,
      ...DEFAULT_ACCOUNTS.equity,
      ...DEFAULT_ACCOUNTS.income,
      ...DEFAULT_ACCOUNTS.expenses,
    ]) {
      await ctx.db.insert("accounts", {
        userId: userId,
        name: account.name,
        type: account.type,
        isBusiness: account.isBusiness,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { userId, isNew: true };
  },
});

/**
 * Get onboarding status
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isAuthenticated: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { isAuthenticated: true, hasCompletedOnboarding: false };
    }

    // Check if user has accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Check if user has connected a bank
    const institutions = await ctx.db
      .query("institutions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      hasAccounts: accounts.length > 0,
      hasBankConnection: institutions.length > 0,
      user,
    };
  },
});

