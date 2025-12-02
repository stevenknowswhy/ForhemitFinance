# Phase 1 Testing Guide

This guide will help you test the Phase 1 multi-tenant implementation before continuing with query updates.

## Prerequisites

1. **Environment Setup**
   - Convex dev server running (`npx convex dev`)
   - Next.js dev server running (`npm run dev` or `pnpm dev`)
   - Clerk authentication configured
   - At least one test user account

2. **Before Testing**
   - Review the schema changes in `convex/schema.ts`
   - Ensure all new files are deployed to Convex
   - Check that frontend builds without errors

## Testing Checklist

### 1. Schema Validation

**Test:** Verify new tables exist and schema is valid

```bash
# In Convex dashboard or via CLI
# Check that these tables exist:
- organizations
- memberships
- plans
- subscriptions
- audit_logs
- impersonation_sessions (for Phase 2)
```

**Expected:** All tables should exist with correct fields and indexes.

---

### 2. Migration Script Testing

**Test:** Run migration script to create default plans

**Steps:**
1. Open Convex dashboard
2. Go to Functions tab
3. Find `migrations.phase1_multi_tenant.createDefaultPlans`
4. Run with empty args: `{}`
5. Check result

**Expected Result:**
```json
{
  "created": 3,
  "planIds": ["...", "...", "..."]
}
```

**Test:** Run migration to convert users to orgs

**Steps:**
1. Ensure you have at least one user in the database
2. Run `migrations.phase1_multi_tenant.migrateUsersToOrgs` with `{}`
3. Check result

**Expected Result:**
```json
{
  "migrated": 1,
  "skipped": 0,
  "total": 1
}
```

**Verify:**
- Check `organizations` table - should have one org per user
- Check `memberships` table - should have ORG_OWNER membership for each user
- Check `subscriptions` table - should have subscription for each org

**Test:** Run data migration

**Steps:**
1. Ensure you have some existing data (accounts, transactions, etc.)
2. Run `migrations.phase1_multi_tenant.migrateDataToOrgScoped` with `{}`
3. Check result

**Expected Result:**
```json
{
  "accounts": { "updated": X, "skipped": Y },
  "transactions_raw": { "updated": X, "skipped": Y },
  // ... other tables
}
```

**Verify:**
- Check a few records in `accounts` table - should have `orgId` set
- Check `transactions_raw` - should have `orgId` set
- Verify data integrity (no data loss)

---

### 3. Permission System Testing

**Test:** Verify permission constants

**Steps:**
1. In Convex dashboard, check `permissions.ts` exports
2. Verify role-to-permission mappings

**Expected:**
- ORG_OWNER has all permissions
- ORG_ADMIN has most permissions (except delete org)
- BOOKKEEPER has VIEW_FINANCIALS, EDIT_TRANSACTIONS, APPROVE_ENTRIES
- VIEWER has only VIEW_FINANCIALS

**Test:** Test permission checking

**Steps:**
1. Create a test query that uses `requirePermission`
2. Test with different roles
3. Verify access is granted/denied correctly

---

### 4. Organization Context Testing

**Test:** Get user organizations

**Steps:**
1. In Convex dashboard, run `organizations.getUserOrganizations`
2. Pass your userId: `{ userId: "your-user-id" }`

**Expected:**
- Returns array of organizations user belongs to
- Each org includes role and membershipId

**Test:** Get current org

**Steps:**
1. Run `organizations.getCurrentOrg`
2. Pass: `{ userId: "your-user-id", orgId: "your-org-id" }`

**Expected:**
- Returns org details with role
- If orgId not provided, returns first active org

**Test:** Create new organization

**Steps:**
1. Run `organizations.createOrganization`
2. Pass:
```json
{
  "name": "Test Org",
  "type": "business",
  "baseCurrency": "USD",
  "ownerUserId": "your-user-id"
}
```

**Expected:**
- Returns `{ orgId: "..." }`
- Creates org with status "active"
- Creates membership with role "ORG_OWNER"
- Creates subscription (if plans exist)

---

### 5. Frontend Testing

**Test:** Org Context Provider

**Steps:**
1. Start Next.js dev server
2. Sign in with Clerk
3. Open browser console
4. Check for errors

**Expected:**
- No errors in console
- Org context loads successfully
- User's organizations are fetched

**Test:** Org Switcher Component

**Steps:**
1. Navigate to dashboard (or any page with navigation)
2. Look for org switcher in header
3. Click on org switcher dropdown

**Expected:**
- Dropdown shows user's organizations
- Current org is selected
- Can switch between orgs
- Selection persists after page refresh

**Test:** Route Protection

**Steps:**
1. Navigate to `/dashboard`
2. Check if `OrgRouteGuard` works
3. Try accessing without org selected

**Expected:**
- If no orgs: redirects to onboarding
- If orgs exist but none selected: auto-selects first
- If org selected: page loads normally

**Test:** Data Filtering by Org

**Steps:**
1. Select an org
2. Navigate to dashboard
3. Check if data shown is for selected org
4. Switch org
5. Verify data changes

**Expected:**
- Dashboard shows data only for selected org
- Switching org updates all data
- No cross-org data leakage

---

### 6. Updated Queries Testing

**Test:** `getPendingTransactions`

**Steps:**
1. Ensure you have some pending entries
2. In Convex dashboard, run `transactions.getPendingTransactions`
3. Pass: `{ orgId: "your-org-id" }`

**Expected:**
- Returns only pending entries for the org
- Includes transaction and account details
- Respects filterType if provided

**Test:** `accounts.getAll`

**Steps:**
1. Run `accounts.getAll`
2. Pass: `{ orgId: "your-org-id" }`

**Expected:**
- Returns only accounts for the org
- Permission check passes (VIEW_FINANCIALS)

**Test:** `onboarding.completeOnboarding`

**Steps:**
1. Sign out
2. Sign up as new user
3. Complete onboarding flow

**Expected:**
- Creates user record
- Creates organization
- Creates membership (ORG_OWNER)
- Creates subscription
- Creates default accounts (with orgId)

---

### 7. Audit Logging Testing

**Test:** Log org creation

**Steps:**
1. Create a new org (via `createOrganization`)
2. Check `audit_logs` table

**Expected:**
- Audit log entry created
- Action: "ORG_CREATED"
- Includes orgId, actorUserId, metadata

**Test:** Query audit logs

**Steps:**
1. Create some audit events
2. Query `audit_logs` table

**Expected:**
- Can filter by orgId
- Can filter by action
- Can filter by actorUserId
- Results ordered by createdAt (desc)

---

### 8. Error Handling Testing

**Test:** Access without org

**Steps:**
1. Try to access a query that requires orgId
2. Don't pass orgId (or pass invalid one)

**Expected:**
- Returns error: "User has no active organizations" or similar
- Error is clear and actionable

**Test:** Access with wrong org

**Steps:**
1. Try to access org data with orgId user doesn't belong to

**Expected:**
- Returns error: "User is not a member of this organization"
- Permission denied

**Test:** Permission denied

**Steps:**
1. Create a user with VIEWER role
2. Try to edit transactions

**Expected:**
- Returns error: "User does not have permission: EDIT_TRANSACTIONS"
- Clear error message

---

### 9. Integration Testing

**Test:** End-to-end flow

**Steps:**
1. Sign up as new user
2. Complete onboarding
3. Create some accounts
4. Add transactions
5. Switch to different org (if you have multiple)
6. Verify data isolation

**Expected:**
- All steps complete successfully
- Data is properly scoped to org
- No cross-org data visible
- Org switching works smoothly

**Test:** Multiple users, same org

**Steps:**
1. Create org
2. Invite second user (manually create membership)
3. Both users access same org
4. Verify both see same data

**Expected:**
- Both users can access org
- Both see same accounts/transactions
- Permissions work correctly for each role

---

## Common Issues & Solutions

### Issue: "User has no active organizations"

**Solution:**
- Run migration script to create orgs for existing users
- Or manually create org via `createOrganization`

### Issue: "Organization context required"

**Solution:**
- Ensure user has at least one active membership
- Check that orgId is being passed correctly
- Verify org status is "active"

### Issue: Frontend org context not loading

**Solution:**
- Check browser console for errors
- Verify Convex queries are working
- Check that `getCurrentUser` returns user
- Verify `getUserOrganizations` returns orgs

### Issue: Migration script fails

**Solution:**
- Ensure default plans exist before migrating users
- Check that users exist in database
- Verify schema is deployed correctly

### Issue: Data not showing after migration

**Solution:**
- Verify `orgId` was set on records
- Check that queries are using `by_org` index
- Ensure orgId is being passed to queries

---

## Testing Script

Here's a quick test script you can run in Convex dashboard:

```javascript
// 1. Create default plans
await ctx.runMutation(api.migrations.phase1_multi_tenant.createDefaultPlans, {});

// 2. Migrate users to orgs
await ctx.runMutation(api.migrations.phase1_multi_tenant.migrateUsersToOrgs, {});

// 3. Migrate data
await ctx.runMutation(api.migrations.phase1_multi_tenant.migrateDataToOrgScoped, {});

// 4. Get your user ID
const user = await ctx.runQuery(api.users.getCurrentUser, {});

// 5. Get your organizations
const orgs = await ctx.runQuery(api.organizations.getUserOrganizations, { userId: user._id });

// 6. Test getting accounts
const accounts = await ctx.runQuery(api.accounts.getAll, { orgId: orgs[0]._id });

// 7. Check audit logs
const logs = await ctx.runQuery(api.audit.getAuditLogs, { orgId: orgs[0]._id, limit: 10 });
```

---

## Next Steps After Testing

Once testing is complete:

1. **Fix any issues found**
2. **Update remaining queries** (see `PHASE1_UPDATE_GUIDE.md`)
3. **Add more test coverage**
4. **Deploy to production** (when ready)

---

## Questions to Answer

After testing, you should be able to answer:

- ✅ Can users be migrated to orgs successfully?
- ✅ Does org context resolution work correctly?
- ✅ Are permissions enforced properly?
- ✅ Is data properly isolated by org?
- ✅ Does the frontend org switcher work?
- ✅ Can users switch between orgs?
- ✅ Are audit logs being created?
- ✅ Do updated queries work with orgId?

If all answers are "yes", you're ready to continue updating more queries!
