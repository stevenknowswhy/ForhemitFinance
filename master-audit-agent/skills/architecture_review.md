# Architecture Review Skill

This skill outlines the responsibilities and checks required when performing an architectural review of the Forhem Finance codebase.

## Responsibilities

- **General Code Structure**:
  - Ensure code follows the project's directory structure and naming conventions.
  - Verify that business logic is separated from UI components.
  - Check for modularity and reusability of components and functions.

- **Forhem-Specific Checks**:
  - **Convex Files**:
    - Confirm that org-aware mutations/queries:
      - Derive org context from session/auth helpers.
      - Do not accept arbitrary org IDs from the client.
    - Ensure that:
      - Billing logic is isolated (e.g., stripe handlers, pricing logic).
      - Add-on lifecycle is structured (create → purchase → enable → disable).

  - **Modules & Add-ons**:
    - Check that modules (Goals, Reports, Stories, etc.) register through:
      - Manifests or moduleStatus-like structures.
    - Confirm that add-ons:
      - Are mapped cleanly to modules/features.
      - Do NOT introduce hard-coded logic across unrelated modules.

  - **Super Admin**:
    - Validate segmentation of Super Admin UI (`(super-admin)`) from regular admin.
    - Ensure any Super Admin Convex functions:
      - Are clearly labeled and guarded.
      - Integrate with audit logging.
