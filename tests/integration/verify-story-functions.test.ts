#!/usr/bin/env tsx
/**
 * Verification Script for AI Story Functions
 * 
 * This script verifies that all story generation functions are properly
 * implemented and exported by checking the source code structure.
 * 
 * Usage:
 *   npx tsx scripts/verify-story-functions.ts
 */

import * as fs from "fs";
import * as path from "path";

const results: Array<{ name: string; passed: boolean; error?: string }> = [];

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function checkFunctionExists(filePath: string, functionName: string): boolean {
  if (!checkFileExists(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const exportPattern = new RegExp(`export\\s+(const|function)\\s+${functionName}`, "m");
  return exportPattern.test(content);
}

function checkFunctionCall(filePath: string, functionName: string): boolean {
  if (!checkFileExists(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const callPattern = new RegExp(`${functionName}\\s*\\(`, "m");
  return callPattern.test(content);
}

async function verifyStoryFunctions() {
  console.log("🔍 Verifying AI Story Functions\n");
  console.log("=" .repeat(60));
  
  const aiStoriesPath = path.join(process.cwd(), "convex", "ai_stories.ts");
  const scheduledPath = path.join(process.cwd(), "convex", "scheduled.ts");
  const cronsPath = path.join(process.cwd(), "convex", "crons.ts");
  const schemaPath = path.join(process.cwd(), "convex", "schema.ts");
  
  // Check if files exist
  console.log("\n📁 Checking Files...\n");
  
  const files = [
    { name: "convex/ai_stories.ts", path: aiStoriesPath },
    { name: "convex/scheduled.ts", path: scheduledPath },
    { name: "convex/crons.ts", path: cronsPath },
    { name: "convex/schema.ts", path: schemaPath },
  ];
  
  for (const file of files) {
    const exists = checkFileExists(file.path);
    results.push({
      name: `File: ${file.name}`,
      passed: exists,
      error: exists ? undefined : "File not found"
    });
    console.log(exists ? `✅ ${file.name}` : `❌ ${file.name} - Not found`);
  }
  
  // Check story generation functions
  console.log("\n📝 Checking Story Generation Functions...\n");
  
  const storyFunctions = [
    "generateCompanyStory",
    "generateBankerStory",
    "generateInvestorStory",
    "getStories",
    "getStoryById",
    "updateStory",
    "exportStory",
    "aggregateFinancialDataQuery",
  ];
  
  for (const func of storyFunctions) {
    const exists = checkFunctionExists(aiStoriesPath, func);
    results.push({
      name: `Function: ${func}`,
      passed: exists,
      error: exists ? undefined : "Function not exported"
    });
    console.log(exists ? `✅ ${func}` : `❌ ${func} - Not found`);
  }
  
  // Check helper functions
  console.log("\n🔧 Checking Helper Functions...\n");
  
  const helperFunctions = [
    "callOpenRouterAPI",
    "buildCompanyStoryPrompt",
    "buildBankerStoryPrompt",
    "buildInvestorStoryPrompt",
  ];
  
  for (const func of helperFunctions) {
    const exists = checkFunctionCall(aiStoriesPath, func);
    results.push({
      name: `Helper: ${func}`,
      passed: exists,
      error: exists ? undefined : "Function not found"
    });
    console.log(exists ? `✅ ${func}` : `❌ ${func} - Not found`);
  }
  
  // Check scheduled functions
  console.log("\n⏰ Checking Scheduled Functions...\n");
  
  const scheduledFunctions = [
    "monthlyStoryGeneration",
    "quarterlyStoryGeneration",
    "annualStoryGeneration",
  ];
  
  for (const func of scheduledFunctions) {
    const exists = checkFunctionExists(scheduledPath, func);
    results.push({
      name: `Scheduled: ${func}`,
      passed: exists,
      error: exists ? undefined : "Function not exported"
    });
    console.log(exists ? `✅ ${func}` : `❌ ${func} - Not found`);
  }
  
  // Check schema
  console.log("\n🗄️  Checking Database Schema...\n");
  
  if (checkFileExists(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const hasAiStoriesTable = /ai_stories:\s*defineTable/.test(schemaContent);
    results.push({
      name: "Schema: ai_stories table",
      passed: hasAiStoriesTable,
      error: hasAiStoriesTable ? undefined : "ai_stories table not found"
    });
    console.log(hasAiStoriesTable ? `✅ ai_stories table` : `❌ ai_stories table - Not found`);
  }
  
  // Check cron jobs
  console.log("\n⏱️  Checking Cron Jobs...\n");
  
  if (checkFileExists(cronsPath)) {
    const cronsContent = fs.readFileSync(cronsPath, "utf-8");
    const hasMonthlyCron = /crons\.monthly/.test(cronsContent);
    const hasQuarterlyCron = /crons\.monthly.*quarterly/i.test(cronsContent) || /generateQuarterlyStories/.test(cronsContent);
    const hasAnnualCron = /crons\.monthly.*annual/i.test(cronsContent) || /generateAnnualStories/.test(cronsContent);
    
    results.push({
      name: "Cron: Monthly generation",
      passed: hasMonthlyCron,
      error: hasMonthlyCron ? undefined : "Monthly cron not configured"
    });
    console.log(hasMonthlyCron ? `✅ Monthly cron` : `❌ Monthly cron - Not configured`);
    
    results.push({
      name: "Cron: Quarterly generation",
      passed: hasQuarterlyCron,
      error: hasQuarterlyCron ? undefined : "Quarterly cron not configured"
    });
    console.log(hasQuarterlyCron ? `✅ Quarterly cron` : `❌ Quarterly cron - Not configured`);
    
    results.push({
      name: "Cron: Annual generation",
      passed: hasAnnualCron,
      error: hasAnnualCron ? undefined : "Annual cron not configured"
    });
    console.log(hasAnnualCron ? `✅ Annual cron` : `❌ Annual cron - Not configured`);
  }
  
  // Check UI components
  console.log("\n🎨 Checking UI Components...\n");
  
  const componentsPath = path.join(process.cwd(), "apps", "web", "app", "reports", "components");
  const components = [
    "StoriesTab.tsx",
    "StoryCard.tsx",
    "StoryView.tsx",
    "StoryGenerator.tsx",
  ];
  
  for (const component of components) {
    const componentPath = path.join(componentsPath, component);
    const exists = checkFileExists(componentPath);
    results.push({
      name: `Component: ${component}`,
      passed: exists,
      error: exists ? undefined : "Component not found"
    });
    console.log(exists ? `✅ ${component}` : `❌ ${component} - Not found`);
  }
}

async function runVerification() {
  console.log("🚀 Starting AI Story Functions Verification\n");
  console.log("=" .repeat(60));
  console.log("");
  
  await verifyStoryFunctions();
  
  console.log("");
  console.log("=" .repeat(60));
  console.log("📊 Verification Summary");
  console.log("=" .repeat(60));
  console.log("");
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    if (result.passed) {
      passed++;
    } else {
      failed++;
      console.log(`❌ ${result.name}`);
      if (result.error) {
        console.log(`   ${result.error}`);
      }
    }
  }
  
  console.log("");
  console.log("=" .repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=" .repeat(60));
  console.log("");
  
  if (failed === 0) {
    console.log("✅ All verifications passed!");
    console.log("");
    console.log("💡 Next Steps:");
    console.log("");
    console.log("1. Start the development servers:");
    console.log("   Terminal 1: npx convex dev");
    console.log("   Terminal 2: cd apps/web && pnpm dev");
    console.log("");
    console.log("2. Generate mock data:");
    console.log("   - Go to http://localhost:3000/settings");
    console.log("   - Click 'Generate 3 Months Mock Data'");
    console.log("");
    console.log("3. Test story generation:");
    console.log("   - Go to http://localhost:3000/reports");
    console.log("   - Click 'Stories' tab");
    console.log("   - Generate each story type (Company, Banker, Investor)");
    console.log("   - Verify stories are created and displayed correctly");
    console.log("");
  } else {
    console.log("⚠️  Some verifications failed. Please fix the issues above.");
    console.log("");
  }
}

runVerification().catch(console.error);
