# Testing Guide: Enhanced Transaction Flow

## Overview

This guide covers testing the enhanced transaction flow with:
1. **Transaction Memory/Lookup** - Auto-population from similar transactions
2. **Business/Personal Toggle** - Smart categorization
3. **Manual AI Trigger** - Override memory lookup
4. **Alternative Suggestions** - Show when confidence < 70%

---

## Test Scenarios

### Test 1: Transaction Memory Auto-Population

**Goal:** Verify that similar transactions auto-populate fields

**Steps:**
1. Open the app and click the "+" button
2. Create a transaction:
   - Title: "Starbucks Coffee"
   - Amount: $5.50
   - Category: "Food & Drink"
   - Business/Personal: Business
   - Submit
3. Wait for AI suggestion to be generated
4. Click "+" button again
5. Type "Starbucks" in the Title field
6. **Expected:** After typing 3+ characters, category and Business/Personal should auto-populate
7. **Expected:** Green indicator shows "Found similar transaction - fields auto-populated"
8. Amount should remain blank (user enters new amount)
9. Date should default to today

**Success Criteria:**
- ✅ Category auto-populates from previous transaction
- ✅ Business/Personal toggle auto-populates
- ✅ Visual indicator shows auto-population
- ✅ Amount field remains blank
- ✅ Date defaults to today

---

### Test 2: Smart Default Rules

**Goal:** Verify smart heuristics for Business/Personal detection

**Steps:**
1. Click "+" button
2. Type "Office Supplies" in Title (no previous transaction)
3. Select "Expense" type
4. **Expected:** System should suggest "Business" based on keywords
5. Type "Personal Groceries" in Title
6. **Expected:** System might suggest "Personal" or leave unset

**Success Criteria:**
- ✅ Business keywords trigger Business suggestion
- ✅ Heuristics work for common business terms

---

### Test 3: Manual AI Trigger

**Goal:** Verify user can override memory lookup with AI

**Steps:**
1. Create a transaction "Starbucks Coffee" (from Test 1)
2. Click "+" button
3. Type "Starbucks" - fields auto-populate
4. Click "Use AI" button
5. **Expected:** Button changes to "AI Active"
6. **Expected:** Auto-populated fields remain but AI will be used
7. Fill in amount and submit
8. **Expected:** AI suggestion is generated (not skipped)

**Success Criteria:**
- ✅ "Use AI" button appears when similar transaction found
- ✅ Clicking button triggers AI generation
- ✅ Visual feedback shows "AI Active"

---

### Test 4: No Similar Transaction → AI Triggered

**Goal:** Verify AI is automatically triggered when no similar transaction exists

**Steps:**
1. Click "+" button
2. Type "Unique Transaction Name XYZ123" (no previous transaction)
3. Fill in amount: $100
4. Select Business
5. Submit
6. **Expected:** AI suggestion is automatically generated
7. **Expected:** No "Use AI" button needed (AI is default)

**Success Criteria:**
- ✅ AI suggestion generated automatically
- ✅ No manual trigger needed

---

### Test 5: Alternative Suggestions (Low Confidence)

**Goal:** Verify alternatives are shown when confidence < 70%

**Steps:**
1. Create a transaction with ambiguous description:
   - Title: "Payment"
   - Amount: $500
   - Category: (leave blank or use ambiguous category)
2. Submit and wait for AI suggestion
3. Navigate to Transactions page → Approval Queue
4. **Expected:** If confidence < 70%, alternatives section appears
5. **Expected:** Click to expand shows alternative account suggestions
6. **Expected:** Each alternative shows debit/credit accounts and explanation

**Success Criteria:**
- ✅ Alternatives appear when confidence < 70%
- ✅ Alternatives are expandable/collapsible
- ✅ Each alternative shows account names and explanation
- ✅ Alternatives are fetched dynamically (not stored)

---

### Test 6: Business/Personal Toggle Affects AI

**Goal:** Verify Business/Personal flag affects AI categorization

**Steps:**
1. Click "+" button
2. Type "Coffee" in Title
3. Select "Business" toggle
4. Fill amount: $10
5. Submit
6. Check AI suggestion in Approval Queue
7. **Expected:** AI uses Business context for categorization
8. Repeat with "Personal" toggle
9. **Expected:** AI uses Personal context (different categorization)

**Success Criteria:**
- ✅ Business toggle affects AI suggestions
- ✅ Personal toggle affects AI suggestions
- ✅ Different account suggestions based on toggle

---

### Test 7: End-to-End Flow

**Goal:** Test complete flow from transaction creation to approval

**Steps:**
1. Create transaction with memory lookup:
   - Type "Starbucks" (auto-populates)
   - Adjust amount: $6.00
   - Submit
2. Navigate to Transactions → Approval Queue
3. **Expected:** Entry appears with AI suggestion
4. **Expected:** If confidence < 70%, alternatives are shown
5. Review suggestion and explanation
6. Click "Approve"
7. **Expected:** Entry moves to final entries
8. **Expected:** Transaction is categorized correctly

**Success Criteria:**
- ✅ Complete flow works end-to-end
- ✅ Memory lookup → AI suggestion → Approval → Final entry
- ✅ All features work together seamlessly

---

## Edge Cases to Test

### Edge Case 1: Multiple Similar Transactions
- Create multiple "Starbucks" transactions with different categories
- **Expected:** Most recent similar transaction is used for auto-population

### Edge Case 2: Very Low Confidence (< 50%)
- Create ambiguous transaction
- **Expected:** Alternatives are shown with clear indication of uncertainty

### Edge Case 3: No Accounts Available
- Test with no accounts connected
- **Expected:** Clear error message, graceful handling

### Edge Case 4: Network Failure During AI Call
- Simulate network failure
- **Expected:** Falls back to accounting engine, no crash

---

## Performance Testing

### Test: Multiple Transactions in Queue
1. Create 10+ transactions quickly
2. **Expected:** All appear in Approval Queue
3. **Expected:** Alternatives fetched efficiently (not blocking)
4. **Expected:** UI remains responsive

---

## Debugging Tips

### Check Console Logs
- Look for "Found similar transaction" messages
- Check for "Failed to fetch alternatives" warnings
- Verify AI API calls are made when expected

### Check Convex Dashboard
- Verify `findSimilarTransactions` query is working
- Check `getAlternativeSuggestions` action is called
- Verify `isBusiness` flag is stored correctly

### Common Issues

**Issue:** Alternatives not showing
- **Check:** Confidence score is actually < 0.7
- **Check:** `transactionId` exists on entry
- **Check:** Console for errors in `getAlternatives` call

**Issue:** Auto-population not working
- **Check:** Title has 3+ characters
- **Check:** Similar transaction exists in database
- **Check:** `findSimilarTransactions` query returns results

**Issue:** AI not triggered
- **Check:** `useAI` flag is set OR no similar transaction found
- **Check:** `processTransaction` is called
- **Check:** OpenRouter API key is set in Convex

---

## Success Metrics

After testing, verify:
- ✅ Memory lookup reduces AI calls by ~60-80% for repeat transactions
- ✅ Auto-population saves user time (2-3 seconds per transaction)
- ✅ Alternatives shown for 20-30% of low-confidence transactions
- ✅ Business/Personal toggle improves categorization accuracy
- ✅ No crashes or errors in console
- ✅ UI remains responsive with 50+ pending entries

---

## Next Steps After Testing

1. **Performance Optimization:** If alternatives fetching is slow, consider caching
2. **UX Improvements:** Add loading states for alternatives
3. **Analytics:** Track memory lookup hit rate
4. **A/B Testing:** Compare AI usage with/without memory lookup

