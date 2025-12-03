#!/usr/bin/env tsx
/**
 * Story Validation Script
 * 
 * Validates existing stories in the database to ensure they meet quality criteria.
 * This script can run without authentication if stories already exist.
 * 
 * Usage:
 *   npx tsx scripts/validate-stories.ts
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

interface ValidationResult {
  storyId: string;
  storyType: string;
  periodType: string;
  title: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  details: {
    hasNarrative: boolean;
    hasSummary: boolean;
    hasKeyMetrics: boolean;
    hasInsight: boolean;
    narrativeLength: number;
    summaryLength: number;
    keyMetricsCount: number;
    narrativeQuality: "excellent" | "good" | "fair" | "poor";
    summaryQuality: "excellent" | "good" | "fair" | "poor";
  };
}

function validateStory(story: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: any = {
    hasNarrative: false,
    hasSummary: false,
    hasKeyMetrics: false,
    hasInsight: false,
    narrativeLength: 0,
    summaryLength: 0,
    keyMetricsCount: 0,
    narrativeQuality: "poor" as const,
    summaryQuality: "poor" as const,
  };

  // Validate narrative
  if (!story.narrative || typeof story.narrative !== "string") {
    errors.push("Missing or invalid narrative");
  } else {
    details.hasNarrative = true;
    details.narrativeLength = story.narrative.length;
    
    if (story.narrative.length < 100) {
      errors.push(`Narrative too short: ${story.narrative.length} chars (minimum 100)`);
      details.narrativeQuality = "poor";
    } else if (story.narrative.length < 300) {
      warnings.push(`Narrative is short: ${story.narrative.length} chars (recommended 300+)`);
      details.narrativeQuality = "fair";
    } else if (story.narrative.length < 800) {
      details.narrativeQuality = "good";
    } else {
      details.narrativeQuality = "excellent";
    }
  }

  // Validate summary
  if (!story.summary || typeof story.summary !== "string") {
    errors.push("Missing or invalid summary");
  } else {
    details.hasSummary = true;
    details.summaryLength = story.summary.length;
    
    if (story.summary.length < 20) {
      errors.push(`Summary too short: ${story.summary.length} chars (minimum 20)`);
      details.summaryQuality = "poor";
    } else if (story.summary.length < 50) {
      warnings.push(`Summary is short: ${story.summary.length} chars (recommended 50+)`);
      details.summaryQuality = "fair";
    } else if (story.summary.length < 150) {
      details.summaryQuality = "good";
    } else {
      details.summaryQuality = "excellent";
    }
  }

  // Validate keyMetrics
  if (!story.keyMetrics || typeof story.keyMetrics !== "object") {
    errors.push("Missing or invalid keyMetrics");
  } else {
    details.hasKeyMetrics = true;
    details.keyMetricsCount = Object.keys(story.keyMetrics).length;
    
    if (details.keyMetricsCount === 0) {
      errors.push("keyMetrics object is empty");
    } else if (details.keyMetricsCount < 3) {
      warnings.push(`Only ${details.keyMetricsCount} key metrics (recommended 3+)`);
    }
  }

  // Check for insight
  if (story.keyMetrics?.insight || story.summary) {
    details.hasInsight = true;
  } else {
    warnings.push("No insight field found (optional but recommended)");
  }

  // Validate story-type-specific metrics
  if (details.hasKeyMetrics) {
    const metrics = story.keyMetrics;
    
    if (story.storyType === "company") {
      if (!metrics.burnRate && !metrics.runway && !metrics.cashFlow && !metrics.revenue) {
        warnings.push("Company story missing typical metrics (burnRate, runway, cashFlow, or revenue)");
      }
    } else if (story.storyType === "banker") {
      if (!metrics.debtToRevenue && !metrics.debtToIncome && !metrics.cashFlow) {
        warnings.push("Banker story missing typical metrics (debtToRevenue, debtToIncome, or cashFlow)");
      }
    } else if (story.storyType === "investor") {
      if (!metrics.growthRate && !metrics.revenueGrowth && !metrics.revenue) {
        warnings.push("Investor story missing typical metrics (growthRate, revenueGrowth, or revenue)");
      }
    }
  }

  return {
    storyId: story._id,
    storyType: story.storyType,
    periodType: story.periodType,
    title: story.title,
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

async function validateAllStories() {
  console.log("🚀 Starting Story Validation");
  console.log("=" .repeat(70));
  console.log("");

  try {
    console.log("📋 Fetching stories from database...");
    const stories = await client.query(api.ai_stories.getStories, {});

    if (!stories || stories.length === 0) {
      console.log("   ⚠️  No stories found in database");
      console.log("");
      console.log("💡 To generate stories:");
      console.log("   1. Start Convex dev: npx convex dev");
      console.log("   2. Start Next.js: cd apps/web && pnpm dev");
      console.log("   3. Go to http://localhost:3000/reports → Stories tab");
      console.log("   4. Generate stories using the UI");
      console.log("");
      process.exit(0);
    }

    console.log(`   ✅ Found ${stories.length} story/stories`);
    console.log("");

    console.log("=" .repeat(70));
    console.log("🔍 Validating Stories");
    console.log("=" .repeat(70));
    console.log("");

    const results: ValidationResult[] = [];

    for (const story of stories) {
      const validation = validateStory(story);
      results.push(validation);

      const status = validation.passed ? "✅" : "❌";
      console.log(`${status} ${validation.title}`);
      console.log(`   Type: ${validation.storyType} ${validation.periodType}`);
      
      if (validation.passed) {
        console.log(`   Narrative: ${validation.details.narrativeLength} chars (${validation.details.narrativeQuality})`);
        console.log(`   Summary: ${validation.details.summaryLength} chars (${validation.details.summaryQuality})`);
        console.log(`   Key Metrics: ${validation.details.keyMetricsCount}`);
        console.log(`   Insight: ${validation.details.hasInsight ? "Yes" : "No"}`);
        
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            console.log(`   ⚠️  ${warning}`);
          });
        }
      } else {
        validation.errors.forEach((error) => {
          console.log(`   ❌ ${error}`);
        });
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            console.log(`   ⚠️  ${warning}`);
          });
        }
      }
      console.log("");
    }

    // Summary
    console.log("=" .repeat(70));
    console.log("📊 Validation Summary");
    console.log("=" .repeat(70));
    console.log("");

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    console.log(`Total Stories: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);
    console.log("");

    if (failed === 0 && totalWarnings === 0) {
      console.log("🎉 All stories pass validation with no warnings!");
      console.log("   ✅ 100% pass rate achieved!");
      console.log("");
      process.exit(0);
    } else if (failed === 0) {
      console.log("✅ All stories pass validation!");
      console.log(`   ⚠️  ${totalWarnings} warning(s) found (non-critical)`);
      console.log("");
      process.exit(0);
    } else {
      console.log("⚠️  Some stories failed validation");
      console.log("");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("User not found") || error.message.includes("Not authenticated")) {
      console.log("");
      console.log("💡 Authentication required:");
      console.log("   This script needs an authenticated user context.");
      console.log("   For testing, use the UI at /reports → Stories tab");
      console.log("   Or set up authentication in the script.");
      console.log("");
    }
    process.exit(1);
  }
}

validateAllStories().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
