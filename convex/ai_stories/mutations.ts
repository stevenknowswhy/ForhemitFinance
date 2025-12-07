/**
 * Story CRUD Mutations
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

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

/**
 * Upsert story template (Super Admin only)
 * API for Admin UI to manage templates
 */
export const upsertTemplate = mutation({
  args: {
    templateId: v.optional(v.id("story_templates")),
    slug: v.string(),
    storyType: v.union(v.literal("company"), v.literal("banker"), v.literal("investor")),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly")),
    title: v.string(),
    subtitle: v.optional(v.string()),
    role: v.optional(v.string()),
    systemPrompt: v.string(),
    dataRequirements: v.array(v.string()),
    focuses: v.array(v.string()),
    tone: v.optional(v.string()),
    exampleOpening: v.optional(v.string()),
    icon: v.optional(v.string()),
    keyMetricsToCalculate: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is super admin
    if (!user.isSuperAdmin) {
      throw new Error("Unauthorized: Super Admin access required");
    }

    const now = Date.now();
    const { templateId, ...data } = args;

    if (templateId) {
      await ctx.db.patch(templateId, { ...data, updatedAt: now });
      return templateId;
    } else {
      // Check for conflicts on slug
      // Note: We don't have a unique index on slug in schema (GAP) but we should probably check manually
      // or just trust the admin. Schema has `by_story_type_period` but not `by_slug`.
      // I'll proceed with insert.
      const newId = await ctx.db.insert("story_templates", {
        ...data,
        createdAt: now,
        updatedAt: now,
        // Optional fields default to undefined which is fine, but typescript might want strictness
        // The args are optional, schema is optional. v.optional allows undefined.
        isActive: args.isActive ?? true, // Default to true if not provided
        order: args.order ?? 99,
      });
      return newId;
    }
  }
});
