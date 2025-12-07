/**
 * Story Queries
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { limitArray, DEFAULT_QUERY_LIMIT } from "../helpers/convexLimits";

/**
 * Get all stories for user
 */
export const getStories = query({
  args: {
    periodType: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let stories = await ctx.db
      .query("ai_stories")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter by period type if provided
    if (args.periodType) {
      stories = stories.filter((s) => s.periodType === args.periodType);
    }

    // Sort by periodEnd descending (most recent first)
    stories.sort((a, b) => b.periodEnd - a.periodEnd);

    // Apply safe limit (stories are typically limited in number)
    const safeStories = limitArray(stories, DEFAULT_QUERY_LIMIT);

    return safeStories.map((story) => ({
      _id: story._id,
      storyType: story.storyType,
      periodType: story.periodType,
      periodStart: story.periodStart,
      periodEnd: story.periodEnd,
      title: story.title,
      summary: story.summary,
      narrative: story.narrative,
      keyMetrics: story.keyMetrics,
      userNotes: story.userNotes,
      attachments: story.attachments,
      generationStatus: story.generationStatus,
      generationError: story.generationError,
      version: story.version,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    }));
  },
});

/**
 * Get story by ID
 */
export const getStoryById = query({
  args: {
    storyId: v.id("ai_stories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const story = await ctx.db.get(args.storyId);

    if (!story || story.userId !== user._id) {
      return null;
    }

    return story;
  },
});

/**
 * Get story template by story type and period type
 * GAP-001: Replaces hardcoded STORY_CONFIGS from storyConfig.ts
 */
export const getTemplateByType = query({
  args: {
    storyType: v.union(
      v.literal("company"),
      v.literal("banker"),
      v.literal("investor")
    ),
    periodType: v.union(
      v.literal("monthly"),
      v.literal("quarterly")
    ),
  },
  handler: async (ctx, args) => {
    // Fetch template matching story type and period type
    const template = await ctx.db
      .query("story_templates")
      .withIndex("by_story_type_period", (q: any) =>
        q.eq("storyType", args.storyType).eq("periodType", args.periodType)
      )
      .filter((q: any) => q.neq(q.field("isActive"), false))
      .first();

    if (!template) {
      return null;
    }

    return {
      _id: template._id,
      storyType: template.storyType,
      periodType: template.periodType,
      title: template.title,
      subtitle: template.subtitle,
      role: template.role,
      systemPrompt: template.systemPrompt,
      dataRequirements: template.dataRequirements,
      focuses: template.focuses,
      tone: template.tone,
      exampleOpening: template.exampleOpening,
      icon: template.icon,
      keyMetricsToCalculate: template.keyMetricsToCalculate,
    };
  },
});

/**
 * Get all active story templates
 */
export const getAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("story_templates")
      .filter((q: any) => q.neq(q.field("isActive"), false))
      .collect();

    return templates.map((template) => ({
      _id: template._id,
      storyType: template.storyType,
      periodType: template.periodType,
      title: template.title,
      subtitle: template.subtitle,
      icon: template.icon,
      order: template.order,
      role: template.role,
      focuses: template.focuses,
    }));
  },
});

/**
 * Get all story templates for Admin (includes inactive, limited fields)
 */
export const getAdminTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user?.isSuperAdmin) throw new Error("Unauthorized");

    const templates = await ctx.db.query("story_templates").collect();

    // Sort by order/type
    templates.sort((a, b) => (a.order || 99) - (b.order || 99));

    return templates.map((template) => ({
      _id: template._id,
      slug: template.slug,
      storyType: template.storyType,
      periodType: template.periodType,
      title: template.title,
      isActive: template.isActive !== false,
      updatedAt: template.updatedAt,
    }));
  },
});

/**
 * Get single story template by ID for Admin editing
 */
export const getTemplate = query({
  args: {
    templateId: v.id("story_templates"),
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user?.isSuperAdmin) throw new Error("Unauthorized");

    return await ctx.db.get(args.templateId);
  },
});

