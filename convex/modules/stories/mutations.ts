/**
 * Story CRUD Mutations
 */

import { v } from "convex/values";
import { mutation } from "../../_generated/server";

/**
 * Create story in database (public mutation)
 */
export const createStory = mutation({
  args: {
    userId: v.id("users"),
    storyType: v.union(v.literal("company"), v.literal("banker"), v.literal("investor")),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
    periodStart: v.number(),
    periodEnd: v.number(),
    title: v.string(),
    narrative: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyMetrics: v.optional(v.any()),
    generationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const storyId = await ctx.db.insert("ai_stories", {
      userId: args.userId,
      storyType: args.storyType,
      periodType: args.periodType,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      title: args.title,
      narrative: args.narrative,
      summary: args.summary,
      keyMetrics: args.keyMetrics || {},
      generationStatus: args.generationStatus || "completed",
      generationError: args.generationError,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return storyId;
  },
});

/**
 * Update story (user notes, attachments, generation status)
 */
export const updateStory = mutation({
  args: {
    storyId: v.id("ai_stories"),
    userNotes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    narrative: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyMetrics: v.optional(v.any()),
    generationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const story = await ctx.db.get(args.storyId);

    if (!story || story.userId !== user._id) {
      throw new Error("Story not found or unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
      version: story.version + 1,
    };

    if (args.userNotes !== undefined) {
      updateData.userNotes = args.userNotes;
    }

    if (args.attachments !== undefined) {
      updateData.attachments = args.attachments;
    }

    if (args.narrative !== undefined) {
      updateData.narrative = args.narrative;
    }

    if (args.summary !== undefined) {
      updateData.summary = args.summary;
    }

    if (args.keyMetrics !== undefined) {
      updateData.keyMetrics = args.keyMetrics;
    }

    if (args.generationStatus !== undefined) {
      updateData.generationStatus = args.generationStatus;
    }

    if (args.generationError !== undefined) {
      updateData.generationError = args.generationError;
    }

    await ctx.db.patch(args.storyId, updateData);

    return { success: true };
  },
});

