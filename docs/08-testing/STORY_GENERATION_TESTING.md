# Comprehensive Story Generation Testing Guide

## Overview

This guide explains how to test AI story generation to ensure 100% pass rate for all story types and periods.

## Prerequisites

1. **Convex Dev Server Running**
   ```bash
   npx convex dev
   ```

2. **Next.js Dev Server Running**
   ```bash
   cd apps/web && pnpm dev
   ```

3. **Environment Variables Set**
   - `OPENROUTER_API_KEY` must be set in Convex dashboard
   - Check: `npx convex env` or Convex dashboard → Settings → Environment Variables

4. **Mock Data Generated**
   - Go to http://localhost:3000/settings
   - Click "Generate 3 Months Mock Data"
   - Wait for completion

## Testing Methods

### Method 1: UI Testing (Recommended for Initial Testing)

1. Navigate to http://localhost:3000/reports
2. Click on "Stories" tab
3. Generate each story type:
   - Company Story (Monthly)
   - Company Story (Quarterly)
   - Banker Story (Monthly)
   - Banker Story (Quarterly)
   - Investor Story (Monthly)
   - Investor Story (Quarterly)

4. For each story, verify:
   - ✅ Story appears in card
   - ✅ Title is present
   - ✅ Summary is present (2-3 sentences)
   - ✅ Key metrics are displayed
   - ✅ "View Full Story" button works
   - ✅ Full narrative is readable
   - ✅ Insight is shown (if available)

5. Test export functionality:
   - Click "View Full Story"
   - Test each export button:
     - PDF download
     - CSV export
     - Email template
     - Shareable link

### Method 2: Terminal Validation (For Existing Stories)

Run the validation script to check all existing stories:

```bash
npx tsx scripts/validate-stories.ts
```

This script will:
- Fetch all stories from database
- Validate each story against quality criteria
- Report pass/fail status
- Show warnings for non-critical issues

**Expected Output:**
```
✅ All stories pass validation!
   ✅ 100% pass rate achieved!
```

### Method 3: Comprehensive Generation Test (Requires Authentication)

For automated testing that generates new stories:

```bash
npx tsx scripts/test-story-generation-comprehensive.ts
```

**Note:** This requires authentication. You'll need to:
1. Get an auth token from your browser session
2. Set it in the script or use Convex's authenticated client

## Quality Criteria

Each story must meet these criteria to pass validation:

### Required Fields
- ✅ **Narrative**: Minimum 100 characters, recommended 300+
- ✅ **Summary**: Minimum 20 characters, recommended 50+
- ✅ **Key Metrics**: At least 1 metric, recommended 3+

### Story-Type-Specific Metrics

**Company Stories:**
- Should include: `burnRate`, `runway`, `cashFlow`, or `revenue`

**Banker Stories:**
- Should include: `debtToRevenue`, `debtToIncome`, or `cashFlow`

**Investor Stories:**
- Should include: `growthRate`, `revenueGrowth`, or `revenue`

### Quality Levels

**Narrative Quality:**
- Excellent: 800+ characters
- Good: 300-800 characters
- Fair: 100-300 characters
- Poor: <100 characters (fails validation)

**Summary Quality:**
- Excellent: 150+ characters
- Good: 50-150 characters
- Fair: 20-50 characters
- Poor: <20 characters (fails validation)

## Validation Script Output

### Successful Validation
```
✅ Company Story - November 2024
   Type: company monthly
   Narrative: 1250 chars (excellent)
   Summary: 180 chars (excellent)
   Key Metrics: 5
   Insight: Yes

✅ Banker Story - Q4 2024
   Type: banker quarterly
   Narrative: 2100 chars (excellent)
   Summary: 220 chars (excellent)
   Key Metrics: 6
   Insight: Yes

📊 Validation Summary
Total Stories: 6
✅ Passed: 6
❌ Failed: 0
⚠️  Warnings: 0

🎉 All stories pass validation with no warnings!
   ✅ 100% pass rate achieved!
```

### Failed Validation
```
❌ Company Story - November 2024
   Type: company monthly
   ❌ Narrative too short: 45 chars (minimum 100)
   ❌ Missing or invalid keyMetrics

📊 Validation Summary
Total Stories: 6
✅ Passed: 4
❌ Failed: 2
⚠️  Warnings: 1

⚠️  Some stories failed validation
```

## Troubleshooting

### Issue: "User not found" error
**Solution:** Ensure you're authenticated. For terminal testing, you may need to:
- Use the UI to generate stories first
- Or set up authentication in the test script

### Issue: "No financial data found"
**Solution:** 
1. Generate mock data: http://localhost:3000/settings
2. Verify data exists in Convex dashboard
3. Check date ranges match your data

### Issue: "OPENROUTER_API_KEY not configured"
**Solution:**
1. Get API key from https://openrouter.ai
2. Set in Convex: `npx convex env set OPENROUTER_API_KEY your_key`
3. Or set in Convex dashboard → Settings → Environment Variables

### Issue: Stories generated but validation fails
**Check:**
- Narrative length (should be 100+ chars)
- Summary length (should be 20+ chars)
- Key metrics exist and are not empty
- Story-type-specific metrics are present

## Automated Testing

For CI/CD or automated testing, you can:

1. **Use the validation script** after stories are generated:
   ```bash
   npx tsx scripts/validate-stories.ts
   ```

2. **Check exit code:**
   - Exit code 0 = All stories pass
   - Exit code 1 = Some stories failed

3. **Integrate into test suite:**
   ```json
   {
     "scripts": {
       "test:stories": "tsx scripts/validate-stories.ts"
     }
   }
   ```

## Best Practices

1. **Generate all story types** for comprehensive testing
2. **Test both monthly and quarterly** periods
3. **Validate immediately after generation** to catch issues early
4. **Check export functionality** for each story type
5. **Monitor for quality degradation** over time
6. **Keep OPENROUTER_API_KEY secure** and never commit it

## Success Criteria

✅ **100% Pass Rate Achieved When:**
- All 6 story types generated (3 types × 2 periods)
- All stories pass validation (no errors)
- All stories have quality narratives (300+ chars)
- All stories have quality summaries (50+ chars)
- All stories have appropriate key metrics
- All export functions work correctly

## Next Steps

After achieving 100% pass rate:

1. ✅ Document any edge cases found
2. ✅ Update validation criteria if needed
3. ✅ Set up automated validation in CI/CD
4. ✅ Monitor story quality over time
5. ✅ Collect user feedback on story quality
