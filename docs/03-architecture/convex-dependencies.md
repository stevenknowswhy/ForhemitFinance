# Convex Dependencies Guide

## Important: How Convex Handles Dependencies

Convex functions run in **Convex's cloud environment**, not locally. This means:

✅ **Dependencies are automatically available** - When you `import` a package in your Convex functions, Convex automatically makes it available in the runtime environment.

❌ **No local node_modules needed** - You don't need to install packages locally in the `convex/` directory.

## What We Removed

- `convex/node_modules/` - Not needed, Convex handles dependencies in the cloud
- `convex/package.json` - Not needed for Convex functions

## How to Use Dependencies in Convex

Simply import them in your Convex functions:

```typescript
// convex/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Convex automatically makes 'plaid' available in the runtime
```

## Installing Dependencies for Convex

If you need to add a new dependency:

1. **Add it to your Convex function**:
   ```typescript
   import { SomePackage } from "some-package";
   ```

2. **Convex will automatically install it** when you deploy:
   ```bash
   npx convex deploy
   ```

3. **For local development**, Convex's dev server handles it automatically:
   ```bash
   npx convex dev
   ```

## Environment Variables

Dependencies like Plaid that need API keys should use Convex's environment variables:

```bash
# Set in Convex dashboard or via CLI
npx convex env set PLAID_CLIENT_ID "your_key"
npx convex env set PLAID_SECRET "your_secret"
```

## Summary

- ✅ Convex functions can import npm packages directly
- ✅ No local installation needed
- ✅ Dependencies are managed by Convex automatically
- ✅ Use `npx convex env` for API keys and secrets

