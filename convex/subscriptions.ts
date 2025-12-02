/**
 * Subscription management functions
 * Handles subscription tiers, trials, and billing status for Organizations
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission } from "./rbac";
import { logSubscriptionChanged } from "./audit";

export type SubscriptionTier = "solo" | "light" | "pro";
export type BillingPeriod = "monthly" | "annual";

/**
 * Get organization's subscription status
 */
export const getOrgSubscription = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check membership (VIEW_FINANCIALS or just member?)
    // Any member should probably see the plan status
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
      .first();

    if (!membership) throw new Error("Not a member of this organization");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) return null;

    const plan = await ctx.db.get(subscription.planId);

    return {
      subscription,
      plan,
    };
  },
});

/**
 * Update organization subscription (e.g. from Stripe webhook or admin)
 */
export const updateOrgSubscription = mutation({
  args: {
    orgId: v.id("organizations"),
    planId: v.id("plans"),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("suspended")
    ),
    trialEndsAt: v.optional(v.number()),
    renewsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    // If called from webhook, identity might be null, but we need to secure this.
    // For now, let's assume this is called by an authenticated admin or internal process.
    // In a real app, webhooks would use a separate internal mutation with signature verification.

    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Require MANAGE_SUBSCRIPTION permission
    const actorRole = await requirePermission(ctx, user._id, args.orgId, "MANAGE_SUBSCRIPTION");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        planId: args.planId,
        status: args.status,
        trialEndsAt: args.trialEndsAt,
        renewsAt: args.renewsAt,
        updatedAt: Date.now(),
      });

      await logSubscriptionChanged(ctx, {
        orgId: args.orgId,
        actorUserId: user._id,
        actorRole,
        subscriptionId: subscription._id,
        changes: args,
      });
    } else {
      // Create new subscription
      const subId = await ctx.db.insert("subscriptions", {
        orgId: args.orgId,
        planId: args.planId,
        status: args.status,
        trialEndsAt: args.trialEndsAt,
        renewsAt: args.renewsAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await logSubscriptionChanged(ctx, {
        orgId: args.orgId,
        actorUserId: user._id,
        actorRole,
        subscriptionId: subId,
        changes: { action: "created", ...args },
      });
    }
  },
});

