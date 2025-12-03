# Security Do's and Don'ts – Forhem Finance

## Do

- Use Convex auth/session to derive:
  - `userId`
  - `orgId`
  - `role` (user, admin, Super Admin)
  - `impersonatingUserId` (if present)
- Require explicit role checks for:
  - Org admin functions (settings, invites, deletion, billing)
  - Super Admin access (org list, audit logs, impersonation)
- Verify Stripe webhook signatures before handling events.
- Validate all client inputs for:
  - Type
  - Range
  - Enum membership (for statuses, roles, add-on IDs)

## Don't

- Don't rely on client-provided `orgId`, `role`, or `isSuperAdmin` flags.
- Don't allow "view all orgs" queries without Super Admin context.
- Don't log:
  - Stripe secret keys
  - Access tokens
  - Raw PII such as full card data or password hashes
- Don't catch-and-ignore errors in billing or org mutation flows.
