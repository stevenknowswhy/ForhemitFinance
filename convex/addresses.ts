/**
 * Address management functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all addresses for current user
 */
export const getAddresses = query({
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

    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return addresses;
  },
});

/**
 * Add a new address
 */
export const addAddress = mutation({
  args: {
    type: v.union(v.literal("residential"), v.literal("business")),
    streetAddress: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    isDefault: v.optional(v.boolean()),
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

    const addressId = await ctx.db.insert("addresses", {
      userId: user._id,
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, id: addressId };
  },
});

/**
 * Update an existing address
 */
export const updateAddress = mutation({
  args: {
    id: v.id("addresses"),
    type: v.optional(v.union(v.literal("residential"), v.literal("business"))),
    streetAddress: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
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

    const address = await ctx.db.get(args.id);
    if (!address || address.userId !== user._id) {
      throw new Error("Address not found or access denied");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an address
 */
export const deleteAddress = mutation({
  args: {
    id: v.id("addresses"),
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

    const address = await ctx.db.get(args.id);
    if (!address || address.userId !== user._id) {
      throw new Error("Address not found or access denied");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

