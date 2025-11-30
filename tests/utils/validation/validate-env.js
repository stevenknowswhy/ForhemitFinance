#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Checks if .env.local is set up correctly
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const requiredVars = {
  // Required for Convex
  'NEXT_PUBLIC_CONVEX_URL': {
    required: true,
    pattern: /^https:\/\/.*\.convex\.cloud$/,
    description: 'Convex deployment URL'
  },
  
  // Required for Clerk
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': {
    required: true,
    pattern: /^pk_(test|live)_/,
    description: 'Clerk publishable key'
  },
  'CLERK_SECRET_KEY': {
    required: true,
    pattern: /^sk_(test|live)_/,
    description: 'Clerk secret key (should start with sk_test_ or sk_live_)'
  },
  
  // Required for Stripe
  'STRIPE_SECRET_KEY': {
    required: true,
    pattern: /^sk_(test|live)_/,
    description: 'Stripe secret key'
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: true,
    pattern: /^whsec_/,
    description: 'Stripe webhook secret (should start with whsec_)'
  },
  
  // Required for Stripe pricing
  'STRIPE_PRICE_LIGHT_MONTHLY': {
    required: true,
    pattern: /^price_(prod|test)_/,
    description: 'Stripe Light plan monthly price ID'
  },
  'STRIPE_PRICE_LIGHT_ANNUAL': {
    required: true,
    pattern: /^price_(prod|test)_/,
    description: 'Stripe Light plan annual price ID'
  },
  'STRIPE_PRICE_PRO_MONTHLY': {
    required: true,
    pattern: /^price_(prod|test)_/,
    description: 'Stripe Pro plan monthly price ID'
  },
  'STRIPE_PRICE_PRO_ANNUAL': {
    required: true,
    pattern: /^price_(prod|test)_/,
    description: 'Stripe Pro plan annual price ID'
  }
};

// Optional variables (warn if missing but don't fail)
const optionalVars = {
  'PLAID_CLIENT_ID': {
    pattern: /^.+$/,
    description: 'Plaid client ID (optional, for bank connections)'
  },
  'PLAID_SECRET': {
    pattern: /^.+$/,
    description: 'Plaid secret (optional, for bank connections)'
  }
};

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  }
  
  return env;
}

function validateEnv() {
  console.log('🔍 Validating .env.local file...\n');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file does not exist!');
    console.error(`   Expected at: ${envPath}`);
    process.exit(1);
  }
  
  const env = parseEnvFile(envPath);
  if (!env) {
    console.error('❌ Failed to parse .env.local file');
    process.exit(1);
  }
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  console.log('📋 Checking required variables:\n');
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = env[key];
    
    if (!value) {
      console.error(`❌ ${key}: MISSING`);
      console.error(`   ${config.description}`);
      hasErrors = true;
      continue;
    }
    
    if (value === '...' || value === 'YOUR_KEY_HERE' || value.includes('xxxxx')) {
      console.error(`❌ ${key}: PLACEHOLDER VALUE`);
      console.error(`   ${config.description}`);
      console.error(`   Current value: ${value}`);
      hasErrors = true;
      continue;
    }
    
    if (config.pattern && !config.pattern.test(value)) {
      console.error(`❌ ${key}: INVALID FORMAT`);
      console.error(`   ${config.description}`);
      console.error(`   Current value: ${value.substring(0, 20)}...`);
      console.error(`   Expected pattern: ${config.pattern}`);
      hasErrors = true;
      continue;
    }
    
    // Special checks
    if (key === 'CLERK_SECRET_KEY' && value.startsWith('sk_test_sk_test_')) {
      console.error(`❌ ${key}: DUPLICATE PREFIX`);
      console.error(`   Value has duplicate 'sk_test_' prefix`);
      console.error(`   Should be: ${value.replace('sk_test_sk_test_', 'sk_test_')}`);
      hasErrors = true;
      continue;
    }
    
    if (key === 'STRIPE_WEBHOOK_SECRET' && value.startsWith('sk_')) {
      console.error(`❌ ${key}: WRONG TYPE`);
      console.error(`   Webhook secret should start with 'whsec_', not 'sk_'`);
      console.error(`   This looks like a Stripe secret key, not a webhook secret`);
      hasErrors = true;
      continue;
    }
    
    console.log(`✅ ${key}: OK`);
  }
  
  // Check optional variables
  console.log('\n📋 Checking optional variables:\n');
  for (const [key, config] of Object.entries(optionalVars)) {
    const value = env[key];
    
    if (!value) {
      console.log(`⚠️  ${key}: NOT SET (optional)`);
      console.log(`   ${config.description}`);
      hasWarnings = true;
      continue;
    }
    
    if (config.pattern && !config.pattern.test(value)) {
      console.warn(`⚠️  ${key}: INVALID FORMAT (optional)`);
      console.warn(`   ${config.description}`);
      hasWarnings = true;
      continue;
    }
    
    console.log(`✅ ${key}: OK`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.error('\n❌ VALIDATION FAILED');
    console.error('   Please fix the errors above before running the app.');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('\n⚠️  VALIDATION PASSED WITH WARNINGS');
    console.warn('   Some optional variables are missing, but the app should work.');
    process.exit(0);
  } else {
    console.log('\n✅ VALIDATION PASSED');
    console.log('   All environment variables are correctly configured!');
    process.exit(0);
  }
}

// Run validation
validateEnv();

