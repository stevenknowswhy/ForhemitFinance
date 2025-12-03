#!/usr/bin/env tsx
/**
 * Test Script for AI Story Generation
 * 
 * This script verifies that story generation functions are properly exported
 * and can be called. For full testing, use the UI at /reports → Stories tab.
 * 
 * Prerequisites:
 *   1. Convex dev server running: npx convex dev
 *   2. User authenticated in browser
 *   3. OPENROUTER_API_KEY set in Convex environment variables
 *   4. Mock data generated (via /settings)
 * 
 * Usage:
 *   npx tsx scripts/test-story-generation.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found");
  console.log("Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function testFunctionExists(functionName: string, functionType: "query" | "action" | "mutation") {
  console.log(`🧪 Testing: ${functionName} (${functionType})...`);
  
  try {
    // Check if function is exported in API
    const apiPath = functionName.split(".");
    let apiObj: any = api;
    
    for (const part of apiPath) {
      if (apiObj && typeof apiObj === "object" && part in apiObj) {
        apiObj = apiObj[part];
      } else {
        throw new Error(`Function ${functionName} not found in API`);
      }
    }
    
    if (typeof apiObj !== "function") {
      throw new Error(`Function ${functionName} is not a function`);
    }
    
    results.push({
      name: functionName,
      passed: true,
      details: `✅ Function exists and is properly exported`
    });
    
    console.log(`   ✅ Function exists and is properly exported`);
  } catch (error: any) {
    results.push({
      name: functionName,
      passed: false,
      error: error.message
    });
    
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function testStoryGenerationFunctions() {
  console.log("\n📋 Testing Story Generation Functions\n");
  console.log("=" .repeat(60));
  
  // Test all story generation functions
  await testFunctionExists("ai_stories.generateCompanyStory", "action");
  await testFunctionExists("ai_stories.generateBankerStory", "action");
  await testFunctionExists("ai_stories.generateInvestorStory", "action");
  
  console.log("\n📋 Testing Query Functions\n");
  console.log("=" .repeat(60));
  
  await testFunctionExists("ai_stories.getStories", "query");
  await testFunctionExists("ai_stories.getStoryById", "query");
  await testFunctionExists("ai_stories.aggregateFinancialDataQuery", "query");
  
  console.log("\n📋 Testing Mutation Functions\n");
  console.log("=" .repeat(60));
  
  await testFunctionExists("ai_stories.updateStory", "mutation");
  
  console.log("\n📋 Testing Export Functions\n");
  console.log("=" .repeat(60));
  
  await testFunctionExists("ai_stories.exportStory", "action");
}

async function testScheduledFunctions() {
  console.log("\n📋 Testing Scheduled Functions\n");
  console.log("=" .repeat(60));
  
  await testFunctionExists("scheduled.monthlyStoryGeneration", "action");
  await testFunctionExists("scheduled.quarterlyStoryGeneration", "action");
  await testFunctionExists("scheduled.annualStoryGeneration", "action");
}

async function runTests() {
  console.log("🚀 Starting AI Story Generation Test Suite\n");
  console.log("=" .repeat(60));
  console.log("");
  
  await testStoryGenerationFunctions();
  await testScheduledFunctions();
  
  console.log("");
  console.log("=" .repeat(60));
  console.log("📊 Test Results Summary");
  console.log("=" .repeat(60));
  console.log("");
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      passed++;
    } else {
      console.log(`❌ ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  }
  
  console.log("");
  console.log("=" .repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=" .repeat(60));
  console.log("");
  
  if (failed > 0) {
    console.log("⚠️  Some functions are missing or not properly exported.");
    console.log("   Check the convex/ai_stories.ts file for issues.");
    console.log("");
  } else {
    console.log("✅ All functions are properly exported!");
    console.log("");
  }
  
  console.log("💡 Next Steps for Full Testing:");
  console.log("");
  console.log("1. Start Convex Dev Server:");
  console.log("   npx convex dev");
  console.log("");
  console.log("2. Start Next.js Dev Server:");
  console.log("   cd apps/web && pnpm dev");
  console.log("");
  console.log("3. Generate Mock Data:");
  console.log("   - Go to http://localhost:3000/settings");
  console.log("   - Click 'Generate 3 Months Mock Data'");
  console.log("   - Wait for data generation to complete");
  console.log("");
  console.log("4. Test Story Generation:");
  console.log("   - Go to http://localhost:3000/reports");
  console.log("   - Click on 'Stories' tab");
  console.log("   - Click 'Generate' on each story card:");
  console.log("     • Company Story (Monthly)");
  console.log("     • Banker Story (Monthly)");
  console.log("     • Investor Story (Monthly)");
  console.log("   - Wait for generation (30-60 seconds each)");
  console.log("   - Verify stories appear with:");
  console.log("     • Title");
  console.log("     • Summary");
  console.log("     • Key metrics");
  console.log("     • Full narrative (click 'View')");
  console.log("");
  console.log("5. Test Export Functionality:");
  console.log("   - Click 'View' on a generated story");
  console.log("   - Test each export button:");
  console.log("     • CSV - Should download file");
  console.log("     • Email - Should open HTML template");
  console.log("     • PDF - Should show message");
  console.log("     • Share - Should copy link to clipboard");
  console.log("");
  console.log("6. Test User Notes:");
  console.log("   - In Story View, click 'Edit' on notes section");
  console.log("   - Add some notes");
  console.log("   - Click 'Save'");
  console.log("   - Verify notes are saved");
  console.log("");
  console.log("7. Check for Errors:");
  console.log("   - Open browser console (F12)");
  console.log("   - Check for any error messages");
  console.log("   - Check Convex dashboard logs");
  console.log("   - Verify OPENROUTER_API_KEY is set in Convex dashboard");
  console.log("");
}

runTests().catch(console.error);
