# Phase 1 Update Guide

This guide explains how to update existing Convex queries and mutations to use the new multi-tenant org context.

## Pattern Overview

### Before (Single-tenant):
```typescript
export const myQuery = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    // Query by userId
    const data = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    return data;
  },
});
```

### After (Multi-tenant):
```typescript
import { getOrgContext } from "./helpers/orgContext";
import { requirePermission, PERMISSIONS } from "./rbac";

export const myQuery = query({
  args: {
    orgId: v.optional(v.id("organizations")), // Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    
    // Check permission (if needed)
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);
    
    // Query by orgId (preferred) or both userId and orgId
    const data = await ctx.db
      .query("accounts")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    
    return data;
  },
});
```

## Step-by-Step Update Process

### 1. Add orgId parameter to args
```typescript
args: {
  // ... existing args
  orgId: v.optional(v.id("organizations")),
}
```

### 2. Replace auth/user lookup with getOrgContext
```typescript
// OLD:
const identity = await ctx.auth.getUserIdentity();
const user = await ctx.db.query("users")...

// NEW:
const { userId, orgId } = await getOrgContext(ctx, args.orgId);
```

### 3. Add permission check (if modifying data or sensitive operations)
```typescript
// For viewing: VIEW_FINANCIALS
// For editing: EDIT_TRANSACTIONS
// For approving: APPROVE_ENTRIES
// For admin: MANAGE_ORG_SETTINGS, etc.

await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);
```

### 4. Update queries to use orgId
```typescript
// OLD: by_user index
.withIndex("by_user", (q) => q.eq("userId", user._id))

// NEW: by_org index (preferred)
.withIndex("by_org", (q) => q.eq("orgId", orgId))

// OR: by_user_org composite index (if needed)
.withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
```

### 5. Update data inserts to include orgId
```typescript
await ctx.db.insert("accounts", {
  userId: userId, // Keep for backward compatibility
  orgId: orgId,    // Add orgId
  // ... other fields
});
```

## Files That Need Updates

### High Priority (Core Functionality):
- [x] `convex/transactions.ts` - Partially updated (getPendingTransactions)
- [ ] `convex/transactions.ts` - Update remaining queries/mutations
- [ ] `convex/accounts.ts` - All account queries
- [ ] `convex/plaid.ts` - Bank connection flows
- [ ] `convex/ai_entries.ts` - AI categorization
- [ ] `convex/ai_stories.ts` - Story generation
- [ ] `convex/startup_metrics.ts` - Burn rate calculations

### Medium Priority (Settings & Data):
- [ ] `convex/businessProfiles.ts` - Business profile management
- [ ] `convex/addresses.ts` - Address management
- [ ] `convex/professionalContacts.ts` - Contact management
- [ ] `convex/receipt_ocr.ts` - Receipt processing
- [ ] `convex/data_reset.ts` - Data reset operations

### Lower Priority (Reports & Analytics):
- [ ] `convex/investor_reports.ts` - Report generation
- [ ] `convex/reports.ts` - General reports

## Permission Mapping

| Operation | Required Permission |
|-----------|-------------------|
| View transactions/accounts | `VIEW_FINANCIALS` |
| Create/edit transactions | `EDIT_TRANSACTIONS` |
| Approve entries | `APPROVE_ENTRIES` |
| Manage org settings | `MANAGE_ORG_SETTINGS` |
| Manage team | `MANAGE_TEAM` |
| Manage subscription | `MANAGE_SUBSCRIPTION` |
| Run data reset | `RUN_APP_RESET` |
| Manage integrations | `MANAGE_INTEGRATIONS` |

## Testing Checklist

After updating each file:
- [ ] Query returns only data for the specified org
- [ ] Permission checks work correctly
- [ ] Non-members cannot access org data
- [ ] Super admins can access any org (Phase 2)
- [ ] Org switching works correctly (frontend)

## Migration Notes

- All existing data will be migrated via `migrations/phase1_multi_tenant.ts`
- During migration period, both `userId` and `orgId` are supported
- After migration, prefer `orgId` for all new queries
- Keep `userId` in inserts for backward compatibility during transition

## Example: Complete Update

Here's a complete example of updating a query:

```typescript
// BEFORE
export const getAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// AFTER
import { getOrgContext } from "./helpers/orgContext";
import { requirePermission, PERMISSIONS } from "./rbac";

export const getAccounts = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);
    
    return await ctx.db
      .query("accounts")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});
```

## Next Steps

1. Update high-priority files first
2. Test each update thoroughly
3. Update frontend to pass `orgId` in queries
4. Run migration script after all updates
5. Monitor for any issues with org context resolution
