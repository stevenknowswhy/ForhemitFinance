# App Review & Console Error Check

## Current Status

✅ **Build**: Successful
✅ **Convex**: Initialized and running
✅ **TypeScript**: All types validated
⚠️ **Environment Variables**: Need to be configured

## Potential Console Errors

### 1. Missing Environment Variables

**Required for Web App (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_CONVEX_URL=https://silent-reindeer-986.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_LIGHT_MONTHLY=price_...
STRIPE_PRICE_LIGHT_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
```

**Required for Convex (`convex/.env.local`):**
```env
CLERK_JWT_ISSUER_DOMAIN=https://allowing-cow-9.clerk.accounts.dev
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
```

### 2. Runtime Error Scenarios

#### A. ConvexClientProvider (`apps/web/app/ConvexClientProvider.tsx`)
- **Error**: `NEXT_PUBLIC_CONVEX_URL is not set`
- **Location**: Line 7
- **Impact**: App won't connect to Convex backend
- **Fix**: Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

#### B. Clerk Authentication
- **Error**: `Failed to get Clerk token`
- **Location**: `ConvexClientProvider.tsx:23`
- **Impact**: Convex queries/mutations won't authenticate
- **Fix**: Ensure Clerk keys are set and ClerkProvider is configured

#### C. Plaid Link (`apps/web/app/connect-bank/page.tsx`)
- **Error**: `Error creating link token`
- **Location**: Line 37
- **Impact**: Bank connection won't work
- **Fix**: Set Plaid credentials in Convex environment

#### D. Stripe Checkout (`apps/web/app/api/checkout/route.ts`)
- **Error**: `STRIPE_SECRET_KEY is not set`
- **Location**: Line 22
- **Impact**: Subscription checkout won't work
- **Fix**: Set Stripe keys in web app environment

### 3. Code Issues Found

#### ✅ Good Error Handling
- All API routes have try/catch blocks
- Console errors are logged appropriately
- User-facing error messages are displayed

#### ⚠️ Potential Issues

1. **Dashboard Auto-Onboarding** (`apps/web/app/dashboard/page.tsx:28`)
   - Uses `console.error` for catch - should show user feedback
   - Auto-completes onboarding silently - might be confusing

2. **Onboarding Redirect** (`apps/web/app/onboarding/page.tsx:33-35`)
   - Redirects without checking if router is ready
   - Could cause hydration issues

3. **Plaid Link Token** (`apps/web/app/connect-bank/page.tsx`)
   - No retry logic if token creation fails
   - Error state might not be user-friendly

## Testing Workflow

### 1. Landing Page (`/`)
- ✅ Should load without errors
- ✅ Header should show Sign In / Get Started buttons
- ⚠️ Check console for any hydration warnings

### 2. Sign Up Flow (`/sign-up`)
- ✅ Clerk modal should open
- ✅ After signup, should redirect to dashboard
- ⚠️ Check for Convex connection errors

### 3. Dashboard (`/dashboard`)
- ✅ Should check onboarding status
- ✅ Should redirect to `/onboarding` if not completed
- ⚠️ Check for `getCurrentUser` query errors
- ⚠️ Check for `getOnboardingStatus` query errors

### 4. Onboarding (`/onboarding`)
- ✅ Should show business type selection
- ✅ Should create user in Convex on submit
- ⚠️ Check for `completeOnboarding` mutation errors

### 5. Connect Bank (`/connect-bank`)
- ⚠️ Requires Plaid credentials
- ⚠️ Will fail if `createLinkToken` action errors
- ⚠️ Check for Plaid Link initialization errors

### 6. Pricing (`/pricing`)
- ⚠️ Requires Stripe keys
- ⚠️ Checkout will fail if Stripe not configured
- ⚠️ Check for Stripe initialization errors

## Recommended Fixes

### Immediate
1. Create `.env.local` files with required variables
2. Add error boundaries for better error handling
3. Add loading states for async operations

### Short-term
1. Add retry logic for failed API calls
2. Improve error messages for users
3. Add analytics/logging for production

### Long-term
1. Add comprehensive error monitoring (Sentry, etc.)
2. Add E2E tests for critical flows
3. Add user feedback for all async operations

## Console Error Checklist

When testing, check browser console for:
- [ ] `NEXT_PUBLIC_CONVEX_URL is not set`
- [ ] `Failed to get Clerk token`
- [ ] `Error creating link token`
- [ ] `STRIPE_SECRET_KEY is not set`
- [ ] `Cannot connect to Convex`
- [ ] `User not found` (after signup)
- [ ] `Not authenticated` errors
- [ ] React hydration warnings
- [ ] Missing environment variable warnings

