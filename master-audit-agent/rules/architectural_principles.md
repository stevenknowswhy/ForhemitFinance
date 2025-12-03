# Architectural Principles – Forhem Finance

## 1. Separation of Concerns

- UI (React in `apps/web/app/**`, `apps/web/components/**`):
  - Handles rendering, input, and basic client-side state.
  - Does NOT directly access the database.
  - Talks to Convex functions with minimal logic.

- Business Logic (Convex in `convex/**`):
  - All org-aware and money-affecting logic resides here.
  - Enforces org isolation, RBAC, and audit logging.
  - Contains clear separation between:
    - Auth/session
    - Org & user management
    - Add-on lifecycle
    - Billing (Stripe)
    - Modules/insights

## 2. Multi-Tenant & Org Isolation

- Every Convex query/mutation that touches tenant data MUST:
  - Derive `orgId` from authenticated context (server-side), not directly from client.
  - Never operate on data outside the current org without explicit Super Admin intent.
  - Handle "no org" and "cross-org" attempts explicitly.

## 3. Modules & Add-ons

- Modules (Goals, Reports, Stories, etc.):
  - Registered via a central manifest (e.g., `convex/modules.ts`).
  - Exposed to the UI through a structured `ModuleStatus` / `insightsNavigation` object.
  - Shown/hidden in Insights based on:
    - Core plan
    - Add-ons enabled for the org

- Add-ons:
  - Defined as discrete units in `addons/**` with:
    - ID
    - Display name
    - Stripe product ID(s) (for one-time purchase)
    - Required modules / features
  - Lifecycle:
    - Discoverable in marketplace
    - Purchasable (one-time)
    - Enable/disable toggles
    - Trial / discount aware when applicable

## 4. Billing & Stripe

- Main app subscription:
  - Handled via Stripe subscriptions with trials where applicable.
- Add-ons:
  - One-time Stripe products, NOT recurring.
  - Optional trial or onboarding discounts (e.g., early purchase 50% off).
- Stripe integration:
  - Stripe SDK calls only in Convex backend.
  - Webhooks:
    - Always verify signature.
    - Map events to org and add-on state carefully.
  - No Stripe secret keys on the client.

## 5. Super Admin & Impersonation

- Super Admin:
  - Access limited to `(super-admin)` routes and specific Convex functions.
  - Can view org details, billing state, add-ons, and audit logs.
- Impersonation:
  - Requires explicit recording in audit logs (who, whom, when, from where).
  - Cannot bypass business logic that enforces org isolation.
  - Every mutation during impersonation must remain org-scoped.

## 6. Observability & Auditability

- All critical state changes MUST:
  - Emit structured audit log entries via `convex/auditLogs.ts` (or equivalent).
- CRITICAL changes include:
  - Org creation, deletion, owner changes
  - Role changes (user promoted/demoted)
  - Add-on enabling/disabling
  - Stripe billing changes that alter money flows
  - Super Admin impersonation and actions performed via impersonation
