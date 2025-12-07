# Security Audit: Entitlement Guards

**Date**: 2025-12-06  
**Auditor**: AI Assistant  
**Scope**: Marketplace entitlement system and add-on module access controls

---

## Executive Summary

This audit reviews the security of the add-on entitlement system implemented in the Core Product + Add-On Architecture. The focus is on ensuring that:

1. Paid features cannot be accessed without valid entitlement
2. API guards are consistently applied
3. UI guards prevent feature exposure
4. Edge cases are handled correctly

---

## Components Audited

### 1. API-Level Guard: `requireAddon`

**Location**: `convex/marketplace/entitlements.ts`

```typescript
export async function requireAddon(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  moduleSlug: string
): Promise<void>
```

**Security Controls:**
| Check | Status | Notes |
|-------|--------|-------|
| Module enabled check | ✅ Pass | Checks `module_enablements` table |
| Free module bypass | ✅ Pass | Free addons only need enablement |
| Paid entitlement check | ✅ Pass | Checks `org_addons` status |
| Trial expiry check | ✅ Pass | Validates `trialEnd` timestamp |
| Error on failure | ✅ Pass | Throws descriptive error |

**Potential Improvements:**
- Add rate limiting for repeated failed access attempts
- Log failed access attempts for security monitoring

---

### 2. UI-Level Guard: `RequireFeature`

**Location**: `apps/web/app/components/RequireFeature.tsx`

**Security Controls:**
| Check | Status | Notes |
|-------|--------|-------|
| Hides content when disabled | ✅ Pass | Returns `null` or fallback |
| Uses `FeatureContext` | ✅ Pass | Consistent state source |
| Handles loading state | ✅ Pass | Returns null during load |
| Fallback support | ✅ Pass | Shows upgrade prompt |

**Note**: UI guards are defense-in-depth only. API guards are the true security boundary.

---

### 3. Add-On Module Implementation

#### Projects Module (`convex/modules/projects/main.ts`)

| Function | Guard Present | Correct Slug |
|----------|---------------|--------------|
| `list` | ✅ Yes | `project_profitability` |
| `getById` | ✅ Yes | `project_profitability` |
| `create` | ✅ Yes | `project_profitability` |
| `update` | ✅ Yes | `project_profitability` |
| `remove` | ✅ Yes | `project_profitability` |
| `tagTransaction` | ✅ Yes | `project_profitability` |
| `untagTransaction` | ✅ Yes | `project_profitability` |
| `getProfitability` | ✅ Yes | `project_profitability` |

#### Time Tracking Module (`convex/modules/time_tracking/main.ts`)

| Function | Guard Present | Correct Slug |
|----------|---------------|--------------|
| `list` | ✅ Yes | `time_tracking` |
| `getRunningTimer` | ✅ Yes | `time_tracking` |
| `startTimer` | ✅ Yes | `time_tracking` |
| `stopTimer` | ✅ Yes | `time_tracking` |
| `createManual` | ✅ Yes | `time_tracking` |
| `update` | ✅ Yes | `time_tracking` |
| `remove` | ✅ Yes | `time_tracking` |
| `getStats` | ✅ Yes | `time_tracking` |

#### AI Agents Module (`convex/ai_agents.ts`)

| Function | Guard Present | Correct Slug |
|----------|---------------|--------------|
| `generateInvestorStory` | ✅ Yes | `finance_agents` |
| `generateTaxOptimization` | ✅ Yes | `finance_agents` |

---

## Entitlement Status Matrix

| Status | Access Granted | Notes |
|--------|----------------|-------|
| `active` | ✅ Yes | Paid or included in plan |
| `trialing` (valid) | ✅ Yes | Trial not expired |
| `trialing` (expired) | ❌ No | trialEnd < now |
| `expired` | ❌ No | Subscription lapsed |
| `cancelled` | ❌ No | User cancelled |
| Not found | ❌ No | No entitlement record |

---

## Edge Cases Reviewed

### 1. Race Condition: Trial Expiry
**Scenario**: User's trial expires mid-session  
**Behavior**: Next API call will fail with "Trial expired" error  
**Status**: ✅ Handled correctly

### 2. Module Disabled After Purchase
**Scenario**: Org owner disables a purchased module  
**Behavior**: API denies access (enablement check fails)  
**Status**: ✅ Handled correctly

### 3. Missing Addon Registry Entry
**Scenario**: Module slug has no matching addon record  
**Behavior**: Treated as core module (free access if enabled)  
**Status**: ⚠️ By design, but document this behavior

### 4. Concurrent Org Access
**Scenario**: User switches orgs mid-request  
**Behavior**: Each request validates against specific orgId  
**Status**: ✅ Handled correctly (explicit orgId)

---

## Recommendations

### High Priority
1. **Add audit logging**: Log all `requireAddon` denials with timestamp, orgId, userId, and moduleSlug
2. **Webhook validation**: Ensure Stripe webhook signature verification is enforced

### Medium Priority
3. **Rate limiting**: Add rate limiting for failed access attempts
4. **Entitlement cache**: Consider caching entitlements at session level for performance

### Low Priority
5. **Feature usage analytics**: Track feature usage for engagement metrics
6. **Graceful degradation**: Instead of hard errors, consider read-only mode for expired trials

---

## Conclusion

The entitlement guard system is **well-implemented** with consistent security controls across all add-on modules. The layered approach (API guards + UI guards) provides defense-in-depth.

**Overall Security Rating**: ✅ **PASS**

All critical paths are protected. Minor improvements recommended for monitoring and observability.
