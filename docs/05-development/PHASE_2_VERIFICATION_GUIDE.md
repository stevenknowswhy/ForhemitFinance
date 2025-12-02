# Phase 2 AI Stories - Verification Guide

## Overview

This guide provides step-by-step instructions for verifying that Phase 2 AI Stories implementation is working correctly. Follow these steps in order to ensure all features are functional.

## Prerequisites

1. ✅ Build completed successfully (`pnpm build`)
2. ✅ Convex backend is running (`npx convex dev`)
3. ✅ Next.js app is running (`pnpm dev`)
4. ✅ User is authenticated and has completed onboarding
5. ✅ OpenRouter API key is configured in Convex environment variables

---

## Step 1: Generate Mock Data

### Purpose
Generate 3 months of mock financial data (business and personal) to use for testing AI stories.

### Steps

1. **Navigate to Settings**
   - Go to `/settings` in your browser
   - Scroll to "Development & Testing Tools" section

2. **Generate Mock Data**
   - Click "Generate 3 Months Mock Data" button
   - In the dialog:
     - ✅ Check "Include Business Data" (default: checked)
     - ✅ Check "Include Personal Data" (default: checked)
   - Click "Generate Mock Data"
   - Wait for generation to complete (may take 30-60 seconds)

3. **Verify Generation Success**
   - Check for success message showing transaction and entry counts
   - Verify status shows:
     - Total transactions > 0
     - Business transactions > 0
     - Personal transactions > 0

### Expected Results

- ✅ Success message displayed
- ✅ Mock data status shows:
  - Total transactions: ~100-200 (distributed over 3 months)
  - Business transactions: ~50-100
  - Personal transactions: ~50-100
- ✅ No error messages in console

### Verification Checklist

- [ ] Mock data generation completes without errors
- [ ] Status shows both business and personal transactions
- [ ] Date range spans approximately 3 months (90 days)
- [ ] Transactions appear in dashboard transaction list

---

## Step 2: Verify Mock Data Quality

### Purpose
Ensure mock data follows double-entry accounting principles and has correct structure.

### Steps

1. **Check Transactions**
   - Go to Dashboard (`/dashboard`)
   - View transaction list
   - Verify:
     - Transactions have proper categories
     - Dates are distributed across 3 months
     - Business and personal transactions are separate

2. **Check Double-Entry Accounting**
   - For each transaction, verify:
     - Entry exists in `entries_proposed` or `entries_final`
     - Entry has 2 `entry_lines` (one debit, one credit)
     - Debit amount = Credit amount

3. **Check Account Balances**
   - Verify account balances are calculated correctly
   - Business and personal accounts should have separate balances

### Verification Checklist

- [ ] All transactions have corresponding entries
- [ ] All entries have debits equal to credits
- [ ] Account balances are correct
- [ ] Business and personal data are separate
- [ ] Date ranges are correct (3 months)

---

## Step 3: Test AI Story Generation

### Purpose
Generate AI stories using the mock data to verify the story generation functionality.

### Steps

1. **Navigate to Reports Tab**
   - Go to `/reports`
   - Click on "Stories" tab

2. **Generate Company Story**
   - Click "Generate Story" button
   - In the dialog:
     - Story Type: Select "Company"
     - Period Type: Select "Monthly"
     - Start Date: Select date from 3 months ago
     - End Date: Select date from 2 months ago
   - Click "Generate"
   - Wait for generation (may take 30-60 seconds)

3. **Verify Story Generation**
   - Story card should appear in the list
   - Story should have:
     - Title
     - Summary
     - Period information
     - Key metrics

4. **Generate Banker Story**
   - Repeat steps 2-3 with:
     - Story Type: "Banker"
     - Period Type: "Monthly"

5. **Generate Investor Story**
   - Repeat steps 2-3 with:
     - Story Type: "Investor"
     - Period Type: "Monthly"

### Expected Results

- ✅ All three story types generate successfully
- ✅ Stories appear in the Stories tab
- ✅ Each story has:
  - Title
  - Summary (short preview)
  - Narrative (full text)
  - Key metrics
  - Period information

### Verification Checklist

- [ ] Company story generates successfully
- [ ] Banker story generates successfully
- [ ] Investor story generates successfully
- [ ] Stories are saved to database
- [ ] Stories display correctly in UI
- [ ] Key metrics are included
- [ ] Period information is correct

---

## Step 4: Test Story Viewing

### Purpose
Verify that stories can be viewed in detail.

### Steps

1. **View Story Details**
   - Click on any story card in the Stories tab
   - Story view dialog should open

2. **Verify Story Content**
   - Full narrative is displayed
   - Key metrics are shown
   - Period information is correct
   - Story type is indicated

3. **Test User Notes**
   - Click "Add Notes" or edit notes field
   - Add some test notes
   - Save notes
   - Verify notes are saved and displayed

### Verification Checklist

- [ ] Story view opens correctly
- [ ] Full narrative is displayed
- [ ] Key metrics are visible
- [ ] User notes can be added and saved
- [ ] Notes persist after refresh

---

## Step 5: Test Export Functionality

### Purpose
Verify that stories can be exported in different formats.

### Steps

1. **Export CSV**
   - Open a story view
   - Click "Export" button
   - Select "CSV" format
   - Verify CSV file downloads or data is displayed

2. **Export Email (HTML)**
   - Click "Export" button
   - Select "Email" format
   - Verify HTML content is generated

3. **Export PDF**
   - Click "Export" button
   - Select "PDF" format
   - Verify PDF data structure is prepared (may need client-side PDF generation)

4. **Generate Shareable Link**
   - Click "Export" button
   - Select "Shareable Link"
   - Verify link is generated (if implemented)

### Verification Checklist

- [ ] CSV export works
- [ ] Email (HTML) export works
- [ ] PDF export prepares data correctly
- [ ] Shareable link generation works (if implemented)

---

## Step 6: Test Auto-Generation (Optional)

### Purpose
Verify that scheduled story generation is configured (requires cron jobs to be enabled).

### Steps

1. **Check Cron Configuration**
   - Open `convex/crons.ts`
   - Verify cron jobs are uncommented (if ready)
   - Note: Cron jobs should be enabled after manual testing is complete

2. **Manual Trigger (for testing)**
   - Can manually trigger scheduled actions if needed
   - Verify stories are generated automatically

### Verification Checklist

- [ ] Cron jobs are configured (when ready)
- [ ] Auto-generation works (when enabled)

---

## Troubleshooting

### Mock Data Generation Fails

**Issue**: Error during mock data generation

**Solutions**:
- Check console for error messages
- Verify user is authenticated
- Check Convex backend is running
- Verify personal accounts are created

### Story Generation Fails

**Issue**: Error during story generation

**Solutions**:
- Check OpenRouter API key is configured
- Verify mock data exists for the selected period
- Check console for API errors
- Verify period dates are valid

### Stories Not Displaying

**Issue**: Stories don't appear in UI

**Solutions**:
- Check browser console for errors
- Verify stories exist in database (check Convex dashboard)
- Check user authentication
- Verify query functions are working

### Export Fails

**Issue**: Export doesn't work

**Solutions**:
- Check browser console for errors
- Verify story data is complete
- Check export function implementation

---

## Next Steps After Verification

Once all verification steps are complete:

1. ✅ Enable cron jobs in `convex/crons.ts` for auto-generation
2. ✅ Implement full unit/integration tests
3. ✅ Add error handling improvements
4. ✅ Optimize story generation performance
5. ✅ Add user feedback/notifications

---

## Success Criteria

All features are working correctly when:

- ✅ Mock data generates successfully
- ✅ Double-entry accounting is accurate
- ✅ All three story types generate successfully
- ✅ Stories display correctly in UI
- ✅ User notes can be added and saved
- ✅ Export functionality works
- ✅ No console errors
- ✅ No build errors

---

**Last Updated**: After Phase 2 Implementation
**Status**: Ready for Verification
