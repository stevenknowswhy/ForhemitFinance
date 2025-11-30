# Plaid Integration Setup Guide

## ✅ Installed Packages

### Frontend (Next.js)
- `react-plaid-link` - React component for Plaid Link flow

### Backend (Convex)
- `plaid` - Plaid Node.js SDK for server-side API calls

## Next Steps

### 1. Get Plaid API Keys

1. Sign up at https://dashboard.plaid.com
2. Create a new application
3. Get your credentials:
   - **Client ID** (`PLAID_CLIENT_ID`)
   - **Secret Key** (`PLAID_SECRET`)
   - **Environment** (`sandbox`, `development`, or `production`)

### 2. Configure Environment Variables

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_PLAID_ENV=sandbox
```

**Backend** (`convex/.env.local`):
```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox
```

### 3. Update Convex Plaid Functions

The `convex/plaid.ts` file has skeleton code that needs to be updated with real Plaid API calls. Key functions to implement:

- `exchangePublicToken` - Exchange public token for access token
- `syncAccounts` - Fetch accounts from Plaid
- `syncTransactions` - Fetch transactions from Plaid

### 4. Create Plaid Link Component

Create `apps/web/app/connect-bank/page.tsx` with:
- Plaid Link component from `react-plaid-link`
- Handle `onSuccess` callback
- Call Convex `exchangePublicToken` action

## Plaid Link Flow

1. **User clicks "Connect Bank"** → Opens Plaid Link modal
2. **User selects bank** → Plaid handles authentication
3. **Plaid returns public token** → Frontend receives token
4. **Frontend calls Convex** → `exchangePublicToken` action
5. **Convex exchanges token** → Gets access token from Plaid
6. **Convex stores connection** → Saves institution and accounts
7. **Convex syncs transactions** → Fetches initial transactions

## Testing

Use Plaid's sandbox environment for testing:
- Test credentials: https://plaid.com/docs/sandbox/test-credentials/
- Test institutions: Use "First Platypus Bank" or "First Gingham Credit Union"
- Test accounts: Use provided test account numbers

## Documentation

- Plaid Docs: https://plaid.com/docs/
- React Plaid Link: https://github.com/plaid/react-plaid-link
- Plaid Node SDK: https://github.com/plaid/plaid-node

