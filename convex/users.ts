/**
 * User management functions
 * Integrated with Clerk authentication
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get current authenticated user from Clerk
 * Creates user record if it doesn't exist
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find existing user by Clerk user ID (stored in token)
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    // If user doesn't exist, create one
    // Note: In production, you might want to do this in a mutation instead
    if (!user && identity.email) {
      // For now, return null - user creation should happen via mutation
      // This prevents race conditions
      return null;
    }

    return user;
  },
});

/**
 * Get user by email (for frontend org context)
 * Phase 1: Multi-tenant support
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

/**
 * Create or update user from Clerk identity
 * Called after user signs in/up
 */
export const createOrUpdateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: identity.name || undefined,
        // Update other fields as needed
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: identity.email!,
      name: identity.name || undefined,
      subscriptionTier: "solo", // Default tier
      preferences: {
        defaultCurrency: "USD",
        aiInsightLevel: "medium",
        notificationsEnabled: true,
      },
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user profile (name, phone, etc.)
 */
export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
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

    const updates: any = {};
    if (args.firstName !== undefined || args.lastName !== undefined) {
      const name = [args.firstName, args.lastName].filter(Boolean).join(" ") || undefined;
      updates.name = name;
    }

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

/**
 * Update user preferences
 */
export const updatePreferences = mutation({
  args: {
    // Basic preferences
    defaultCurrency: v.optional(v.string()),
    fiscalYearStart: v.optional(v.string()),
    aiInsightLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notificationsEnabled: v.optional(v.boolean()),
    darkMode: v.optional(v.boolean()),
    // App Display Settings
    numberFormat: v.optional(v.union(v.literal("us"), v.literal("eu"))),
    timezone: v.optional(v.string()),
    weekStart: v.optional(v.union(v.literal("sunday"), v.literal("monday"))),
    defaultHomeTab: v.optional(v.union(
      v.literal("dashboard"),
      v.literal("transactions"),
      v.literal("analytics")
    )),
    // Accounting Preferences
    accountingMethod: v.optional(v.union(v.literal("cash"), v.literal("accrual"))),
    businessEntityType: v.optional(v.union(
      v.literal("sole_proprietorship"),
      v.literal("llc"),
      v.literal("s_corp"),
      v.literal("c_corp"),
      v.literal("partnership"),
      v.literal("nonprofit")
    )),
    // Notification Preferences
    transactionAlerts: v.optional(v.boolean()),
    weeklyBurnRate: v.optional(v.boolean()),
    monthlyCashFlow: v.optional(v.boolean()),
    anomalyAlerts: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    smsAlerts: v.optional(v.boolean()),
    // Privacy Settings
    optOutAI: v.optional(v.boolean()),
    allowTraining: v.optional(v.boolean()),
    hideBalances: v.optional(v.boolean()),
    optOutAnalytics: v.optional(v.boolean()),
    // AI Personalization
    aiStrictness: v.optional(v.number()),
    showExplanations: v.optional(v.boolean()),
    aiTone: v.optional(v.union(
      v.literal("friendly"),
      v.literal("professional"),
      v.literal("technical")
    )),
    confidenceThreshold: v.optional(v.number()),
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

    const preferences = { ...user.preferences };
    
    // Basic preferences
    if (args.defaultCurrency !== undefined) preferences.defaultCurrency = args.defaultCurrency;
    if (args.fiscalYearStart !== undefined) preferences.fiscalYearStart = args.fiscalYearStart;
    if (args.aiInsightLevel !== undefined) preferences.aiInsightLevel = args.aiInsightLevel;
    if (args.notificationsEnabled !== undefined) preferences.notificationsEnabled = args.notificationsEnabled;
    if (args.darkMode !== undefined) preferences.darkMode = args.darkMode;
    
    // App Display Settings
    if (args.numberFormat !== undefined) preferences.numberFormat = args.numberFormat;
    if (args.timezone !== undefined) preferences.timezone = args.timezone;
    if (args.weekStart !== undefined) preferences.weekStart = args.weekStart;
    if (args.defaultHomeTab !== undefined) preferences.defaultHomeTab = args.defaultHomeTab;
    
    // Accounting Preferences
    if (args.accountingMethod !== undefined) preferences.accountingMethod = args.accountingMethod;
    if (args.businessEntityType !== undefined) preferences.businessEntityType = args.businessEntityType;
    
    // Notification Preferences
    if (args.transactionAlerts !== undefined) preferences.transactionAlerts = args.transactionAlerts;
    if (args.weeklyBurnRate !== undefined) preferences.weeklyBurnRate = args.weeklyBurnRate;
    if (args.monthlyCashFlow !== undefined) preferences.monthlyCashFlow = args.monthlyCashFlow;
    if (args.anomalyAlerts !== undefined) preferences.anomalyAlerts = args.anomalyAlerts;
    if (args.pushNotifications !== undefined) preferences.pushNotifications = args.pushNotifications;
    if (args.emailNotifications !== undefined) preferences.emailNotifications = args.emailNotifications;
    if (args.smsAlerts !== undefined) preferences.smsAlerts = args.smsAlerts;
    
    // Privacy Settings
    if (args.optOutAI !== undefined) preferences.optOutAI = args.optOutAI;
    if (args.allowTraining !== undefined) preferences.allowTraining = args.allowTraining;
    if (args.hideBalances !== undefined) preferences.hideBalances = args.hideBalances;
    if (args.optOutAnalytics !== undefined) preferences.optOutAnalytics = args.optOutAnalytics;
    
    // AI Personalization
    if (args.aiStrictness !== undefined) preferences.aiStrictness = args.aiStrictness;
    if (args.showExplanations !== undefined) preferences.showExplanations = args.showExplanations;
    if (args.aiTone !== undefined) preferences.aiTone = args.aiTone;
    if (args.confidenceThreshold !== undefined) preferences.confidenceThreshold = args.confidenceThreshold;

    await ctx.db.patch(user._id, { preferences });
    return { success: true };
  },
});

/**
 * Add a custom category to user's category list
 */
export const addCustomCategory = mutation({
  args: {
    category: v.string(),
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

    const preferences = { ...user.preferences };
    const customCategories = preferences.customCategories || [];
    
    // Add category if it doesn't already exist (case-insensitive)
    const categoryLower = args.category.toLowerCase();
    if (!customCategories.some(cat => cat.toLowerCase() === categoryLower)) {
      customCategories.push(args.category);
      preferences.customCategories = customCategories;
      await ctx.db.patch(user._id, { preferences });
    }

    return { success: true, categories: customCategories };
  },
});

/**
 * Complete app refresh - deletes all user data and resets to defaults
 * This includes: transactions, accounts, entries, receipts, addresses, 
 * business profiles, professional contacts, goals, budgets, AI insights, institutions
 * WARNING: This action cannot be undone!
 */
export const refreshApp = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    const stats = {
      transactions: 0,
      accounts: 0,
      proposedEntries: 0,
      finalEntries: 0,
      entryLines: 0,
      receipts: 0,
      addresses: 0,
      businessProfiles: 0,
      professionalContacts: 0,
      goals: 0,
      budgets: 0,
      aiInsights: 0,
      institutions: 0,
    };

    // Delete all proposed entries first (they reference transactions)
    const allProposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const entry of allProposedEntries) {
      await ctx.db.delete(entry._id);
      stats.proposedEntries++;
    }

    // Delete all transactions and associated data
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const transaction of transactions) {
      // Delete associated receipts
      if (transaction.receiptIds && transaction.receiptIds.length > 0) {
        for (const receiptId of transaction.receiptIds) {
          await ctx.db.delete(receiptId);
          stats.receipts++;
        }
      }

      await ctx.db.delete(transaction._id);
      stats.transactions++;
    }

    // Delete all final entries and their entry lines
    const finalEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const entry of finalEntries) {
      // Delete entry lines
      const entryLines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q) => q.eq("entryId", entry._id))
        .collect();
      
      for (const line of entryLines) {
        await ctx.db.delete(line._id);
        stats.entryLines++;
      }

      await ctx.db.delete(entry._id);
      stats.finalEntries++;
    }

    // Delete all remaining receipts (in case any weren't linked to transactions)
    const allReceipts = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const receipt of allReceipts) {
      await ctx.db.delete(receipt._id);
      stats.receipts++;
    }

    // Delete all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const account of accounts) {
      await ctx.db.delete(account._id);
      stats.accounts++;
    }

    // Delete all addresses
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const address of addresses) {
      await ctx.db.delete(address._id);
      stats.addresses++;
    }

    // Delete business profiles
    const businessProfiles = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const profile of businessProfiles) {
      await ctx.db.delete(profile._id);
      stats.businessProfiles++;
    }

    // Delete professional contacts
    const professionalContacts = await ctx.db
      .query("professional_contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const contact of professionalContacts) {
      await ctx.db.delete(contact._id);
      stats.professionalContacts++;
    }

    // Delete goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const goal of goals) {
      await ctx.db.delete(goal._id);
      stats.goals++;
    }

    // Delete budgets
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const budget of budgets) {
      await ctx.db.delete(budget._id);
      stats.budgets++;
    }

    // Delete AI insights
    const aiInsights = await ctx.db
      .query("ai_insights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const insight of aiInsights) {
      await ctx.db.delete(insight._id);
      stats.aiInsights++;
    }

    // Delete institutions (Plaid connections)
    const institutions = await ctx.db
      .query("institutions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const institution of institutions) {
      await ctx.db.delete(institution._id);
      stats.institutions++;
    }

    // Reset user preferences to defaults (but keep user record)
    await ctx.db.patch(userId, {
      preferences: {
        defaultCurrency: "USD",
        aiInsightLevel: "medium",
        notificationsEnabled: true,
      },
      businessType: undefined,
    });

    return { success: true, stats };
  },
});

