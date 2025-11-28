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

