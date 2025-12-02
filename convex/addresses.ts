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
    setAsDefaultAt: v.optional(v.number()),
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

    const now = Date.now();
    const addressData: any = {
      userId: user._id,
      type: args.type,
      streetAddress: args.streetAddress,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      createdAt: now,
      updatedAt: now,
    };

    // If setting as default, unset other defaults of the same type
    if (args.setAsDefaultAt !== undefined && args.setAsDefaultAt !== null) {
      const existingAddresses = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const existingDefault = existingAddresses.find(
        (a) => a.type === args.type && a.setAsDefaultAt !== null && a.setAsDefaultAt !== undefined
      );

      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { setAsDefaultAt: undefined });
      }
      addressData.setAsDefaultAt = args.setAsDefaultAt;
    }

    const addressId = await ctx.db.insert("addresses", addressData);

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
    setAsDefaultAt: v.optional(v.union(v.number(), v.null())),
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

    const { id, setAsDefaultAt, ...updateData } = args;
    const finalUpdateData: any = {
      ...updateData,
      updatedAt: Date.now(),
    };

    // If setting as default, unset other defaults of the same type
    if (setAsDefaultAt !== undefined) {
      if (setAsDefaultAt !== null) {
        const existingAddresses = await ctx.db
          .query("addresses")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const addressType = args.type || address.type;
        const existingDefault = existingAddresses.find(
          (a) => a._id !== args.id && a.type === addressType && a.setAsDefaultAt !== null && a.setAsDefaultAt !== undefined
        );

        if (existingDefault) {
          await ctx.db.patch(existingDefault._id, { setAsDefaultAt: undefined });
        }
      }
      finalUpdateData.setAsDefaultAt = setAsDefaultAt;
    }

    await ctx.db.patch(args.id, finalUpdateData);

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

