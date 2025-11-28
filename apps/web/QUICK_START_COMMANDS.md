# Quick Start Commands

## ✅ Dev Server is Running

Your dev server is now running on: **http://localhost:3002**

## Correct Commands (You're Already in apps/web)

Since you're already in the `apps/web` directory, use these commands:

```bash
# Clear cache
rm -rf .next

# Start dev server
pnpm dev
```

**Note:** Don't include comments (`#`) in the same line as commands. Run them separately.

## If You Need to Navigate

If you're in a different directory:

```bash
# Navigate to web app
cd "/Users/stephenstokes/Downloads/Projects/EZ Financial/apps/web"

# Then run commands
rm -rf .next
pnpm dev
```

## Current Status

- ✅ Cache cleared
- ✅ Dev server running on port 3002
- ✅ Ready to test

## Next Steps

1. **Open browser:** http://localhost:3002
2. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Create JWT template** in Clerk Dashboard (see `CLERK_JWT_TEMPLATE_SETUP.md`)
4. **Test dashboard** - should work after JWT template is created

## Stop Server

To stop the dev server:
```bash
# Find the process
ps aux | grep "next dev"

# Kill it (replace PID with actual process ID)
kill <PID>
```

Or just press `Ctrl+C` in the terminal where it's running.

