# Convex Function Tests

## Overview

Testing Convex functions requires special setup because they run in the Convex runtime environment. This directory contains unit tests for Convex backend functions.

## Testing Approach

### 1. Pure Function Testing
Functions that don't require Convex runtime (pure TypeScript logic) can be tested directly.

### 2. Integration Testing
Functions that require Convex runtime should be tested using:
- Convex test utilities (when available)
- Manual testing in development environment
- E2E tests with Playwright

## Test Structure

```
tests/unit/convex/
├── ai_entries.test.ts          # AI entries function tests
├── transactions.test.ts        # Transaction approval tests
└── plaid.test.ts               # Plaid integration tests
```

## Running Tests

```bash
# Run all Convex function tests
pnpm test tests/unit/convex

# Run specific test file
pnpm test tests/unit/convex/ai_entries.test.ts
```

## Note

Convex functions are best tested through:
1. Manual testing in development
2. Integration tests with real Convex deployment
3. E2E tests that exercise the full flow

Unit tests for pure logic (like accounting engine) are in `packages/accounting-engine/`.
