# Multi-Tenant Architecture Build Plan

**Status:** Planning Phase  
**Last Updated:** 2025-01-30

This document outlines the concrete implementation plan for transforming EZ Financial from a single-tenant application to a multi-tenant SaaS platform with role-based access control (RBAC), Super Admin capabilities, and organization-level administration.

---

## Overview

The build is structured in three phases:

1. **Phase 1 – Shared Foundation** (Multi-tenant + RBAC + Audit)
2. **Phase 2 – Minimal Super Admin** (Internal team tools)
3. **Phase 3 – Full Admin / Team Backend** (Customer-facing org management)

Each phase builds on the previous one and can be deployed independently once complete.

---

## Phase 1 – Shared Foundation

### 1. Goals

- One clean model for:
  - Users
  - Organizations (companies/workspaces)
  - Memberships (user ↔ org relationships)
  - Roles & permissions
  - Subscriptions / plans
  - Audit logs
- All routes and data access are **tenant-safe** and **role-aware**
- This becomes the spine for **both** Super Admin and Org Admin

### 2. Key Design Decisions

#### 2.1. Tenant Model

**Organization Table:**
```typescript
organizations: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("business"),
    v.literal("personal")
  ),
  status: v.union(
    v.literal("active"),
    v.literal("trial"),
    v.literal("suspended"),
    v.literal("deleted")
  ),
  baseCurrency: v.string(),
  fiscalYearStart: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status"])
```

**Migration Strategy:**
- Existing `users` become the first org owner
- Create a default organization for each existing user
- Migrate all `userId` references to `orgId` where appropriate
- Keep `userId` for personal preferences, but add `orgId` to all financial data

#### 2.2. User & Membership

**User Table (enhanced):**
```typescript
users: defineTable({
  email: v.string(),
  name: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("disabled")
  ),
  isSuperAdmin: v.optional(v.boolean()), // Phase 2
  createdAt: v.number(),
  // Keep existing fields for backward compatibility
  // ... existing preferences, businessType, etc.
})
```

**Membership Table (new):**
```typescript
memberships: defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),
  role: v.union(
    v.literal("ORG_OWNER"),
    v.literal("ORG_ADMIN"),
    v.literal("BOOKKEEPER"),
    v.literal("VIEWER")
  ),
  invitedBy: v.optional(v.id("users")),
  invitedAt: v.optional(v.number()),
  joinedAt: v.optional(v.number()),
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("disabled")
  ),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_org", ["orgId"])
  .index("by_user_org", ["userId", "orgId"])
```

#### 2.3. Permissions Vocabulary (RBAC)

**Permission Enum:**
```typescript
export const PERMISSIONS = {
  // Organization management
  MANAGE_ORG_SETTINGS: "MANAGE_ORG_SETTINGS",
  MANAGE_TEAM: "MANAGE_TEAM",
  MANAGE_SUBSCRIPTION: "MANAGE_SUBSCRIPTION",
  
  // Financial data
  VIEW_FINANCIALS: "VIEW_FINANCIALS",
  EDIT_TRANSACTIONS: "EDIT_TRANSACTIONS",
  APPROVE_ENTRIES: "APPROVE_ENTRIES",
  
  // Advanced operations
  RUN_APP_RESET: "RUN_APP_RESET",
  MANAGE_INTEGRATIONS: "MANAGE_INTEGRATIONS",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

**Role-to-Permission Mapping:**
```typescript
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ORG_OWNER: [
    PERMISSIONS.MANAGE_ORG_SETTINGS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
    PERMISSIONS.RUN_APP_RESET,
    PERMISSIONS.MANAGE_INTEGRATIONS,
  ],
  ORG_ADMIN: [
    PERMISSIONS.MANAGE_ORG_SETTINGS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
    PERMISSIONS.MANAGE_INTEGRATIONS,
  ],
  BOOKKEEPER: [
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
  ],
  VIEWER: [
    PERMISSIONS.VIEW_FINANCIALS,
  ],
};
```

#### 2.4. Subscriptions / Plans

**Plan Table:**
```typescript
plans: defineTable({
  name: v.string(), // "starter", "pro", "enterprise"
  displayName: v.string(),
  limits: v.object({
    maxUsers: v.optional(v.number()),
    maxTransactions: v.optional(v.number()),
    features: v.array(v.string()), // ["ai_stories", "advanced_reports", etc.]
  }),
  priceMonthly: v.optional(v.number()),
  priceYearly: v.optional(v.number()),
  isActive: v.boolean(),
  createdAt: v.number(),
})
```

**Subscription Table:**
```typescript
subscriptions: defineTable({
  orgId: v.id("organizations"),
  planId: v.id("plans"),
  status: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("suspended")
  ),
  trialEndsAt: v.optional(v.number()),
  renewsAt: v.optional(v.number()),
  canceledAt: v.optional(v.number()),
  stripeSubscriptionId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_status", ["status"])
```

#### 2.5. Audit Log

**AuditLog Table:**
```typescript
audit_logs: defineTable({
  orgId: v.optional(v.id("organizations")), // Nullable for global/super actions
  actorUserId: v.id("users"),
  actorRole: v.optional(v.string()), // Role at time of action
  action: v.string(), // "ORG_UPDATED", "USER_INVITED", "SUBSCRIPTION_CHANGED", etc.
  targetType: v.optional(v.string()), // "organization", "user", "subscription", etc.
  targetId: v.optional(v.string()), // ID of the target
  metadata: v.optional(v.any()), // JSON snapshot of changes
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  isImpersonation: v.optional(v.boolean()), // Phase 2
  impersonatedUserId: v.optional(v.id("users")), // Phase 2
  createdAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_actor", ["actorUserId"])
  .index("by_action", ["action"])
  .index("by_created", ["createdAt"])
```

### 3. Implementation Checklist (Phase 1)

#### Backend (Convex)

**Schema Updates:**
- [ ] Add `organizations` table to schema
- [ ] Add `memberships` table to schema
- [ ] Add `plans` table to schema
- [ ] Add `subscriptions` table to schema
- [ ] Add `audit_logs` table to schema
- [ ] Add `isSuperAdmin` field to `users` table (optional, for Phase 2)
- [ ] Add `orgId` field to all financial tables:
  - [ ] `accounts`
  - [ ] `transactions_raw`
  - [ ] `entries_proposed`
  - [ ] `entries_final`
  - [ ] `institutions`
  - [ ] `business_profiles`
  - [ ] `addresses`
  - [ ] `professional_contacts`
  - [ ] `ai_stories`
  - [ ] `goals`
  - [ ] `budgets`

**Permission System:**
- [ ] Create `convex/permissions.ts` with:
  - [ ] Permission constants
  - [ ] Role-to-permission mapping
  - [ ] `hasPermission(role, permission)` helper
  - [ ] `getUserRoleInOrg(userId, orgId)` query
- [ ] Create `convex/rbac.ts` with:
  - [ ] `requirePermission(ctx, orgId, permission)` guard function
  - [ ] `requireOrgMember(ctx, orgId)` guard function
  - [ ] `getCurrentOrgContext(ctx)` helper

**Org Context Resolution:**
- [ ] Create `convex/organizations.ts` with:
  - [ ] `getUserOrganizations(userId)` query
  - [ ] `getOrgMembers(orgId)` query
  - [ ] `getCurrentOrg(userId, orgId?)` query (resolves from header/param or last-used)
  - [ ] `setLastUsedOrg(userId, orgId)` mutation
- [ ] Update all existing queries/mutations to:
  - [ ] Accept `orgId` parameter (from context/header)
  - [ ] Filter by `orgId` instead of just `userId`
  - [ ] Verify user has membership in org

**Audit Logging:**
- [ ] Create `convex/audit.ts` with:
  - [ ] `logAuditEvent(ctx, params)` function
  - [ ] Helper functions for common actions:
    - [ ] `logOrgUpdated(...)`
    - [ ] `logUserInvited(...)`
    - [ ] `logSubscriptionChanged(...)`
- [ ] Add audit logging to all org-modifying operations

**Data Migration:**
- [ ] Create migration script `convex/migrations/phase1_multi_tenant.ts`:
  - [ ] Create default organization for each existing user
  - [ ] Create membership record (ORG_OWNER) for each user
  - [ ] Migrate all `userId`-scoped data to `orgId`-scoped
  - [ ] Create default plans (starter, pro, enterprise)
  - [ ] Create subscriptions for existing users based on their `subscriptionTier`

**Helper Functions:**
- [ ] Create `convex/helpers/orgContext.ts`:
  - [ ] `getOrgFromContext(ctx)` - extracts orgId from request
  - [ ] `requireOrgAccess(ctx, orgId)` - ensures user can access org
- [ ] Update all existing Convex functions to use org context

#### Frontend (Next.js)

**Auth Context Enhancement:**
- [ ] Update auth context to include:
  - [ ] `currentOrgId` state
  - [ ] `userOrganizations` list
  - [ ] `currentOrg` object
  - [ ] `userRoleInOrg` for current org
- [ ] Create `hooks/useOrgContext.ts` hook

**Org Switcher UI:**
- [ ] Create `components/OrgSwitcher.tsx`:
  - [ ] Dropdown/select showing user's orgs
  - [ ] "Create new org" option
  - [ ] Persist selection to localStorage/context
- [ ] Add org switcher to navigation header

**Route Protection:**
- [ ] Update all protected routes to:
  - [ ] Require `currentOrgId` in context
  - [ ] Redirect to org selection if missing
  - [ ] Check permissions before rendering sensitive UI

**Data Fetching Updates:**
- [ ] Update all Convex queries to pass `orgId`
- [ ] Update all data displays to be org-scoped
- [ ] Add loading states for org context resolution

### 4. Tests (Phase 1)

**Unit Tests:**
- [ ] `permissions.test.ts`:
  - [ ] Permission matrix works for each role
  - [ ] `hasPermission` returns correct boolean
  - [ ] Role inheritance (ORG_OWNER has all permissions)
- [ ] `rbac.test.ts`:
  - [ ] `requirePermission` denies access with correct error
  - [ ] `requireOrgMember` rejects non-members
  - [ ] Org context resolution works correctly

**Integration Tests:**
- [ ] `multi_tenant.test.ts`:
  - [ ] User with multiple orgs only sees data from selected org
  - [ ] Switching orgs updates all data displays
  - [ ] Suspended org cannot access financial routes
  - [ ] Non-member cannot access org data
- [ ] `audit_log.test.ts`:
  - [ ] All org-modifying actions create audit logs
  - [ ] Audit logs include correct metadata
  - [ ] Audit logs are queryable by org, user, action

**Security Tests:**
- [ ] `tenant_isolation.test.ts`:
  - [ ] No endpoint returns data for an org the user is not a member of
  - [ ] Direct orgId manipulation in requests is rejected
  - [ ] Cross-tenant data leakage tests

**Migration Tests:**
- [ ] `migration.test.ts`:
  - [ ] Existing users get default org created
  - [ ] All existing data is properly migrated
  - [ ] No data loss during migration

---

## Phase 2 – Minimal Super Admin Panel

### 1. Goals

- You can manage tenants without touching the DB manually
- You can debug/support customers:
  - List orgs
  - See subscription & status
  - Impersonate org admins
- All Super Admin actions are audit-logged

### 2. Design Decisions

#### 2.1. Super Admin Identity

**Approach:**
- Add `isSuperAdmin: boolean` field to `users` table
- Super Admin sees a global "Super Admin" menu unavailable to normal users
- Super Admin can access any org without membership
- Super Admin actions are always logged with `orgId: null` or the target org

#### 2.2. Impersonation Model

**Impersonation Session:**
```typescript
impersonation_sessions: defineTable({
  superAdminUserId: v.id("users"),
  impersonatedOrgId: v.id("organizations"),
  impersonatedUserId: v.optional(v.id("users")), // Optional: specific user persona
  impersonatedRole: v.string(), // Role to impersonate as
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  sessionToken: v.string(), // Signed token for frontend
})
  .index("by_super_admin", ["superAdminUserId"])
  .index("by_org", ["impersonatedOrgId"])
```

**Impersonation Flow:**
1. Super Admin selects org and role
2. System generates signed session token
3. Frontend stores token and sets `impersonationContext`
4. All requests include impersonation context
5. Backend validates token and applies impersonation
6. All actions during impersonation are audit-logged with:
   - `isImpersonation: true`
   - `actorUserId`: real super admin
   - `impersonatedUserId`: impersonated user (if specified)
   - `orgId`: target org

**Security:**
- Impersonation tokens expire after 1 hour
- Impersonation cannot be chained (no "impersonate inside impersonation")
- All impersonation actions are clearly marked in audit logs

### 3. Implementation Checklist (Phase 2)

#### Backend

**Super Admin Infrastructure:**
- [ ] Add `isSuperAdmin` field to `users` table (if not done in Phase 1)
- [ ] Create `convex/superAdmin.ts` with:
  - [ ] `requireSuperAdmin(ctx)` guard function
  - [ ] `isSuperAdmin(userId)` query
- [ ] Create `convex/impersonation.ts` with:
  - [ ] `startImpersonation(superAdminId, orgId, role)` mutation
  - [ ] `endImpersonation(sessionId)` mutation
  - [ ] `validateImpersonationToken(token)` query
  - [ ] `getImpersonationContext(ctx)` helper

**Super Admin Endpoints:**
- [ ] `listOrganizations` query:
  - [ ] Filters: status, createdAt, plan, lastActiveAt
  - [ ] Pagination
  - [ ] Search by name/email
- [ ] `getOrganizationDetail` query:
  - [ ] Org core info
  - [ ] Members snapshot
  - [ ] Subscription details
  - [ ] Recent audit logs
- [ ] `createOrganization` mutation:
  - [ ] name, type, base currency, planId
  - [ ] Optional: invite/attach an org owner
- [ ] `updateOrgStatus` mutation:
  - [ ] Change status: `active`, `trial`, `suspended`
  - [ ] Audit log entry
- [ ] `changeOrgSubscription` mutation:
  - [ ] planId, trial dates, custom limits
  - [ ] Audit log entry
- [ ] `startImpersonation` mutation:
  - [ ] Generate session token
  - [ ] Create impersonation session record
  - [ ] Audit log entry
- [ ] `endImpersonation` mutation:
  - [ ] Invalidate session
  - [ ] Audit log entry
- [ ] `queryAuditLogs` query:
  - [ ] Filter by orgId, action, date, actor
  - [ ] Pagination
  - [ ] Export capability

**Middleware Updates:**
- [ ] Update `requireOrgAccess` to allow super admins
- [ ] Update all org-scoped queries to include super admin bypass
- [ ] Add impersonation context resolution to request pipeline

#### Frontend – Super Admin Panel

**Route Setup:**
- [ ] Create `/super-admin` route (protected by super admin check)
- [ ] Add "Super Admin" link to navigation (only visible to super admins)

**Org List View:**
- [ ] Table component with columns:
  - [ ] Name
  - [ ] Type
  - [ ] Plan
  - [ ] Status (with status badge)
  - [ ] Created date
  - [ ] Last active
  - [ ] Actions (view, impersonate, suspend)
- [ ] Filters:
  - [ ] Status dropdown
  - [ ] Plan dropdown
  - [ ] Search by name/email
  - [ ] Date range
- [ ] Pagination

**Org Detail View:**
- [ ] Org info section:
  - [ ] Name, type, status
  - [ ] Created date, last active
- [ ] Plan & subscription section:
  - [ ] Current plan
  - [ ] Subscription status
  - [ ] Trial end date
  - [ ] "Change plan" button
- [ ] Members list:
  - [ ] Table: name, email, role, status, joined date
  - [ ] "Invite member" button
- [ ] Action buttons:
  - [ ] "Suspend / Reactivate org"
  - [ ] "Impersonate as Org Owner"
  - [ ] "View audit logs"
- [ ] Recent activity feed (from audit logs)

**Create Org Form:**
- [ ] Form fields:
  - [ ] Name (required)
  - [ ] Type (business/personal)
  - [ ] Plan selector
  - [ ] Base currency
  - [ ] Optional: Owner email (to invite)
- [ ] Validation
- [ ] Success redirect to org detail

**Impersonation Banner:**
- [ ] Create `components/ImpersonationBanner.tsx`:
  - [ ] Shows when impersonating: "You are impersonating: [Org Name] as [Role]"
  - [ ] "Stop Impersonating" button
  - [ ] Styled as warning banner (yellow/orange)
- [ ] Add to main layout when impersonation active
- [ ] Clicking "Stop" calls `endImpersonation` and redirects to super admin panel

**Audit Log Tab:**
- [ ] List view of audit logs:
  - [ ] Date/time
  - [ ] Actor (user email)
  - [ ] Action
  - [ ] Target (org name, user email, etc.)
  - [ ] Impersonation indicator (if applicable)
- [ ] Filters:
  - [ ] Org selector
  - [ ] Action type
  - [ ] Date range
  - [ ] Actor
- [ ] Export to CSV option

### 4. Tests (Phase 2)

**Super Admin Access:**
- [ ] Super Admin routes reject normal users
- [ ] Super Admin can access any org without membership
- [ ] Super Admin actions are logged correctly

**Impersonation:**
- [ ] Impersonation session creates valid token
- [ ] Actions during impersonation execute as impersonated role
- [ ] Audit logs show real super admin as actor
- [ ] Impersonation cannot be chained
- [ ] Impersonation tokens expire after 1 hour
- [ ] Ending impersonation invalidates session

**Subscription Management:**
- [ ] Changing plan updates limits
- [ ] Plan changes are reflected in org-level APIs
- [ ] Trial dates are respected
- [ ] Suspended orgs cannot access features

**Security:**
- [ ] Super Admin cannot be impersonated
- [ ] Impersonation tokens cannot be forged
- [ ] All super admin actions are audit-logged

---

## Phase 3 – Full Admin / Team Backend (Customer-facing)

### 1. Goals

- Org owners/admins can:
  - Manage company profile & accounting preferences
  - Invite/disable/manage team members + roles
  - Manage subscription & billing (within their allowed scope)
  - Trigger safe reset/cleanup operations
- UI respects:
  - Minimalist design
  - Pills instead of heavy buttons
  - Progressive disclosure (simple → advanced)

### 2. Core Sections

1. **Company Settings**
2. **Team Management**
3. **Subscription & Billing**
4. **Data Reset & Cleanup**
5. Later: **Security & Integrations**

### 3. Implementation Checklist (Phase 3)

#### 3.1. Company Settings

**Backend:**
- [ ] `getOrgSettings(orgId)` query:
  - [ ] Returns org settings + business profile
  - [ ] Requires `VIEW_FINANCIALS` permission
- [ ] `updateOrgSettings(orgId, payload)` mutation:
  - [ ] Requires `MANAGE_ORG_SETTINGS` permission
  - [ ] Validates payload
  - [ ] Updates org record
  - [ ] Updates business profile if provided
  - [ ] Creates audit log entry
- [ ] Payload fields:
  - [ ] Basic: `name`, `type`, `baseCurrency`, `fiscalYearStart`, `timeZone`
  - [ ] Business profile: `legalName`, `industry`, `entityType`, etc.
  - [ ] Accounting: `accountingMethod`, `defaultCOAStyle`, etc.

**Frontend:**
- [ ] Settings page route: `/settings/company`
- [ ] Settings sidebar navigation (pills/tabs):
  - [ ] Company (active)
  - [ ] Team
  - [ ] Subscription
  - [ ] Data & Reset
- [ ] Company settings form:
  - [ ] Basic info section (always visible):
    - [ ] Organization name
    - [ ] Type (business/personal) - pill selector
    - [ ] Base currency
    - [ ] Fiscal year start
    - [ ] Timezone
  - [ ] "Advanced accounting options" collapsible section:
    - [ ] Accounting method (Cash/Accrual) - pill selector
    - [ ] Default COA style
    - [ ] Other advanced preferences
  - [ ] Business profile section (if type = business):
    - [ ] Legal name
    - [ ] Industry
    - [ ] Entity type
    - [ ] EIN/Tax ID
    - [ ] Other business profile fields
- [ ] UX patterns:
  - [ ] Pills/toggles for choices (e.g., `Cash` / `Accrual`)
  - [ ] Inline validation
  - [ ] Save button with loading state
  - [ ] Success toast notification
  - [ ] "Last updated by X on Y" display (from audit log)

#### 3.2. Team Management

**Backend:**
- [ ] `listMembers(orgId)` query:
  - [ ] Returns all memberships for org
  - [ ] Includes user details
  - [ ] Requires `VIEW_FINANCIALS` permission (or `MANAGE_TEAM` for full details)
- [ ] `inviteMember(orgId, email, role)` mutation:
  - [ ] Requires `MANAGE_TEAM` permission
  - [ ] Validates email format
  - [ ] Checks if user exists (create if not)
  - [ ] Creates membership with status "invited"
  - [ ] Sends invitation email (if email service configured)
  - [ ] Creates audit log entry
- [ ] `updateMemberRole(orgId, membershipId, newRole)` mutation:
  - [ ] Requires `MANAGE_TEAM` permission
  - [ ] Validates role change (e.g., only ORG_OWNER can make another owner)
  - [ ] Updates membership role
  - [ ] Creates audit log entry
- [ ] `disableMember(orgId, membershipId)` mutation:
  - [ ] Requires `MANAGE_TEAM` permission
  - [ ] Prevents disabling last ORG_OWNER
  - [ ] Sets membership status to "disabled"
  - [ ] Creates audit log entry
- [ ] `resendInvite(orgId, membershipId)` mutation:
  - [ ] Requires `MANAGE_TEAM` permission
  - [ ] Resends invitation email
  - [ ] Updates `invitedAt` timestamp

**Frontend:**
- [ ] Settings route: `/settings/team`
- [ ] Team management page:
  - [ ] Members table:
    - [ ] Columns: name, email, role, status, last active, actions
    - [ ] Role pill chooser (for admins) - inline edit
    - [ ] Status badges (active/invited/disabled)
    - [ ] Actions: edit role, disable, resend invite
  - [ ] "Invite teammate" section:
    - [ ] Email input
    - [ ] Role selector (pill group):
      - [ ] Org Owner
      - [ ] Org Admin
      - [ ] Bookkeeper
      - [ ] Viewer
    - [ ] Role descriptions tooltip:
      - [ ] Short copy under each role explaining permissions
    - [ ] "Send invitation" button
  - [ ] Progressive complexity:
    - [ ] Simple: just roles (MVP)
    - [ ] Advanced: per-feature scopes (future enhancement)

#### 3.3. Subscription & Billing (Org-facing)

**Backend:**
- [ ] `getOrgSubscription(orgId)` query:
  - [ ] Returns subscription + plan details
  - [ ] Requires `VIEW_FINANCIALS` permission
- [ ] `changePlan(orgId, newPlanId)` mutation:
  - [ ] Requires `MANAGE_SUBSCRIPTION` permission
  - [ ] Validates plan exists and is active
  - [ ] Updates subscription
  - [ ] Handles Stripe subscription update (if integrated)
  - [ ] Creates audit log entry
- [ ] `cancelSubscription(orgId)` mutation:
  - [ ] Requires `MANAGE_SUBSCRIPTION` permission
  - [ ] Sets subscription status to "canceled"
  - [ ] Sets `canceledAt` timestamp
  - [ ] Handles Stripe cancellation (if integrated)
  - [ ] Creates audit log entry
- [ ] `resumeSubscription(orgId)` mutation:
  - [ ] Requires `MANAGE_SUBSCRIPTION` permission
  - [ ] Resumes canceled subscription
  - [ ] Handles Stripe resumption (if integrated)
  - [ ] Creates audit log entry
- [ ] Webhook handlers (Stripe/etc.):
  - [ ] Update subscription state on webhook events
  - [ ] Log audit entries for subscription changes

**Frontend:**
- [ ] Settings route: `/settings/subscription`
- [ ] Plan & billing page:
  - [ ] Current plan section:
    - [ ] Plan name (pill badge)
    - [ ] Plan features list
    - [ ] Renewal date
    - [ ] Status (active/trialing/canceled)
  - [ ] Usage preview:
    - [ ] Users: X / Y (with progress bar if limit exists)
    - [ ] Transactions: X / Y (with progress bar if limit exists)
    - [ ] Other usage metrics
  - [ ] Plan upgrade/downgrade:
    - [ ] Available plans (cards or pills)
    - [ ] "Upgrade to [Plan]" button
    - [ ] "Downgrade to [Plan]" button (with warning)
  - [ ] Billing management:
    - [ ] "Manage billing" button (links to Stripe customer portal)
    - [ ] Payment method display (if available)
    - [ ] Billing history link
  - [ ] Cancel subscription:
    - [ ] "Cancel subscription" button (danger style)
    - [ ] Confirmation modal with:
      - [ ] Warning about data retention
      - [ ] Cancellation effective date
      - [ ] "Confirm cancellation" button

#### 3.4. Data Reset & Cleanup

**Backend:**
- [ ] `resetOrgDemoData(orgId)` mutation:
  - [ ] Requires `RUN_APP_RESET` permission
  - [ ] Deletes demo/test transactions (marked with `source: "mock"`)
  - [ ] Preserves real settings, users, and real transactions
  - [ ] Creates audit log entry with metadata
- [ ] `clearOrgTransactions(orgId)` mutation:
  - [ ] Requires `RUN_APP_RESET` permission
  - [ ] Deletes all financial transactions
  - [ ] Preserves org, users, settings, accounts structure
  - [ ] Creates audit log entry
- [ ] `fullOrgReset(orgId, confirmation)` mutation:
  - [ ] Requires `ORG_OWNER` role + `RUN_APP_RESET` permission
  - [ ] Validates confirmation (typed org name)
  - [ ] Deletes:
    - [ ] All transactions
    - [ ] All accounts (except system accounts)
    - [ ] All entries
    - [ ] All business profiles
    - [ ] All addresses
    - [ ] All professional contacts
    - [ ] All AI stories
    - [ ] All goals/budgets
  - [ ] Preserves:
    - [ ] Org record
    - [ ] User accounts
    - [ ] Memberships
    - [ ] Subscription
  - [ ] Creates audit log entry with full metadata
- [ ] Guardrails:
  - [ ] Multi-step confirmation
  - [ ] Require typing org name for full reset
  - [ ] Optional reason field in audit log
  - [ ] Rate limiting (prevent accidental rapid resets)

**Frontend:**
- [ ] Settings route: `/settings/data-reset`
- [ ] Data & reset page:
  - [ ] Warning banner: "These actions cannot be undone"
  - [ ] Reset option cards:
    - [ ] **Clear demo data:**
      - [ ] Description: "Remove test/demo transactions. Keeps all real data and settings."
      - [ ] What is deleted: Demo transactions only
      - [ ] What is preserved: Everything else
      - [ ] "Clear demo data" button
    - [ ] **Clear all transactions:**
      - [ ] Description: "Delete all financial transactions. Keeps organization, users, and settings."
      - [ ] What is deleted: All transactions and entries
      - [ ] What is preserved: Org, users, settings, account structure
      - [ ] "Clear all transactions" button
    - [ ] **Full reset (danger):**
      - [ ] Behind "Show dangerous actions" toggle/pill
      - [ ] Description: "Completely reset organization. Only org record and user accounts are preserved."
      - [ ] What is deleted: Everything except org and users
      - [ ] What is preserved: Org record, user accounts, memberships
      - [ ] "Full reset" button (red/danger style)
  - [ ] Confirmation modals:
    - [ ] For each reset type:
      - [ ] Warning message
      - [ ] List of what will be deleted
      - [ ] List of what will be preserved
      - [ ] For full reset: "Type org name to confirm" input
      - [ ] Optional: "Reason for reset" textarea
      - [ ] Checkbox: "I understand this cannot be undone"
      - [ ] "Cancel" and "Confirm [Action]" buttons
  - [ ] Success/error handling:
    - [ ] Success toast with summary
    - [ ] Error toast with details
    - [ ] Loading states during reset

### 4. Tests (Phase 3)

**Role & Permission Coverage:**
- [ ] Test every admin action as:
  - [ ] ORG_OWNER (should succeed)
  - [ ] ORG_ADMIN (should succeed for most)
  - [ ] BOOKKEEPER (should fail for team/subscription management)
  - [ ] VIEWER (should fail for all modifications)
  - [ ] Non-member (should fail with 403)

**Company Settings:**
- [ ] Update org settings as owner succeeds
- [ ] Update org settings as admin succeeds
- [ ] Update org settings as bookkeeper fails
- [ ] Settings changes are audit-logged
- [ ] Business profile updates work correctly

**Team Management:**
- [ ] Invite member creates membership with "invited" status
- [ ] Invite email is sent (if configured)
- [ ] Role updates work correctly
- [ ] Cannot disable last ORG_OWNER
- [ ] Only ORG_OWNER can create another owner
- [ ] All team actions are audit-logged

**Subscription Management:**
- [ ] Plan changes update subscription correctly
- [ ] Plan changes are reflected in feature access
- [ ] Cancellation sets correct status and dates
- [ ] Resumption reactivates subscription
- [ ] Stripe webhooks update subscription state
- [ ] All subscription changes are audit-logged

**Data Reset:**
- [ ] Clear demo data only removes mock transactions
- [ ] Clear transactions removes all financial data but preserves structure
- [ ] Full reset removes all data except org/users
- [ ] After reset, app still loads correctly
- [ ] After reset, user can re-onboard normally
- [ ] No cross-tenant leakage after reset
- [ ] All resets are audit-logged with correct metadata
- [ ] Confirmation requirements prevent accidental resets

**E2E Flows:**
- [ ] Create new org → invite team → update settings → change plan
- [ ] Impersonate org (from Super Admin) → verify same view as org owner
- [ ] Full user journey: signup → create org → invite team → manage settings → reset data

---

## Implementation Timeline

### Phase 1: Shared Foundation
**Estimated Duration:** 3-4 weeks

**Week 1:**
- Schema updates
- Permission system
- Basic org context resolution

**Week 2:**
- Data migration
- Update all queries/mutations for multi-tenant
- Audit logging infrastructure

**Week 3:**
- Frontend org context
- Org switcher UI
- Route protection updates

**Week 4:**
- Testing
- Bug fixes
- Documentation

### Phase 2: Minimal Super Admin
**Estimated Duration:** 2-3 weeks

**Week 1:**
- Super admin infrastructure
- Impersonation system
- Basic super admin endpoints

**Week 2:**
- Super admin UI (org list, detail, create)
- Impersonation banner
- Audit log viewer

**Week 3:**
- Testing
- Security review
- Documentation

### Phase 3: Full Admin / Team Backend
**Estimated Duration:** 3-4 weeks

**Week 1:**
- Company settings backend + frontend
- Team management backend

**Week 2:**
- Team management frontend
- Subscription management backend + frontend

**Week 3:**
- Data reset backend + frontend
- Settings sidebar navigation

**Week 4:**
- Testing
- UX polish
- Documentation

**Total Estimated Duration:** 8-11 weeks

---

## Migration Strategy

### Phase 1 Migration

1. **Add new tables** (organizations, memberships, etc.) without breaking existing code
2. **Run migration script** to:
   - Create default org for each user
   - Create membership records
   - Migrate data to org-scoped
3. **Deploy backend** with dual support (userId and orgId)
4. **Update frontend** to use org context
5. **Remove userId-only code** after verification

### Rollback Plan

- Keep userId fields during migration period
- Migration script is idempotent (can re-run safely)
- Can rollback by removing orgId filters temporarily

---

## Security Considerations

1. **Tenant Isolation:**
   - All queries must filter by orgId
   - No cross-tenant data access
   - Super admin bypass is explicit and logged

2. **Permission Enforcement:**
   - All mutations check permissions
   - Frontend hides UI, but backend enforces
   - Audit logs capture all permission checks

3. **Impersonation Security:**
   - Tokens are signed and time-limited
   - Cannot chain impersonation
   - All actions clearly marked in audit logs

4. **Data Reset Security:**
   - Multi-step confirmation
   - Typed org name requirement for full reset
   - Rate limiting to prevent abuse
   - Comprehensive audit logging

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All data is org-scoped
- ✅ Users can belong to multiple orgs
- ✅ Org switching works correctly
- ✅ Permissions are enforced on all endpoints
- ✅ Audit logs capture all org-modifying actions
- ✅ No cross-tenant data leakage

### Phase 2 Complete When:
- ✅ Super admins can list and manage orgs
- ✅ Impersonation works correctly
- ✅ All super admin actions are audit-logged
- ✅ Super admin UI is functional (even if not beautiful)

### Phase 3 Complete When:
- ✅ Org owners can manage company settings
- ✅ Team invitation and management works
- ✅ Subscription management is self-service
- ✅ Data reset operations are safe and confirmed
- ✅ All admin actions respect role permissions
- ✅ UI is polished and user-friendly

---

## Next Steps

1. **Review and approve this plan**
2. **Set up development branch** for Phase 1
3. **Begin Phase 1 implementation** starting with schema updates
4. **Schedule regular check-ins** to track progress
5. **Document decisions** as they're made during implementation

---

## Questions & Decisions Needed

1. **Migration timing:** Should we migrate existing users immediately or support both models temporarily?
2. **Plan structure:** What are the exact plan tiers and limits?
3. **Stripe integration:** Do we have Stripe set up for subscription management?
4. **Email service:** What service will we use for invitation emails?
5. **Impersonation UX:** Should impersonation be session-based or require re-authentication?

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-30  
**Owner:** Development Team
