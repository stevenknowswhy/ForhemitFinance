# File Scopes & Layers – Forhem Finance

## Frontend (Next.js / React)
- `apps/web/app/**`
  - `apps/web/app/(dashboard)/**` → Primary user experience
  - `apps/web/app/(admin)/**` → Org admin tools
  - `apps/web/app/(super-admin)/**` → Global Super Admin panel (HIGH RISK)
- `apps/web/components/**` → Reusable UI components
- `apps/web/hooks/**` → Client-side hooks (data fetching, state, derived logic)
- `apps/web/lib/**` → Client utilities, formatters, helpers

## Backend (Convex)
- `convex/**` → Business logic, DB access, auth, multi-tenant enforcement
  - `convex/auth.ts` → Auth/session, identity + org context (CRITICAL)
  - `convex/organizations.ts` → Org CRUD, RBAC, impersonation flows (CRITICAL)
  - `convex/auditLogs.ts` → Audit log writing and querying (CRITICAL)
  - `convex/addons.ts` → Add-ons lifecycle (create, enable, disable, purchase)
  - `convex/pricingCampaigns.ts` → Discounts, campaign logic (onboarding promos)
  - `convex/modules.ts` → Module manifest / moduleStatus, mapping add-ons → modules
  - `convex/stripe.ts` or Stripe-related files → Billing, webhooks, product mapping (CRITICAL)

## Modules & Add-ons
- `modules/**`
  - `modules/goals/**`
  - `modules/reports/**`
  - `modules/stories/**`
  - `modules/transactions/**`
- `addons/**`
  - Each folder = a micro add-on package with:
    - Metadata (id, name, pricing model)
    - Enrollment or enablement logic
    - UI wiring to Insights / Modules

## High-Risk Areas (for prioritization)
- Super Admin routes & components
- Convex mutations that:
  - change money-related data (Stripe, billing, invoices)
  - change org relationships (org create/delete, owner transfer, impersonation)
  - enable/disable modules/add-ons
- Any code that touches `orgId`, `userId`, `role`, `impersonatingUserId`
