# ✅ Onboarding Error Fixed

## Problem

The error `ctx.runMutation is not a function` occurred because:
- Mutations in Convex **cannot** call other mutations using `ctx.runMutation`
- Only **actions** can call mutations using `ctx.runMutation`
- The `completeOnboarding` mutation was trying to call `createDefaultAccounts` mutation

## Solution Applied

✅ **Inlined the account creation logic** directly in the `completeOnboarding` mutation
- Removed the `ctx.runMutation` call
- Moved account creation code directly into the mutation handler
- This is the correct pattern for Convex mutations

## Changes Made

### File: `convex/onboarding.ts`

**Before:**
```typescript
// Create default accounts
await ctx.runMutation(api.onboarding.createDefaultAccounts, {
  userId,
});
```

**After:**
```typescript
// Create default accounts directly (can't use ctx.runMutation in mutations)
// Inline the account creation logic here
for (const account of [
  ...DEFAULT_ACCOUNTS.assets,
  ...DEFAULT_ACCOUNTS.liabilities,
  ...DEFAULT_ACCOUNTS.equity,
  ...DEFAULT_ACCOUNTS.income,
  ...DEFAULT_ACCOUNTS.expenses,
]) {
  await ctx.db.insert("accounts", {
    userId: userId,
    name: account.name,
    type: account.type,
    isBusiness: account.isBusiness,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

## Testing

### ✅ Verification Steps

1. **Check for errors:**
   ```bash
   grep -n "ctx.runMutation" convex/onboarding.ts
   # Should return nothing
   ```

2. **TypeScript check:**
   ```bash
   npx tsc --noEmit
   # Should pass
   ```

3. **Test onboarding flow:**
   - Navigate to `/onboarding`
   - Select a business type
   - Click "Continue"
   - Should redirect to `/dashboard` without errors

## Expected Behavior

After the fix:
- ✅ Onboarding form submits successfully
- ✅ User is created in database
- ✅ Default accounts are created
- ✅ Redirects to dashboard
- ✅ No `ctx.runMutation` errors

## Next Steps

1. **Restart Convex dev server** (if running):
   ```bash
   # Stop current Convex dev (Ctrl+C)
   npx convex dev
   ```

2. **Test the onboarding flow:**
   - Go to http://localhost:3002/onboarding
   - Select business type
   - Submit form
   - Should work without errors!

## Note on Other Files

The `plaid.ts` file also uses `ctx.runMutation`, but that's **correct** because:
- `plaid.ts` functions are **actions** (not mutations)
- Actions **can** call mutations using `ctx.runMutation`
- This is the proper pattern for actions

## Summary

✅ **Fixed:** `ctx.runMutation` error in onboarding
✅ **Method:** Inlined account creation logic
✅ **Status:** Ready to test

The onboarding flow should now work correctly!

