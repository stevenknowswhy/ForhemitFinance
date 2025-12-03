/**
 * Banker Story Generator
 */

import { v } from "convex/values";
import { action, internalAction } from "../../../_generated/server";
import { api } from "../../../_generated/api";
import { Id } from "../../../_generated/dataModel";
import { buildBankerStoryPrompt } from "../promptBuilders";
import { STORY_SYSTEM_PROMPTS } from "../prompts";
import { callOpenRouterAPI } from "../api";

/**
 * Internal action to generate banker story in the background
 */
export const _generateBankerStoryInternal = internalAction({
  args: {
    storyId: v.id("ai_stories"),
    userId: v.id("users"),
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args) => {
    try {
      // Update status to generating
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "generating",
      });

      // Aggregate financial data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      // Build prompt
      const periodLabel = `${new Date(args.periodStart).toLocaleDateString()} to ${new Date(args.periodEnd).toLocaleDateString()}`;
      const prompt = buildBankerStoryPrompt(financialData, periodLabel);
      const systemPrompt = (args.periodType === "annually"
        ? STORY_SYSTEM_PROMPTS.banker.quarterly
        : STORY_SYSTEM_PROMPTS.banker[args.periodType]) || STORY_SYSTEM_PROMPTS.banker.monthly;

      // Call OpenRouter API
      const result = await callOpenRouterAPI(prompt, systemPrompt);

      // Update story with results
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        narrative: result.narrative,
        summary: result.summary || result.insight || "",
        keyMetrics: result.keyMetrics,
        generationStatus: "completed",
      });

      // Create notification
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_complete",
        title: "Story Generated",
        message: `Your Banker Story for ${periodName} is ready to view.`,
        metadata: { storyId: args.storyId },
      });
    } catch (error: any) {
      // Update story with error
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "failed",
        generationError: error.message || "Unknown error occurred",
      });

      // Create failure notification
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_failed",
        title: "Story Generation Failed",
        message: `Failed to generate your Banker Story: ${error.message || "Unknown error"}`,
        metadata: { storyId: args.storyId },
      });
    }
  },
});

/**
 * Generate Banker Story (schedules background generation)
 */
export const generateBankerStory = action({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<{ storyId: Id<"ai_stories">; success: boolean; error?: string }> => {
    try {
      const user = await ctx.runQuery(api.users.getCurrentUser);
      if (!user) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "User not found" };
      }

      // Validate date range
      if (args.periodStart >= args.periodEnd) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "Invalid date range: start date must be before end date" };
      }

      // Check if we have data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      if (financialData.transactionCount === 0) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "No financial data found for the selected period" };
      }

      // Create title
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      const title = `Banker Story - ${periodName}`;

      // Create pending story record
      const storyId = await ctx.runMutation(api.ai_stories.createStory, {
        userId: user._id,
        storyType: "banker",
        periodType: args.periodType,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        title,
        generationStatus: "pending",
      });

      // Schedule background generation
      await ctx.scheduler.runAfter(0, api.ai_stories._generateBankerStoryInternal, {
        storyId,
        userId: user._id,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      return { storyId, success: true };
    } catch (error: any) {
      return { storyId: "" as Id<"ai_stories">, success: false, error: error.message || "Unknown error occurred" };
    }
  },
});

