# Fix: Convex Functions Not Found Error

## Error Message

```
Error: [CONVEX Q(ai_stories:getStories)] Server Error
Could not find public function for 'ai_stories:getStories'. 
Did you forget to run `npx convex dev` or `npx convex deploy`?
```

## Cause

This error occurs when:
1. The Convex dev server is not running
2. The functions haven't been synced to Convex
3. The Convex deployment is out of sync with local code

## Solution

### Step 1: Start Convex Dev Server

Open a terminal and run:

```bash
cd /Users/stephenstokes/Downloads/Projects/EZ Financial
npx convex dev
```

This will:
- Start the Convex dev server
- Sync all functions to your Convex deployment
- Watch for file changes and auto-sync
- Generate TypeScript types in `convex/_generated/`

### Step 2: Verify Functions Are Synced

After starting `npx convex dev`, you should see output like:

```
Convex functions:
  - ai_stories:getStories (query)
  - ai_stories:getStoryById (query)
  - ai_stories:generateCompanyStory (action)
  - ai_stories:generateBankerStory (action)
  - ai_stories:generateInvestorStory (action)
  - mock_data:generateThreeMonthsMockData (action)
  - mock_data:getMockDataStatus (query)
  ...
```

### Step 3: Check for Errors

If there are any errors during sync, they will be displayed in the terminal. Common issues:

- **Type errors**: Fix TypeScript errors in `convex/` files
- **Missing dependencies**: Ensure all imports are correct
- **Schema errors**: Check `convex/schema.ts` for issues

### Step 4: Restart Next.js Dev Server

After Convex dev is running, restart your Next.js dev server:

```bash
# Stop current dev server (Ctrl+C)
# Then restart:
pnpm dev
```

## Verification

Once both servers are running:

1. **Check Convex Dashboard**: Go to https://dashboard.convex.dev and verify your functions are listed
2. **Check Browser Console**: The error should disappear
3. **Test the Feature**: Navigate to `/reports` → Stories tab - it should load without errors

## Alternative: Deploy to Production

If you want to deploy to production instead of using dev:

```bash
npx convex deploy --prod
```

**Note**: This deploys to production. Use `npx convex dev` for development.

## Troubleshooting

### Functions Still Not Found

1. **Check file location**: Ensure `convex/ai_stories.ts` exists
2. **Check exports**: Verify functions are exported correctly
3. **Check Convex URL**: Ensure `NEXT_PUBLIC_CONVEX_URL` in `.env.local` matches your deployment
4. **Clear cache**: Try deleting `.next` folder and restarting:
   ```bash
   rm -rf apps/web/.next
   pnpm dev
   ```

### Type Generation Issues

If types aren't generating:

```bash
npx convex codegen
```

This manually regenerates TypeScript types.

## Quick Fix Command

Run this in your project root:

```bash
# Terminal 1: Start Convex dev
npx convex dev

# Terminal 2: Restart Next.js (after Convex is running)
cd apps/web
pnpm dev
```

---

**Status**: This is a deployment/sync issue, not a code issue. The functions exist in the codebase but need to be synced to Convex.
