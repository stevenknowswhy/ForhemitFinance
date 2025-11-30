# Plaid Integration Tests

## Overview

Integration tests for Plaid API calls and webhook processing.

## Prerequisites

- Plaid sandbox account
- Plaid sandbox credentials
- Test bank accounts in Plaid sandbox

## Test Structure

```
tests/integration/plaid/
├── plaid-api.test.ts
├── webhook-handler.test.ts
└── mock-plaid-workflow.test.sh
```

## Running Tests

```bash
# Run integration tests
pnpm test tests/integration/plaid

# Run with Plaid sandbox credentials
PLAID_CLIENT_ID=... PLAID_SECRET=... pnpm test tests/integration/plaid
```

## Test Coverage

- Link token creation
- Public token exchange
- Transaction sync
- Webhook event processing
- Error handling

## Note

These tests require:
1. Real Plaid sandbox credentials
2. Network access to Plaid API
3. Webhook endpoint accessible from internet (use ngrok for local testing)
