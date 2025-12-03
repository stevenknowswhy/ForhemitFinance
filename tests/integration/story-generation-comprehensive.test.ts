#!/usr/bin/env tsx
/**
 * Comprehensive Test Script for AI Story Generation
 * 
 * This script:
 * 1. Generates mock data if needed
 * 2. Generates all story types (company, banker, investor) for monthly and quarterly periods
 * 3. Validates each story meets quality criteria
 * 4. Ensures 100% pass rate
 * 
 * Prerequisites:
 *   1. Convex dev server running: npx convex dev
 *   2. OPENROUTER_API_KEY set in Convex environment variables
 *   3. User authenticated (you'll need to provide auth token or run in authenticated context)
 * 
 * Usage:
 *   npx tsx scripts/test-story-generation-comprehensive.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    // .env.local might not exist, that's okay
  }
}

loadEnvFile();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found");
  console.log("Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface StoryTestResult {
  storyType: "company" | "banker" | "investor";
  periodType: "monthly" | "quarterly";
  passed: boolean;
  storyId?: string;
  error?: string;
  validationErrors?: string[];
  details?: {
    hasNarrative: boolean;
    hasSummary: boolean;
    hasKeyMetrics: boolean;
    hasInsight: boolean;
    narrativeLength: number;
    summaryLength: number;
    keyMetricsCount: number;
  };
}

const results: StoryTestResult[] = [];

// Calculate date ranges
function calculateDateRange(periodType: "monthly" | "quarterly"): { start: number; end: number } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  if (periodType === "monthly") {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    // Quarterly
    const quarter = Math.floor(start.getMonth() / 3);
    start.setMonth(quarter * 3 - 3);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

// Validate story quality
function validateStory(story: any): { passed: boolean; errors: string[]; details: any } {
  const errors: string[] = [];
  const details: any = {
    hasNarrative: false,
    hasSummary: false,
    hasKeyMetrics: false,
    hasInsight: false,
    narrativeLength: 0,
    summaryLength: 0,
    keyMetricsCount: 0,
  };

  // Check narrative
  if (!story.narrative || typeof story.narrative !== "string") {
    errors.push("Missing or invalid narrative");
  } else {
    details.hasNarrative = true;
    details.narrativeLength = story.narrative.length;
    if (story.narrative.length < 100) {
      errors.push(`Narrative too short: ${story.narrative.length} characters (minimum 100)`);
    }
  }

  // Check summary
  if (!story.summary || typeof story.summary !== "string") {
    errors.push("Missing or invalid summary");
  } else {
    details.hasSummary = true;
    details.summaryLength = story.summary.length;
    if (story.summary.length < 20) {
      errors.push(`Summary too short: ${story.summary.length} characters (minimum 20)`);
    }
  }

  // Check keyMetrics
  if (!story.keyMetrics || typeof story.keyMetrics !== "object") {
    errors.push("Missing or invalid keyMetrics");
  } else {
    details.hasKeyMetrics = true;
    details.keyMetricsCount = Object.keys(story.keyMetrics).length;
    if (details.keyMetricsCount === 0) {
      errors.push("keyMetrics object is empty");
    }
  }

  // Check insight (optional but preferred)
  if (story.keyMetrics?.insight || story.summary) {
    details.hasInsight = true;
  }

  // Validate key metrics structure
  if (details.hasKeyMetrics) {
    const metrics = story.keyMetrics;
    const requiredMetrics: string[] = [];

    if (story.storyType === "company") {
      // Company stories should have burn rate, runway, or cash flow metrics
      if (!metrics.burnRate && !metrics.runway && !metrics.cashFlow) {
        requiredMetrics.push("burnRate, runway, or cashFlow");
      }
    } else if (story.storyType === "banker") {
      // Banker stories should have debt metrics
      if (!metrics.debtToRevenue && !metrics.debtToIncome) {
        requiredMetrics.push("debtToRevenue or debtToIncome");
      }
    } else if (story.storyType === "investor") {
      // Investor stories should have growth metrics
      if (!metrics.growthRate && !metrics.revenueGrowth) {
        requiredMetrics.push("growthRate or revenueGrowth");
      }
    }

    if (requiredMetrics.length > 0) {
      errors.push(`Missing story-type-specific metrics: ${requiredMetrics.join(", ")}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    details,
  };
}

// Generate a single story
async function generateStory(
  storyType: "company" | "banker" | "investor",
  periodType: "monthly" | "quarterly"
): Promise<StoryTestResult> {
  const dateRange = calculateDateRange(periodType);
  const result: StoryTestResult = {
    storyType,
    periodType,
    passed: false,
  };

  try {
    console.log(`\n📝 Generating ${storyType} ${periodType} story...`);
    console.log(`   Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`);

    let actionResult: any;
    const startTime = Date.now();

    if (storyType === "company") {
      actionResult = await client.action(api.ai_stories.generateCompanyStory, {
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        periodType,
      });
    } else if (storyType === "banker") {
      actionResult = await client.action(api.ai_stories.generateBankerStory, {
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        periodType,
      });
    } else {
      actionResult = await client.action(api.ai_stories.generateInvestorStory, {
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        periodType,
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!actionResult.success) {
      result.error = actionResult.error || "Unknown error";
      console.log(`   ❌ Failed: ${result.error}`);
      return result;
    }

    result.storyId = actionResult.storyId;
    console.log(`   ✅ Generated in ${duration}s (ID: ${actionResult.storyId})`);

    // Fetch the story to validate
    const story = await client.query(api.ai_stories.getStoryById, {
      storyId: actionResult.storyId,
    });

    if (!story) {
      result.error = "Story not found after generation";
      console.log(`   ❌ ${result.error}`);
      return result;
    }

    // Validate story quality
    const validation = validateStory(story);
    result.details = validation.details;
    result.validationErrors = validation.errors;

    if (validation.passed) {
      result.passed = true;
      console.log(`   ✅ Validation passed:`);
      console.log(`      • Narrative: ${validation.details.narrativeLength} chars`);
      console.log(`      • Summary: ${validation.details.summaryLength} chars`);
      console.log(`      • Key Metrics: ${validation.details.keyMetricsCount}`);
      console.log(`      • Insight: ${validation.details.hasInsight ? "Yes" : "No"}`);
    } else {
      result.passed = false;
      console.log(`   ❌ Validation failed:`);
      validation.errors.forEach((error) => {
        console.log(`      • ${error}`);
      });
    }

    return result;
  } catch (error: any) {
    result.error = error.message || "Unknown error occurred";
    console.log(`   ❌ Error: ${result.error}`);
    return result;
  }
}

// Check if mock data exists
async function checkMockData(): Promise<boolean> {
  try {
    const status = await client.query(api.mock_data.getMockDataStatus, {});
    return status && status.hasData === true;
  } catch (error) {
    return false;
  }
}

// Generate mock data if needed
async function ensureMockData(): Promise<boolean> {
  console.log("\n📊 Checking for mock data...");
  const hasData = await checkMockData();

  if (hasData) {
    console.log("   ✅ Mock data exists");
    return true;
  }

  console.log("   ⚠️  No mock data found. Generating...");
  try {
    const result = await client.action(api.mock_data.generateThreeMonthsMockData, {});
    if (result.success) {
      console.log("   ✅ Mock data generated successfully");
      // Wait a bit for data to be fully written
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } else {
      console.log(`   ❌ Failed to generate mock data: ${result.error}`);
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ Error generating mock data: ${error.message}`);
    return false;
  }
}

// Main test function
async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive AI Story Generation Test Suite");
  console.log("=" .repeat(70));
  console.log("");

  // Check prerequisites
  console.log("📋 Checking Prerequisites...");
  console.log("");

  if (!CONVEX_URL) {
    console.error("❌ CONVEX_URL not set");
    process.exit(1);
  }
  console.log("   ✅ CONVEX_URL: " + CONVEX_URL);

  // Ensure mock data exists
  const hasData = await ensureMockData();
  if (!hasData) {
    console.error("\n❌ Cannot proceed without mock data");
    process.exit(1);
  }

  console.log("");
  console.log("=" .repeat(70));
  console.log("📝 Generating Stories");
  console.log("=" .repeat(70));

  // Generate all story types and periods
  const storyTypes: Array<"company" | "banker" | "investor"> = ["company", "banker", "investor"];
  const periodTypes: Array<"monthly" | "quarterly"> = ["monthly", "quarterly"];

  for (const storyType of storyTypes) {
    for (const periodType of periodTypes) {
      const result = await generateStory(storyType, periodType);
      results.push(result);

      // Small delay between generations to avoid rate limiting
      if (storyType !== "investor" || periodType !== "quarterly") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Print summary
  console.log("");
  console.log("=" .repeat(70));
  console.log("📊 Test Results Summary");
  console.log("=" .repeat(70));
  console.log("");

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? "✅" : "❌";
    const name = `${result.storyType} ${result.periodType}`;
    console.log(`${status} ${name}`);

    if (result.passed && result.details) {
      console.log(`   Narrative: ${result.details.narrativeLength} chars`);
      console.log(`   Summary: ${result.details.summaryLength} chars`);
      console.log(`   Key Metrics: ${result.details.keyMetricsCount}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.validationErrors) {
      result.validationErrors.forEach((error) => {
        console.log(`   Validation: ${error}`);
      });
    }

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
    console.log("");
  }

  console.log("=" .repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=" .repeat(70));
  console.log("");

  if (failed === 0) {
    console.log("🎉 All stories generated and validated successfully!");
    console.log("   ✅ 100% pass rate achieved!");
    console.log("");
    process.exit(0);
  } else {
    console.log("⚠️  Some stories failed validation or generation");
    console.log("");
    console.log("Common issues:");
    console.log("  • OPENROUTER_API_KEY not set in Convex environment");
    console.log("  • Insufficient financial data for the period");
    console.log("  • AI model returned invalid JSON");
    console.log("  • Network/timeout issues");
    console.log("");
    process.exit(1);
  }
}

// Run tests
runComprehensiveTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
