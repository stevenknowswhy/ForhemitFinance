# Initialize Convex - Step by Step Guide

## Quick Start

Run this command in your terminal:

```bash
cd /Users/stephenstokes/Downloads/Projects/EZ\ Financial
npx convex dev
```

## What Will Happen

1. **First Time Setup**:
   - You'll be prompted to log in or create a Convex account
   - You can sign in with GitHub, Google, or email
   - After logging in, you'll be asked to create a new project or select an existing one

2. **Project Configuration**:
   - Choose a project name (e.g., "ez-financial")
   - Select a region (choose closest to your users)
   - Convex will create your deployment

3. **Code Generation**:
   - Convex will scan your `convex/` directory
   - Generate `convex/_generated/api.d.ts` and `server.d.ts`
   - These files contain type-safe references to all your functions

4. **Development Mode**:
   - Convex will watch for file changes
   - Automatically push updates to your dev deployment
   - Regenerate types when you modify functions

## After Initialization

Once initialized, you'll have:

- ✅ A Convex project URL (like `https://your-project.convex.cloud`)
- ✅ Generated type files in `convex/_generated/`
- ✅ A `.convex/` directory with project configuration
- ✅ Environment variables set up

## Environment Variables Needed

After initialization, create `convex/.env.local` with:

```env
# Convex URL (will be set automatically, but you can override)
CONVEX_URL=https://your-project.convex.cloud

# Clerk JWT issuer (for authentication)
CLERK_JWT_ISSUER_DOMAIN=https://allowing-cow-9.clerk.accounts.dev

# Plaid credentials (get from Plaid dashboard)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
```

## Troubleshooting

### If you get "Cannot prompt for input in non-interactive terminals"

Run the command directly in your terminal (not through a script):
```bash
npx convex dev
```

### If you need to stop the dev server

Press `Ctrl+C` in the terminal

### If you want to run once without watching

```bash
npx convex dev --once
```

This will:
- Initialize/configure the project
- Generate types
- Push code once
- Exit (no watching)

## Next Steps After Initialization

1. **Update `apps/web/.env.local`** with:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```

2. **Test the build**:
   ```bash
   cd apps/web
   pnpm run build
   ```

3. **Start development**:
   ```bash
   # Terminal 1: Convex dev server
   npx convex dev
   
   # Terminal 2: Next.js dev server
   cd apps/web
   pnpm dev
   ```

