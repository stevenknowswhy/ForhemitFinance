import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission } from "./rbac";

/**
 * List vendors for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        search: v.optional(v.string()),
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

        let vendors = await ctx.db
            .query("vendors")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        if (args.search) {
            const searchLower = args.search.toLowerCase();
            vendors = vendors.filter((v) => v.name.toLowerCase().includes(searchLower));
        }

        return vendors.sort((a, b) => a.name.localeCompare(b.name));
    },
});

/**
 * Get a single vendor
 */
export const get = query({
    args: {
        vendorId: v.id("vendors"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const vendor = await ctx.db.get(args.vendorId);
        if (!vendor) return null;

        // Verify org access
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", vendor.orgId))
            .first();

        if (!membership) throw new Error("Not a member of this organization");

        return vendor;
    },
});

/**
 * Create a new vendor
 */
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        name: v.string(),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        defaultCategoryId: v.optional(v.id("accounts")),
        defaultPaymentAccountId: v.optional(v.id("accounts")),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        // Require permission (e.g. MANAGE_VENDORS or similar, using generic EDIT_SETTINGS for now or just membership)
        // Assuming basic members can create vendors for now, or restrict to bookkeeper+
        await requirePermission(ctx, user._id, args.orgId, "VIEW_FINANCIALS"); // Placeholder permission, maybe should be stronger

        const vendorId = await ctx.db.insert("vendors", {
            orgId: args.orgId,
            name: args.name,
            contactEmail: args.contactEmail,
            contactPhone: args.contactPhone,
            defaultCategoryId: args.defaultCategoryId,
            defaultPaymentAccountId: args.defaultPaymentAccountId,
            metadata: args.metadata,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return vendorId;
    },
});

/**
 * Update a vendor
 */
export const update = mutation({
    args: {
        vendorId: v.id("vendors"),
        name: v.optional(v.string()),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        defaultCategoryId: v.optional(v.id("accounts")),
        defaultPaymentAccountId: v.optional(v.id("accounts")),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const vendor = await ctx.db.get(args.vendorId);
        if (!vendor) throw new Error("Vendor not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, vendor.orgId, "VIEW_FINANCIALS"); // Placeholder

        await ctx.db.patch(args.vendorId, {
            name: args.name,
            contactEmail: args.contactEmail,
            contactPhone: args.contactPhone,
            defaultCategoryId: args.defaultCategoryId,
            defaultPaymentAccountId: args.defaultPaymentAccountId,
            metadata: args.metadata,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete a vendor
 */
export const deleteVendor = mutation({
    args: {
        vendorId: v.id("vendors"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const vendor = await ctx.db.get(args.vendorId);
        if (!vendor) throw new Error("Vendor not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, vendor.orgId, "VIEW_FINANCIALS"); // Placeholder

        // Check if vendor has bills or subscriptions?
        // For now, just delete. In production, might want soft delete or check dependencies.
        await ctx.db.delete(args.vendorId);
    },
});
