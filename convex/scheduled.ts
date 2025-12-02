/**
 * Scheduled Actions for AI Stories Auto-Generation
 * Automatically generates stories at the end of each period
 */

import { internalAction } from "./_generated/server";
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

/**
 * Calculate period start and end dates
 */
function calculatePeriodDates(
  periodType: "monthly" | "quarterly" | "annually"
): { periodStart: number; periodEnd: number } {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (periodType === "monthly") {
    // Previous month
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    periodEnd.setHours(23, 59, 59, 999);
  } else if (periodType === "quarterly") {
    // Previous quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const previousQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const previousQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    periodStart = new Date(previousQuarterYear, previousQuarter * 3, 1);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(previousQuarterYear, (previousQuarter + 1) * 3, 0);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    // Previous year
    periodStart = new Date(now.getFullYear() - 1, 0, 1);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(now.getFullYear() - 1, 11, 31);
    periodEnd.setHours(23, 59, 59, 999);
  }

  return {
    periodStart: periodStart.getTime(),
    periodEnd: periodEnd.getTime(),
  };
}

/**
 * Generate stories for all users
 */
async function generateStoriesForAllUsers(
  ctx: any,
  periodType: "monthly" | "quarterly" | "annually"
) {
  // Get all users
  const users = await ctx.db.query("users").collect();

  const { periodStart, periodEnd } = calculatePeriodDates(periodType);

  for (const user of users) {
    try {
      // Check if story already exists for this period
      const existingStories = await ctx.db
        .query("ai_stories")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .collect();

      const hasStory = existingStories.some(
        (s: any) =>
          s.periodType === periodType &&
          s.periodStart === periodStart &&
          s.periodEnd === periodEnd
      );

      if (hasStory) {
        // Story already exists, skip
        continue;
      }

      // Generate all three story types
      await ctx.runAction(api.ai_stories.generateCompanyStory, {
        periodStart,
        periodEnd,
        periodType,
      });

      await ctx.runAction(api.ai_stories.generateBankerStory, {
        periodStart,
        periodEnd,
        periodType,
      });

      await ctx.runAction(api.ai_stories.generateInvestorStory, {
        periodStart,
        periodEnd,
        periodType,
      });
    } catch (error) {
      console.error(`Failed to generate stories for user ${user._id}:`, error);
      // Continue with next user
    }
  }
}

/**
 * Monthly story generation
 * Runs on the 1st of each month at 2 AM
 */
export const monthlyStoryGeneration = internalAction({
  handler: async (ctx) => {
    await generateStoriesForAllUsers(ctx, "monthly");
  },
});

/**
 * Quarterly story generation
 * Runs on the 1st of each quarter (Jan, Apr, Jul, Oct) at 3 AM
 */
export const quarterlyStoryGeneration = internalAction({
  handler: async (ctx) => {
    const now = new Date();
    const month = now.getMonth();
    // Only run on first month of each quarter: Jan (0), Apr (3), Jul (6), Oct (9)
    if (month === 0 || month === 3 || month === 6 || month === 9) {
      await generateStoriesForAllUsers(ctx, "quarterly");
    }
  },
});

/**
 * Annual story generation
 * Runs on January 1st at 4 AM
 */
export const annualStoryGeneration = internalAction({
  handler: async (ctx) => {
    const now = new Date();
    const month = now.getMonth();
    // Only run in January (month 0)
    if (month === 0) {
      await generateStoriesForAllUsers(ctx, "annually");
    }
  },
});

// Cron jobs are configured in convex/crons.ts
