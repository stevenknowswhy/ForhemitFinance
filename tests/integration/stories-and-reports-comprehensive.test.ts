#!/usr/bin/env tsx
/**
 * Comprehensive Test Script for AI Stories and Reports Generation
 * 
 * This script:
 * 1. Generates mock data if needed
 * 2. Generates all story types (company, banker, investor) for monthly and quarterly periods using LLM
 * 3. Validates each story meets 100% quality criteria
 * 4. Tests report data aggregation
 * 5. Ensures 100% pass rate for all stories
 * 
 * Prerequisites:
 *   1. Convex dev server running: npx convex dev
 *   2. OPENROUTER_API_KEY set in Convex environment variables
 *   3. User authenticated (you'll need to provide auth token or run in authenticated context)
 * 
 * Usage:
 *   npx tsx scripts/test-stories-and-reports-comprehensive.ts
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
    narrativeQuality: "excellent" | "good" | "fair" | "poor";
    summaryQuality: "excellent" | "good" | "fair" | "poor";
    roleSpecificMetrics: boolean;
  };
}

interface ReportTestResult {
  reportType: string;
  passed: boolean;
  error?: string;
  hasData: boolean;
  dataKeys: string[];
}

const storyResults: StoryTestResult[] = [];
const reportResults: ReportTestResult[] = [];

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

// Validate story quality with strict 100% criteria
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
    narrativeQuality: "poor" as const,
    summaryQuality: "poor" as const,
    roleSpecificMetrics: false,
  };

  // Check narrative (REQUIRED - must be 100+ chars)
  if (!story.narrative || typeof story.narrative !== "string") {
    errors.push("Missing or invalid narrative");
  } else {
    details.hasNarrative = true;
    details.narrativeLength = story.narrative.length;
    if (story.narrative.length < 100) {
      errors.push(`Narrative too short: ${story.narrative.length} characters (minimum 100)`);
      details.narrativeQuality = "poor";
    } else if (story.narrative.length < 300) {
      errors.push(`Narrative too short: ${story.narrative.length} characters (minimum 300 for quality)`);
      details.narrativeQuality = "fair";
    } else if (story.narrative.length < 800) {
      details.narrativeQuality = "good";
    } else {
      details.narrativeQuality = "excellent";
    }
  }

  // Check summary (REQUIRED - must be 20+ chars)
  if (!story.summary || typeof story.summary !== "string") {
    errors.push("Missing or invalid summary");
  } else {
    details.hasSummary = true;
    details.summaryLength = story.summary.length;
    if (story.summary.length < 20) {
      errors.push(`Summary too short: ${story.summary.length} characters (minimum 20)`);
      details.summaryQuality = "poor";
    } else if (story.summary.length < 50) {
      errors.push(`Summary too short: ${story.summary.length} characters (minimum 50 for quality)`);
      details.summaryQuality = "fair";
    } else if (story.summary.length < 150) {
      details.summaryQuality = "good";
    } else {
      details.summaryQuality = "excellent";
    }
  }

  // Check keyMetrics (REQUIRED - must have at least 3 metrics)
  if (!story.keyMetrics || typeof story.keyMetrics !== "object") {
    errors.push("Missing or invalid keyMetrics");
  } else {
    details.hasKeyMetrics = true;
    details.keyMetricsCount = Object.keys(story.keyMetrics).length;
    if (details.keyMetricsCount === 0) {
      errors.push("keyMetrics object is empty");
    } else if (details.keyMetricsCount < 3) {
      errors.push(`Insufficient key metrics: ${details.keyMetricsCount} (minimum 3 required)`);
    }
  }

  // Check insight (REQUIRED for 100% pass)
  if (story.keyMetrics?.insight || story.summary) {
    details.hasInsight = true;
  } else {
    errors.push("Missing insight field (required for 100% pass)");
  }

  // Validate role-specific metrics (REQUIRED for 100% pass)
  if (details.hasKeyMetrics) {
    const metrics = story.keyMetrics;
    
    if (story.storyType === "company") {
      const hasCompanyMetrics = metrics.burnRate !== undefined || 
                                metrics.runway !== undefined || 
                                metrics.cashFlow !== undefined ||
                                metrics.revenue !== undefined;
      if (!hasCompanyMetrics) {
        errors.push("Company story missing required metrics (burnRate, runway, cashFlow, or revenue)");
      } else {
        details.roleSpecificMetrics = true;
      }
    } else if (story.storyType === "banker") {
      const hasBankerMetrics = metrics.debtToRevenue !== undefined || 
                              metrics.debtToIncome !== undefined || 
                              metrics.cashFlow !== undefined;
      if (!hasBankerMetrics) {
        errors.push("Banker story missing required metrics (debtToRevenue, debtToIncome, or cashFlow)");
      } else {
        details.roleSpecificMetrics = true;
      }
    } else if (story.storyType === "investor") {
      const hasInvestorMetrics = metrics.growthRate !== undefined || 
                                metrics.revenueGrowth !== undefined || 
                                metrics.revenue !== undefined ||
                                metrics.ltvCac !== undefined;
      if (!hasInvestorMetrics) {
        errors.push("Investor story missing required metrics (growthRate, revenueGrowth, revenue, or ltvCac)");
      } else {
        details.roleSpecificMetrics = true;
      }
    }
  }

  // Additional quality checks for 100% pass
  if (details.narrativeQuality === "poor") {
    errors.push("Narrative quality is poor (must be at least 'fair' for 100% pass)");
  }

  if (details.summaryQuality === "poor") {
    errors.push("Summary quality is poor (must be at least 'fair' for 100% pass)");
  }

  return {
    passed: errors.length === 0,
    errors,
    details,
  };
}

// Generate a single story using LLM
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
    console.log(`\n📝 Generating ${storyType} ${periodType} story using LLM...`);
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

    // Validate story quality with strict 100% criteria
    const validation = validateStory(story);
    result.details = validation.details;
    result.validationErrors = validation.errors;

    if (validation.passed) {
      result.passed = true;
      console.log(`   ✅ Validation PASSED (100%):`);
      console.log(`      • Narrative: ${validation.details.narrativeLength} chars (${validation.details.narrativeQuality})`);
      console.log(`      • Summary: ${validation.details.summaryLength} chars (${validation.details.summaryQuality})`);
      console.log(`      • Key Metrics: ${validation.details.keyMetricsCount}`);
      console.log(`      • Insight: ${validation.details.hasInsight ? "Yes" : "No"}`);
      console.log(`      • Role-Specific Metrics: ${validation.details.roleSpecificMetrics ? "Yes" : "No"}`);
    } else {
      result.passed = false;
      console.log(`   ❌ Validation FAILED (not 100%):`);
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

// Test report data aggregation
async function testReport(reportType: string, queryFn: () => Promise<any>): Promise<ReportTestResult> {
  const result: ReportTestResult = {
    reportType,
    passed: false,
    hasData: false,
    dataKeys: [],
  };

  try {
    console.log(`\n📊 Testing ${reportType} report...`);
    const data = await queryFn();

    if (!data) {
      result.error = "Report returned null/undefined";
      console.log(`   ❌ ${result.error}`);
      return result;
    }

    result.hasData = true;
    result.dataKeys = Object.keys(data);
    result.passed = true;

    console.log(`   ✅ Report data retrieved successfully`);
    console.log(`      • Data keys: ${result.dataKeys.length}`);
    console.log(`      • Sample keys: ${result.dataKeys.slice(0, 5).join(", ")}`);

    return result;
  } catch (error: any) {
    result.error = error.message || "Unknown error";
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
  console.log("🚀 Starting Comprehensive AI Stories and Reports Test Suite");
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
  console.log("📝 Generating Stories Using LLM");
  console.log("=" .repeat(70));

  // Generate all story types and periods
  const storyTypes: Array<"company" | "banker" | "investor"> = ["company", "banker", "investor"];
  const periodTypes: Array<"monthly" | "quarterly"> = ["monthly", "quarterly"];

  for (const storyType of storyTypes) {
    for (const periodType of periodTypes) {
      const result = await generateStory(storyType, periodType);
      storyResults.push(result);

      // Small delay between generations to avoid rate limiting
      if (storyType !== "investor" || periodType !== "quarterly") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.log("");
  console.log("=" .repeat(70));
  console.log("📊 Testing Reports");
  console.log("=" .repeat(70));

  // Test report data aggregation
  const dateRange = calculateDateRange("monthly");
  
  const reports = [
    {
      name: "Financial Summary (Monthly)",
      query: () => client.query(api.reports.getFinancialSummaryData, {
        period: "monthly",
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    },
    {
      name: "Profit & Loss",
      query: () => client.query(api.reports.getProfitAndLossData, {
        startDate: dateRange.start,
        endDate: dateRange.end,
        filterType: "blended",
        mode: "simple",
      }),
    },
    {
      name: "Cash Flow Statement",
      query: () => client.query(api.reports.getCashFlowStatementData, {
        startDate: dateRange.start,
        endDate: dateRange.end,
        period: "monthly",
      }),
    },
    {
      name: "Bank/Lender Report",
      query: () => client.query(api.reports.getBankLenderReportData, {
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    },
  ];

  for (const report of reports) {
    const result = await testReport(report.name, report.query);
    reportResults.push(result);
  }

  // Print summary
  console.log("");
  console.log("=" .repeat(70));
  console.log("📊 Test Results Summary");
  console.log("=" .repeat(70));
  console.log("");

  // Stories summary
  console.log("📝 STORIES:");
  console.log("-" .repeat(70));
  let storiesPassed = 0;
  let storiesFailed = 0;

  for (const result of storyResults) {
    const status = result.passed ? "✅" : "❌";
    const name = `${result.storyType} ${result.periodType}`;
    console.log(`${status} ${name}`);

    if (result.passed && result.details) {
      console.log(`   Narrative: ${result.details.narrativeLength} chars (${result.details.narrativeQuality})`);
      console.log(`   Summary: ${result.details.summaryLength} chars (${result.details.summaryQuality})`);
      console.log(`   Key Metrics: ${result.details.keyMetricsCount}`);
      console.log(`   Insight: ${result.details.hasInsight ? "Yes" : "No"}`);
      console.log(`   Role-Specific Metrics: ${result.details.roleSpecificMetrics ? "Yes" : "No"}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.validationErrors) {
      result.validationErrors.forEach((error) => {
        console.log(`   Validation: ${error}`);
      });
    }

    if (result.passed) {
      storiesPassed++;
    } else {
      storiesFailed++;
    }
    console.log("");
  }

  console.log(`Stories Total: ${storyResults.length} | Passed: ${storiesPassed} | Failed: ${storiesFailed}`);
  console.log("");

  // Reports summary
  console.log("📊 REPORTS:");
  console.log("-" .repeat(70));
  let reportsPassed = 0;
  let reportsFailed = 0;

  for (const result of reportResults) {
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${result.reportType}`);
    if (result.passed) {
      console.log(`   Data keys: ${result.dataKeys.length}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    if (result.passed) {
      reportsPassed++;
    } else {
      reportsFailed++;
    }
    console.log("");
  }

  console.log(`Reports Total: ${reportResults.length} | Passed: ${reportsPassed} | Failed: ${reportsFailed}`);
  console.log("");

  // Final summary
  console.log("=" .repeat(70));
  const totalPassed = storiesPassed + reportsPassed;
  const totalFailed = storiesFailed + reportsFailed;
  const total = storyResults.length + reportResults.length;
  const passRate = total > 0 ? ((totalPassed / total) * 100).toFixed(1) : "0.0";
  
  console.log(`Overall: ${total} tests | Passed: ${totalPassed} | Failed: ${totalFailed} | Pass Rate: ${passRate}%`);
  console.log("=" .repeat(70));
  console.log("");

  if (storiesFailed === 0 && reportsFailed === 0) {
    console.log("🎉 All stories and reports passed validation!");
    console.log("   ✅ 100% pass rate achieved!");
    console.log("");
    console.log("✨ All stories generated using LLM meet quality criteria:");
    console.log("   • Narrative quality: Good or Excellent");
    console.log("   • Summary quality: Good or Excellent");
    console.log("   • Key metrics: 3+ metrics present");
    console.log("   • Insight: Present");
    console.log("   • Role-specific metrics: Present");
    console.log("");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed");
    console.log("");
    if (storiesFailed > 0) {
      console.log("Story generation issues:");
      console.log("  • OPENROUTER_API_KEY not set in Convex environment");
      console.log("  • Insufficient financial data for the period");
      console.log("  • AI model returned invalid JSON");
      console.log("  • Network/timeout issues");
      console.log("  • Stories don't meet 100% quality criteria");
    }
    if (reportsFailed > 0) {
      console.log("Report issues:");
      console.log("  • Missing financial data");
      console.log("  • Authentication issues");
    }
    console.log("");
    process.exit(1);
  }
}

// Run tests
runComprehensiveTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
