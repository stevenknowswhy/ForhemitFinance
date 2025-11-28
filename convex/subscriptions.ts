/**
 * Subscription management functions
 * Handles subscription tiers, trials, and billing status
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export type SubscriptionTier = "solo" | "light" | "pro";
export type BillingPeriod = "monthly" | "annual";

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = query({
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

    return {
      tier: user.subscriptionTier,
      // TODO: Add trial end date, subscription status, etc. when Clerk billing is integrated
    };
  },
});

/**
 * Update user subscription tier
 * Called after successful checkout via Stripe webhook
 * Can be called from webhook (no auth required) or from authenticated user
 */
export const updateSubscription = mutation({
  args: {
    userId: v.optional(v.id("users")), // Optional - for webhook calls
    email: v.optional(v.string()), // Optional - for webhook calls
    tier: v.union(v.literal("solo"), v.literal("light"), v.literal("pro")),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    trialEndsAt: v.optional(v.number()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("trial"),
        v.literal("active"),
        v.literal("cancelled"),
        v.literal("past_due")
      )
    ),
  },
  handler: async (ctx, args) => {
    let user;

    // If userId provided (from webhook), use it directly
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    }
    // If email provided (from webhook), look up by email
    else if (args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
    }
    // Otherwise, require authentication
    else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }

      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      subscriptionTier: args.tier,
    });

    return { success: true, userId: user._id };
  },
});

/**
 * Check if user is in trial period
 */
export const isInTrial = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { inTrial: false, daysRemaining: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { inTrial: false, daysRemaining: 0 };
    }

    // TODO: Check trial end date from Clerk billing
    // For now, check if user was created within last 14 days
    const daysSinceSignup = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
    const inTrial = daysSinceSignup <= 14;
    const daysRemaining = inTrial ? Math.ceil(14 - daysSinceSignup) : 0;

    return { inTrial, daysRemaining };
  },
});

