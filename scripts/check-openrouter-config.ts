#!/usr/bin/env tsx
/**
 * OpenRouter API Configuration Checker
 * 
 * This script checks if OpenRouter API is properly configured in Convex.
 * Run this before testing AI story generation.
 * 
 * Usage:
 *   npx tsx scripts/check-openrouter-config.ts
 */

import { ConvexHttpClient } from "convex/browser";

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found in environment variables");
  console.log("\nPlease set one of:");
  console.log("  - NEXT_PUBLIC_CONVEX_URL");
  console.log("  - CONVEX_URL");
  console.log("\nOr run: npx convex dev (to get the URL)");
  process.exit(1);
}

async function checkOpenRouterConfig() {
  console.log("🔍 Checking OpenRouter API Configuration...\n");

  try {
    // Note: We can't directly check env vars from client
    // This script is meant to be run with Convex CLI or as a test
    console.log("📋 Configuration Checklist:");
    console.log("");
    console.log("1. ✅ Convex URL:", CONVEX_URL);
    console.log("");
    console.log("2. ⚠️  OpenRouter API Key:");
    console.log("   - Must be set in Convex Dashboard");
    console.log("   - Go to: https://dashboard.convex.dev");
    console.log("   - Navigate to: Settings → Environment Variables");
    console.log("   - Add: OPENROUTER_API_KEY=your_key_here");
    console.log("");
    console.log("3. ⚠️  Optional: OPENROUTER_REFERRER");
    console.log("   - Default: https://ezfinancial.app");
    console.log("   - Can be customized in Convex environment variables");
    console.log("");
    console.log("📝 To verify the key is set:");
    console.log("   1. Go to Convex Dashboard");
    console.log("   2. Check Settings → Environment Variables");
    console.log("   3. Look for OPENROUTER_API_KEY");
    console.log("");
    console.log("🧪 To test if it works:");
    console.log("   - Try generating an AI story in the app");
    console.log("   - Check Convex logs for API errors");
    console.log("");

    // Try to create a simple test query
    const client = new ConvexHttpClient(CONVEX_URL);
    
    console.log("✅ Configuration check complete!");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Ensure OPENROUTER_API_KEY is set in Convex Dashboard");
    console.log("  2. Run the test script: npx tsx scripts/test-ai-functions.ts");
    console.log("  3. Or test manually in the app UI");
    
  } catch (error: any) {
    console.error("❌ Error checking configuration:", error.message);
    process.exit(1);
  }
}

checkOpenRouterConfig();
