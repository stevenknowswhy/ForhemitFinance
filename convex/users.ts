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

