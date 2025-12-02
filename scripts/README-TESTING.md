# Testing Stories and Reports Generation

## Comprehensive Test Script

The script `test-stories-and-reports-comprehensive.ts` tests:
1. **AI Story Generation** - Generates all story types (company, banker, investor) for monthly and quarterly periods using LLM
2. **Story Validation** - Ensures each story meets 100% quality criteria
3. **Report Testing** - Tests report data aggregation

## Prerequisites

1. **Convex Dev Server Running**:
   ```bash
   npx convex dev
   ```

2. **Environment Variables**:
   - `OPENROUTER_API_KEY` must be set in Convex environment variables
   - `NEXT_PUBLIC_CONVEX_URL` or `CONVEX_URL` must be set

3. **Authentication**:
   - You need to be authenticated in your browser
   - Or provide authentication token in the script

4. **Mock Data**:
   - The script will generate mock data if needed
   - Or ensure you have financial data in your Convex database

## Running the Test

### Option 1: Using the Test Script (Requires Authentication)

```bash
# Make sure Convex dev is running in another terminal
npx convex dev

# In another terminal, run the test
npx tsx scripts/test-stories-and-reports-comprehensive.ts
```

### Option 2: Using Convex CLI (Alternative)

You can test individual story generation using:

```bash
# Generate Company Story (Monthly)
npx convex run ai_stories:generateCompanyStory \
  '{"periodStart": 1704067200000, "periodEnd": 1706659199999, "periodType": "monthly"}'

# Generate Banker Story (Quarterly)
npx convex run ai_stories:generateBankerStory \
  '{"periodStart": 1696118400000, "periodEnd": 1706659199999, "periodType": "quarterly"}'

# Generate Investor Story (Monthly)
npx convex run ai_stories:generateInvestorStory \
  '{"periodStart": 1704067200000, "periodEnd": 1706659199999, "periodType": "monthly"}'
```

## 100% Pass Criteria

For a story to pass at 100%, it must meet ALL of these criteria:

### Required Fields
- ✅ **Narrative**: Must exist and be at least 300 characters (quality: good or excellent)
- ✅ **Summary**: Must exist and be at least 50 characters (quality: good or excellent)
- ✅ **Key Metrics**: Must have at least 3 metrics
- ✅ **Insight**: Must be present (in keyMetrics.insight or summary)

### Role-Specific Metrics
- **Company Story**: Must have `burnRate`, `runway`, `cashFlow`, or `revenue`
- **Banker Story**: Must have `debtToRevenue`, `debtToIncome`, or `cashFlow`
- **Investor Story**: Must have `growthRate`, `revenueGrowth`, `revenue`, or `ltvCac`

### Quality Levels
- **Narrative Quality**:
  - Excellent: 800+ characters
  - Good: 300-799 characters
  - Fair: 100-299 characters (not acceptable for 100% pass)
  - Poor: <100 characters (not acceptable)

- **Summary Quality**:
  - Excellent: 150+ characters
  - Good: 50-149 characters
  - Fair: 20-49 characters (not acceptable for 100% pass)
  - Poor: <20 characters (not acceptable)

## Expected Output

When all tests pass, you'll see:

```
🎉 All stories and reports passed validation!
   ✅ 100% pass rate achieved!

✨ All stories generated using LLM meet quality criteria:
   • Narrative quality: Good or Excellent
   • Summary quality: Good or Excellent
   • Key metrics: 3+ metrics present
   • Insight: Present
   • Role-specific metrics: Present
```

## Troubleshooting

### "User not found" Error
- Make sure you're authenticated in your browser
- Or set up authentication in the script
- Check that Convex dev server is running

### "OPENROUTER_API_KEY not configured" Error
- Set the API key in Convex environment variables:
  ```bash
  npx convex env set OPENROUTER_API_KEY your_key_here
  ```

### "No financial data found" Error
- Generate mock data first:
  ```bash
  # Via UI: Go to /settings → Data Reset → Generate Mock Data
  # Or the script will attempt to generate it automatically
  ```

### Stories Failing Validation
- Check that the LLM is returning valid JSON
- Verify that financial data exists for the period
- Check network connectivity to OpenRouter API

## Manual Testing via UI

If the script has authentication issues, you can test manually:

1. Start Convex dev: `npx convex dev`
2. Start Next.js: `cd apps/web && pnpm dev`
3. Navigate to: `http://localhost:3000/reports`
4. Go to the "Stories" tab
5. Click "Generate All Stories"
6. Verify each story appears and has:
   - Narrative text
   - Summary
   - Key metrics
   - Insight

## Report Testing

The script also tests these reports:
- Financial Summary (Monthly)
- Profit & Loss
- Cash Flow Statement
- Bank/Lender Report

All reports should return data without errors.
