/**
 * Test script for AI Transaction Module
 * Tests key functionality without requiring a full build
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing AI Transaction Module...\n');

const issues = [];
const warnings = [];

// 1. Check AddTransactionModal.tsx
console.log('1. Checking AddTransactionModal.tsx...');
const modalPath = 'apps/web/app/dashboard/components/AddTransactionModal.tsx';
const modalContent = fs.readFileSync(modalPath, 'utf8');

// Check for required imports
if (!modalContent.includes('api.knowledge_base')) {
  issues.push('❌ Missing api.knowledge_base import');
} else {
  console.log('   ✅ Knowledge base API imported');
}

if (!modalContent.includes('saveCorrection')) {
  issues.push('❌ Missing saveCorrection mutation');
} else {
  console.log('   ✅ saveCorrection mutation found');
}

// Check for auto-trigger logic
if (!modalContent.includes('handleManualAITrigger(undefined, undefined, true)')) {
  issues.push('❌ Auto-trigger not properly implemented');
} else {
  console.log('   ✅ Auto-trigger logic found');
}

// Check for AI modal description field
if (!modalContent.includes('aiModalDescription')) {
  issues.push('❌ AI modal description field missing');
} else {
  console.log('   ✅ AI modal description field found');
}

// Check for double-entry toggle
if (!modalContent.includes('showAccountingPreview') || !modalContent.includes('Collapsible')) {
  warnings.push('⚠️  Double-entry toggle may be missing');
} else {
  console.log('   ✅ Double-entry toggle found');
}

// Check for itemized AI
if (!modalContent.includes('handleLineItemAI')) {
  issues.push('❌ Line item AI handler missing');
} else {
  console.log('   ✅ Line item AI handler found');
}

// 2. Check knowledge_base.ts
console.log('\n2. Checking knowledge_base.ts...');
const kbPath = 'convex/knowledge_base.ts';
const kbContent = fs.readFileSync(kbPath, 'utf8');

if (!kbContent.includes('export const saveCorrection')) {
  issues.push('❌ saveCorrection not exported');
} else {
  console.log('   ✅ saveCorrection exported');
}

if (!kbContent.includes('export const getKnowledgePatterns')) {
  issues.push('❌ getKnowledgePatterns not exported');
} else {
  console.log('   ✅ getKnowledgePatterns exported');
}

// 3. Check schema
console.log('\n3. Checking schema.ts...');
const schemaPath = 'convex/schema.ts';
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (!schemaContent.includes('categorization_knowledge')) {
  issues.push('❌ categorization_knowledge table missing from schema');
} else {
  console.log('   ✅ categorization_knowledge table found');
}

// 4. Check AI entries
console.log('\n4. Checking ai_entries.ts...');
const aiPath = 'convex/ai_entries.ts';
const aiContent = fs.readFileSync(aiPath, 'utf8');

if (!aiContent.includes('userDescription')) {
  issues.push('❌ userDescription parameter missing from AI functions');
} else {
  console.log('   ✅ userDescription parameter found');
}

if (!aiContent.includes('isNewCategory')) {
  warnings.push('⚠️  isNewCategory flag may not be fully implemented');
} else {
  console.log('   ✅ isNewCategory flag found');
}

// 5. Check CategorySelector
console.log('\n5. Checking CategorySelector.tsx...');
const catPath = 'apps/web/app/dashboard/components/CategorySelector.tsx';
const catContent = fs.readFileSync(catPath, 'utf8');

if (!catContent.includes('isNewCategory')) {
  warnings.push('⚠️  CategorySelector may not support new category badges');
} else {
  console.log('   ✅ CategorySelector supports new categories');
}

if (!catContent.includes('customCategories')) {
  warnings.push('⚠️  CategorySelector may not load custom categories');
} else {
  console.log('   ✅ CategorySelector loads custom categories');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.length} issue(s):`);
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} warning(s):`);
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  process.exit(issues.length > 0 ? 1 : 0);
}
