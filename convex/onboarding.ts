/**
 * User onboarding functions
 * Creates default accounts and initial setup for new users
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { createOrganization } from "./organizations";
import { logOrgCreated } from "./audit";

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
      // User already exists, check if they have an active organization membership
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      // If they have a membership, check if the org actually exists
      let hasValidOrg = false;
      let existingOrgId = null;

      if (membership) {
        const org = await ctx.db.get(membership.orgId);
        if (org) {
          hasValidOrg = true;
          existingOrgId = membership.orgId;
        }
      }

      if (hasValidOrg) {
        // User already has a valid org, check if they have accounts
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_org", (q) => q.eq("orgId", existingOrgId!))
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
              orgId: existingOrgId!,
              name: account.name,
              type: account.type,
              isBusiness: account.isBusiness,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }

        return { userId: existingUser._id, orgId: existingOrgId!, isNew: false };
      }

      // If we get here, user exists but has no valid org. 
      // Fall through to create organization logic.
      // We need to use the existing user ID.
    }

    // Create new user if doesn't exist
    let userId;
    if (existingUser) {
      userId = existingUser._id;
      // Update business type if provided
      if (args.businessType) {
        await ctx.db.patch(userId, { businessType: args.businessType });
      }
    } else {
      userId = await ctx.db.insert("users", {
        email: identity.email!,
        name: identity.name || undefined,
        businessType: args.businessType,
        subscriptionTier: "solo", // Default tier
        status: "active", // Phase 1: Set status
        preferences: {
          defaultCurrency: "USD",
          aiInsightLevel: "medium",
          notificationsEnabled: true,
        },
        createdAt: Date.now(),
      });
    }

    // Phase 1: Create organization for new user
    const orgName = identity.name
      ? `${identity.name}'s Organization`
      : `${identity.email}'s Organization`;

    const orgId = await ctx.db.insert("organizations", {
      name: orgName,
      type: "business", // Default to business
      status: "active",
      baseCurrency: "USD",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Create membership (ORG_OWNER)
    await ctx.db.insert("memberships", {
      userId,
      orgId,
      role: "ORG_OWNER",
      status: "active",
      joinedAt: Date.now(),
      createdAt: Date.now(),
    });

    // Get starter plan and create subscription
    const starterPlan = await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("name"), "starter"))
      .first();

    if (starterPlan) {
      await ctx.db.insert("subscriptions", {
        orgId,
        planId: starterPlan._id,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Log org creation
    await logOrgCreated(ctx, {
      orgId,
      actorUserId: userId,
      orgName,
    });

    // Create default accounts (org-scoped)
    for (const account of [
      ...DEFAULT_ACCOUNTS.assets,
      ...DEFAULT_ACCOUNTS.liabilities,
      ...DEFAULT_ACCOUNTS.equity,
      ...DEFAULT_ACCOUNTS.income,
      ...DEFAULT_ACCOUNTS.expenses,
    ]) {
      await ctx.db.insert("accounts", {
        userId: userId, // Keep for backward compatibility
        orgId: orgId, // Phase 1: Add orgId
        name: account.name,
        type: account.type,
        isBusiness: account.isBusiness,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { userId, orgId, isNew: true };
  },
});

/**
 * Get onboarding status
 * Phase 1: Updated to check for organization membership
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

    // Phase 1: Check if user has an organization (membership)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // If no org membership, onboarding is not complete
    if (!membership) {
      return {
        isAuthenticated: true,
        hasCompletedOnboarding: false,
        hasAccounts: false,
        hasBankConnection: false,
        user,
      };
    }

    // Verify the organization actually exists
    const org = await ctx.db.get(membership.orgId);
    if (!org) {
      // Membership exists but org doesn't (e.g. deleted)
      // Treat as not onboarded
      return {
        isAuthenticated: true,
        hasCompletedOnboarding: false,
        hasAccounts: false,
        hasBankConnection: false,
        user,
      };
    }

    // Check if user has accounts (org-scoped)
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();

    // Check if user has connected a bank (org-scoped)
    const institutions = await ctx.db
      .query("institutions")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();

    return {
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      hasAccounts: accounts.length > 0,
      hasBankConnection: institutions.length > 0,
      user,
      orgId: membership.orgId, // Phase 1: Include orgId
    };
  },
});

