# E2E Tests with Playwright

## Overview

End-to-end tests for critical user flows using Playwright.

## Setup

```bash
# Install Playwright
pnpm add -D @playwright/test

# Install browsers
npx playwright install
```

## Test Structure

```
tests/e2e/
├── transaction-approval.spec.ts
├── plaid-connection.spec.ts
└── filtering.spec.ts
```

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test tests/e2e/transaction-approval.spec.ts

# Run in UI mode
npx playwright test --ui
```

## Test Flows

### Transaction Approval Flow
1. User creates transaction
2. AI generates entry preview
3. User approves entry
4. Entry moves to final entries

### Plaid Connection Flow
1. User clicks connect bank
2. Plaid Link opens
3. User connects account
4. Transactions sync
5. Entries appear in approval queue

### Filtering Flow
1. User filters by business/personal
2. Transaction list updates
3. Charts update accordingly

## Configuration

Create `playwright.config.ts` in project root:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
