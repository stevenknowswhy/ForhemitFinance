import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission } from "./rbac";

/**
 * List subscriptions for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        activeOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        // Check membership
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
            .first();

        if (!membership) throw new Error("Not a member of this organization");

        let subs = await ctx.db
            .query("subscriptions_billpay")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        if (args.activeOnly) {
            subs = subs.filter(s => s.isActive);
        }

        return subs.sort((a, b) => a.nextRunDate - b.nextRunDate);
    },
});

/**
 * Create a new subscription
 */
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        vendorId: v.id("vendors"),
        name: v.string(),
        amount: v.number(),
        interval: v.union(
            v.literal("monthly"),
            v.literal("yearly"),
            v.literal("custom")
        ),
        nextRunDate: v.number(),
        defaultCategoryId: v.optional(v.id("accounts")),
        defaultPaymentAccountId: v.optional(v.id("accounts")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, args.orgId, "VIEW_FINANCIALS"); // Placeholder

        const subId = await ctx.db.insert("subscriptions_billpay", {
            orgId: args.orgId,
            vendorId: args.vendorId,
            name: args.name,
            amount: args.amount,
            currency: "USD",
            interval: args.interval,
            nextRunDate: args.nextRunDate,
            isActive: true,
            defaultCategoryId: args.defaultCategoryId,
            defaultPaymentAccountId: args.defaultPaymentAccountId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return subId;
    },
});

/**
 * Toggle subscription status
 */
export const toggleStatus = mutation({
    args: {
        subscriptionId: v.id("subscriptions_billpay"),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, sub.orgId, "VIEW_FINANCIALS"); // Placeholder

        await ctx.db.patch(args.subscriptionId, {
            isActive: args.isActive,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete a subscription
 */
export const deleteSubscription = mutation({
    args: {
        subscriptionId: v.id("subscriptions_billpay"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, sub.orgId, "VIEW_FINANCIALS"); // Placeholder

        await ctx.db.delete(args.subscriptionId);
    },
});
