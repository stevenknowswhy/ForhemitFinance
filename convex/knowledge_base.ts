/**
 * Knowledge Base for AI Learning
 * Stores user corrections, overrides, and patterns to improve future categorization
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Save a user correction to the knowledge base
 */
export const saveCorrection = mutation({
  args: {
    merchant: v.optional(v.string()),
    description: v.optional(v.string()),
    originalCategory: v.optional(v.string()),
    correctedCategory: v.string(),
    originalDebitAccountId: v.optional(v.id("accounts")),
    correctedDebitAccountId: v.optional(v.id("accounts")),
    originalCreditAccountId: v.optional(v.id("accounts")),
    correctedCreditAccountId: v.optional(v.id("accounts")),
    userDescription: v.optional(v.string()),
    transactionType: v.union(v.literal("expense"), v.literal("income")),
    isBusiness: v.boolean(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if a similar pattern already exists
    const existing = await ctx.db
      .query("categorization_knowledge")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => {
        if (args.merchant) {
          return q.eq(q.field("merchant"), args.merchant);
        }
        if (args.description) {
          return q.eq(q.field("description"), args.description);
        }
        return q.eq(q.field("correctedCategory"), args.correctedCategory);
      })
      .first();

    if (existing) {
      // Update existing pattern - increment usage count
      await ctx.db.patch(existing._id, {
        usageCount: existing.usageCount + 1,
        lastUsedAt: Date.now(),
        // Update corrections if they've changed
        correctedCategory: args.correctedCategory,
        correctedDebitAccountId: args.correctedDebitAccountId,
        correctedCreditAccountId: args.correctedCreditAccountId,
        userDescription: args.userDescription || existing.userDescription,
      });
      return { id: existing._id, updated: true };
    } else {
      // Create new pattern
      const id = await ctx.db.insert("categorization_knowledge", {
        userId: user._id,
        merchant: args.merchant,
        description: args.description,
        originalCategory: args.originalCategory,
        correctedCategory: args.correctedCategory,
        originalDebitAccountId: args.originalDebitAccountId,
        correctedDebitAccountId: args.correctedDebitAccountId,
        originalCreditAccountId: args.originalCreditAccountId,
        correctedCreditAccountId: args.correctedCreditAccountId,
        userDescription: args.userDescription,
        transactionType: args.transactionType,
        isBusiness: args.isBusiness,
        confidence: args.confidence,
        usageCount: 1,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
      return { id, updated: false };
    }
  },
});

/**
 * Get knowledge base patterns for a merchant/description
 */
export const getKnowledgePatterns = query({
  args: {
    merchant: v.optional(v.string()),
    description: v.optional(v.string()),
    transactionType: v.union(v.literal("expense"), v.literal("income")),
    isBusiness: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    // Find matching patterns
    const patterns = await ctx.db
      .query("categorization_knowledge")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => {
        return q.and(
          q.eq(q.field("transactionType"), args.transactionType),
          q.eq(q.field("isBusiness"), args.isBusiness),
          q.or(
            args.merchant ? q.eq(q.field("merchant"), args.merchant) : q.eq(q.field("merchant"), undefined),
            args.description ? q.eq(q.field("description"), args.description) : q.eq(q.field("description"), undefined)
          )
        );
      })
      .order("desc")
      .take(10);

    return patterns;
  },
});

/**
 * Get all knowledge base patterns for a user (for management)
 */
export const getAllPatterns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const patterns = await ctx.db
      .query("categorization_knowledge")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    return patterns;
  },
});

/**
 * Delete a knowledge base pattern
 */
export const deletePattern = mutation({
  args: {
    patternId: v.id("categorization_knowledge"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const pattern = await ctx.db.get(args.patternId);
    if (!pattern || pattern.userId !== user._id) {
      throw new Error("Pattern not found or unauthorized");
    }

    await ctx.db.delete(args.patternId);
    return { success: true };
  },
});
