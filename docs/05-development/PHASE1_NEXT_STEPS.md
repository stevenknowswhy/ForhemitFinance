# Phase 1 - Next Steps & Quick Reference

## ✅ What's Done

The foundation is complete! You now have:
- Multi-tenant schema with orgId on all tables
- RBAC permission system
- Org context resolution
- Frontend org switcher
- Route protection
- Migration script ready

## 🚀 Immediate Next Steps

### 1. Test the Foundation (Before Migration)

```bash
# Start your dev server
npm run dev

# Test these flows:
# 1. Sign up a new user → Should create org automatically
# 2. Switch orgs (if you have multiple)
# 3. Verify data is org-scoped
```

### 2. Run Migration (When Ready)

**Important:** Only run after testing foundation!

```typescript
// In Convex dashboard or via action:
import { api } from "./_generated/api";

// Step 1: Create default plans
await ctx.runMutation(api.migrations.phase1_multi_tenant.createDefaultPlans, {});

// Step 2: Migrate users to orgs
await ctx.runMutation(api.migrations.phase1_multi_tenant.migrateUsersToOrgs, {});

// Step 3: Migrate data to org-scoped
await ctx.runMutation(api.migrations.phase1_multi_tenant.migrateDataToOrgScoped, {});

// OR run all at once:
await ctx.runMutation(api.migrations.phase1_multi_tenant.runPhase1Migration, {});
```

### 3. Update Remaining Queries

Follow the pattern in `PHASE1_UPDATE_GUIDE.md`. Quick reference:

**Pattern:**
```typescript
// 1. Add orgId to args
args: {
  orgId: v.optional(v.id("organizations")),
}

// 2. Use getOrgContext
const { userId, orgId } = await getOrgContext(ctx, args.orgId);

// 3. Check permission (if needed)
await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

// 4. Query by orgId
.withIndex("by_org", (q) => q.eq("orgId", orgId))
```

## 📝 Quick Reference

### Backend Helpers

```typescript
// Get org context
import { getOrgContext } from "./helpers/orgContext";
const { userId, orgId } = await getOrgContext(ctx, args.orgId);

// Check permissions
import { requirePermission, PERMISSIONS } from "./rbac";
await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

// Log audit events
import { logAuditEvent } from "./audit";
await logAuditEvent(ctx, { orgId, actorUserId: userId, action: "..." });
```

### Frontend Hooks

```typescript
// Get orgId (throws if not available)
import { useOrgId } from "../hooks/useOrgId";
const orgId = useOrgId();

// Get orgId safely (returns null)
import { useOrgIdOptional } from "../hooks/useOrgId";
const orgId = useOrgIdOptional();

// Full org context
import { useOrgContext } from "../contexts/OrgContext";
const { currentOrgId, currentOrg, userRole, userOrganizations } = useOrgContext();
```

### Route Protection

```typescript
import { OrgRouteGuard } from "../components/OrgRouteGuard";

export default function MyPage() {
  return (
    <OrgRouteGuard>
      <MyPageContent />
    </OrgRouteGuard>
  );
}
```

## 🔍 Testing Checklist

- [ ] New user signup creates org
- [ ] Org switcher appears in navigation
- [ ] Switching orgs updates data
- [ ] Permission checks work (try as different roles)
- [ ] Tenant isolation (user can't see other org's data)
- [ ] Route protection redirects when no org
- [ ] Migration script runs successfully
- [ ] Data integrity after migration

## 🐛 Troubleshooting

### "No organization selected"
- Check `OrgContextProvider` is in layout
- Verify user has at least one org
- Check localStorage for `currentOrgId`

### "User is not a member of this organization"
- Verify membership exists in `memberships` table
- Check membership status is "active"
- Ensure orgId matches in query

### Migration issues
- Check console for errors
- Verify plans exist before migrating users
- Run migrations in order (plans → users → data)

## 📚 Documentation

- `MULTI_TENANT_BUILD_PLAN.md` - Full 3-phase plan
- `PHASE1_UPDATE_GUIDE.md` - How to update queries
- `PHASE1_PROGRESS.md` - Progress tracking
- `PHASE1_COMPLETION_SUMMARY.md` - What's done

## 🎯 Priority Order for Updates

1. **Critical paths:**
   - Transaction approval flow
   - Bank connection (Plaid)
   - Dashboard analytics

2. **High usage:**
   - Account management
   - Transaction listing
   - AI categorization

3. **Settings:**
   - Business profiles
   - Addresses
   - Professional contacts

4. **Reports:**
   - Investor reports
   - AI stories
   - Analytics

---

**You're ready to continue!** The foundation is solid. Update queries incrementally as you work on features.
