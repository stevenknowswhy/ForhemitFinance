/**
 * Account management functions
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get accounts by institution
 */
export const getByInstitution = query({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const institution = await ctx.db.get(args.institutionId);
    if (!institution) {
      throw new Error("Institution not found");
    }

    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", institution.userId))
      .filter((q) => q.eq(q.field("institutionId"), args.institutionId))
      .collect();
  },
});

/**
 * Get all accounts for current user
 */
export const getAll = query({
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

    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

