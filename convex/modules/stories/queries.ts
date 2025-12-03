/**
 * Story Queries
 */

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { limitArray, DEFAULT_QUERY_LIMIT } from "../../helpers/convexLimits";
import { getOrgContext } from "../../helpers/orgContext";

/**
 * Get all stories for user
 * Returns empty array if stories module is not enabled
 */
export const getStories = query({
  args: {
    periodType: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually"))),
    orgId: v.optional(v.id("organizations")),
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

    // Check module enablement if orgId provided
    if (args.orgId) {
      const enablement = await ctx.db
        .query("module_enablements")
        .withIndex("by_org_module", (q: any) => 
          q.eq("orgId", args.orgId).eq("moduleId", "stories")
        )
        .first();

      if (!enablement || !enablement.enabled) {
        return []; // Module not enabled, return empty array
      }
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
 * Returns null if stories module is not enabled
 */
export const getStoryById = query({
  args: {
    storyId: v.id("ai_stories"),
    orgId: v.optional(v.id("organizations")),
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

    // Check module enablement if orgId provided
    if (args.orgId) {
      const enablement = await ctx.db
        .query("module_enablements")
        .withIndex("by_org_module", (q: any) => 
          q.eq("orgId", args.orgId).eq("moduleId", "stories")
        )
        .first();

      if (!enablement || !enablement.enabled) {
        return null; // Module not enabled, return null
      }
    }

    const story = await ctx.db.get(args.storyId);

    if (!story || story.userId !== user._id) {
      return null;
    }

    return story;
  },
});

