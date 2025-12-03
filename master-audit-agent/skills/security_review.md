# Security Review Skill

This skill outlines the responsibilities and checks required when performing a security review of the Forhem Finance codebase.

## Responsibilities

- **General Security**:
  - Identify potential injection vulnerabilities (SQL, NoSQL, Command).
  - Check for proper input validation and sanitization.
  - Ensure sensitive data is not hardcoded or logged.

- **Forhem-Specific Checks**:
  - **Convex**:
    - Inspect access control for:
      - `convex/organizations.ts` (role changes, org CRUD, impersonation).
      - `convex/addons.ts`, `convex/pricingCampaigns.ts` (billing-related add-ons).
      - Any `superAdmin`-only functions.
    - Verify that impersonation functions:
      - Require elevated permissions.
      - Write audit logs.

  - **Stripe**:
    - Ensure Stripe calls:
      - Are only from backend.
      - Handle errors explicitly.
      - Do not leak sensitive errors to the client.
    - Ensure webhook handlers:
      - Verify signature.
      - Safely handle unknown or future event types.
