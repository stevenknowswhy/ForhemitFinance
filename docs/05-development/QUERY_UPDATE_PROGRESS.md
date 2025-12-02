# Query Update Progress - Phase 1

**Last Updated:** 2025-01-30

## ✅ Updated Queries/Mutations

### Core Transaction Functions
- [x] `transactions.getPendingTransactions` - Updated with org context
- [x] `transactions.approveEntry` - Updated with org context + permission check
- [x] `transactions.rejectEntry` - Updated with org context + permission check
- [x] `transactions.processTransaction` - Updated with org context
- [x] `transactions.createRaw` - Updated with org context
- [x] `transactions.updateTransaction` - Updated with org context
- [x] `transactions.deleteTransaction` - Updated with org context
- [x] `transactions.getById` - Updated with org context

### Account Management
- [x] `accounts.getAll` - Updated with org context
- [x] `accounts.getByInstitution` - Updated with org context

### Plaid Integration
- [x] `plaid.exchangePublicToken` - Updated with org context
- [x] `plaid.storeInstitution` - Updated with org context + permission check

### Startup Metrics
- [x] `startup_metrics.getBurnRate` - Updated with org context
- [x] `startup_metrics.getRunway` - Updated with org context
- [x] `startup_metrics.getTopSpendCategories` - Updated with org context

### Onboarding
- [x] `onboarding.completeOnboarding` - Creates org for new users

## 🚧 Remaining Queries to Update

### High Priority

#### Transactions
- [x] `transactions.processTransaction` - ✅ Updated
- [x] `transactions.createRaw` - ✅ Updated
- [x] `transactions.updateTransaction` - ✅ Updated
- [x] `transactions.deleteTransaction` - ✅ Updated
- [x] `transactions.getById` - ✅ Updated
- [ ] `transactions.getByPlaidId` - Get transaction by Plaid ID
- [ ] `transactions.findSimilarTransactions` - Find similar transactions

#### AI Entries
- [ ] `ai_entries.inferCategoryWithAI` - AI category inference (action, may not need orgId)
- [ ] `ai_entries.generateAISuggestions` - Generate AI suggestions
- [x] `ai_entries.suggestDoubleEntry` - ✅ Updated
- [x] `ai_entries.createProposedEntry` - ✅ Updated
- [x] `ai_entries.getBusinessContext` - ✅ Updated
- [x] `ai_entries.getAlternativeSuggestions` - ✅ Updated

#### Plaid
- [ ] `plaid.syncAccounts` - Sync accounts from Plaid
- [ ] `plaid.syncTransactions` - Sync transactions from Plaid
- [ ] `plaid.syncTransactionsByItemId` - Sync by item ID

### Medium Priority

#### Receipts
- [ ] `transactions.createReceipt` - Create receipt
- [ ] `transactions.getReceiptsByTransaction` - Get receipts
- [ ] `transactions.getUserReceipts` - Get user receipts

#### Business Profiles
- [ ] `businessProfiles.*` - All business profile queries

#### Addresses
- [ ] `addresses.*` - All address queries

#### Professional Contacts
- [ ] `professionalContacts.*` - All contact queries

### Lower Priority

#### Reports
- [ ] `investor_reports.*` - Investor report generation
- [ ] `reports.*` - General reports

#### AI Stories
- [ ] `ai_stories.*` - Story generation (may already be updated)

## Update Pattern

For each query/mutation:

1. **Add orgId parameter:**
   ```typescript
   args: {
     // ... existing args
     orgId: v.optional(v.id("organizations")),
   }
   ```

2. **Replace auth/user lookup:**
   ```typescript
   // OLD:
   const identity = await ctx.auth.getUserIdentity();
   const user = await ctx.db.query("users")...
   
   // NEW:
   const { userId, orgId } = await getOrgContext(ctx, args.orgId);
   ```

3. **Add permission check:**
   ```typescript
   await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);
   ```

4. **Update queries to use orgId:**
   ```typescript
   // OLD: by_user index
   .withIndex("by_user", (q) => q.eq("userId", user._id))
   
   // NEW: by_org index
   .withIndex("by_org", (q) => q.eq("orgId", orgId))
   ```

5. **Update inserts to include orgId:**
   ```typescript
   await ctx.db.insert("table", {
     userId: userId, // Keep for backward compatibility
     orgId: orgId,   // Add orgId
     // ... other fields
   });
   ```

## Notes

- All updates maintain backward compatibility (orgId is optional)
- Permission checks use appropriate permissions (VIEW_FINANCIALS, EDIT_TRANSACTIONS, etc.)
- Queries verify data belongs to org before returning
- Inserts include both userId and orgId during transition

## Next Steps

1. Continue updating high-priority queries
2. Test each update as you go
3. Update frontend to pass orgId to queries
4. Run migration script when ready
