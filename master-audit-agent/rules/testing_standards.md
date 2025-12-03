# Testing Standards – Forhem Finance

## Core Expectations

- Convex functions touching:
  - Billing (Stripe)
  - Org/role management
  - Add-on lifecycle
  - Super Admin access
  MUST have:
  - Unit tests for happy paths and major error paths.
  - Integration tests for:
    - Org isolation
    - Permissions (role-based)
    - Stripe/webhook flows (mocked).

- Frontend modules (Goals, Reports, Stories, etc.):
  - Component-level tests for:
    - Feature visibility when module/add-on is disabled vs enabled.
    - Super Admin vs Admin vs normal user visibility where relevant.

## Multi-Tenant Tests

- For critical flows, tests MUST:
  - Simulate two orgs with distinct data.
  - Ensure that:
    - Org A cannot see or modify Org B.
    - Impersonation flows are restricted to valid org contexts.

## Add-on Lifecycle Tests

- For each add-on:
  - Purchase flow tests (including discount / onboarding promos).
  - Enable/disable tests.
  - Post-purchase feature availability tests in Insights/modules.
