# Multi-Tenant & Org Isolation Rules – Forhem Finance

- All Convex functions that read or write tenant data MUST:
  - Resolve the active `orgId` from the authenticated session/context.
  - NEVER trust a raw org ID passed from the client.
  - Throw or early-return when:
    - No org is selected/available but one is required.
    - The user lacks permissions for the target org.

- Cross-org operations:
  - Only allowed for Super Admin functions explicitly marked for that purpose.
  - Must:
    - Check Super Admin role.
    - Log the operation (who/what/when/target org).

- Impersonation:
  - Store `impersonatingUserId` and target user & org in the session or request context.
  - Audit:
    - Start and end of impersonation.
    - Sensitive actions taken while impersonating.

- Add-ons & Modules:
  - Add-on purchase/enablement is scoped strictly to one org.
  - Modules that are add-on gated MUST check:
    - That add-on is enabled for that org.
    - That the user has appropriate role inside that org.
