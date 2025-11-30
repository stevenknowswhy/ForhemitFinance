# Setup Guide: Connecting Convex to Next.js

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Convex account (sign up at https://convex.dev)

## Step 1: Set Up Convex Backend

Navigate to the convex directory:

```bash
cd convex
```

Run Convex dev (this will prompt you to log in and create a project):

```bash
npx convex dev
```

This will:
- Create a Convex project (if you don't have one)
- Generate TypeScript types in `convex/_generated/`
- Start syncing your backend functions
- Give you a deployment URL (like `https://silent-reindeer-986.convex.cloud`)

**Important:** Keep this terminal running. It syncs your backend code to Convex.

## Step 2: Configure Environment Variables

In the `apps/web/` directory, create a `.env.local` file:

```bash
cd ../apps/web
cp .env.local.example .env.local
```

Edit `.env.local` and add your Convex deployment URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://silent-reindeer-986.convex.cloud
```

You can find your deployment URL:
- In the output of `npx convex dev`
- In the Convex dashboard: https://dashboard.convex.dev

## Step 3: Install Web App Dependencies

Make sure you're in the `apps/web/` directory:

```bash
pnpm install
```

## Step 4: Start the Development Server

In a new terminal (keep the Convex dev terminal running), start Next.js:

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Step 5: Verify Connection

The app should now be connected to Convex. You can test this by:

1. Creating a simple query in `convex/` (like `convex/test.ts`)
2. Using `useQuery` in a component to fetch data
3. Checking the browser console for any connection errors

## Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL is not defined"

- Make sure `.env.local` exists in `apps/web/`
- Make sure the variable name starts with `NEXT_PUBLIC_`
- Restart the Next.js dev server after adding env variables

### "Cannot connect to Convex"

- Make sure `npx convex dev` is running in another terminal
- Check that the deployment URL in `.env.local` matches your Convex project
- Verify your Convex project is active in the dashboard

### Type Errors

- Run `npx convex dev` to regenerate types
- Make sure `convex/_generated/api.d.ts` exists
- Restart your TypeScript server in your IDE

## Next Steps

Once connected, you can:

1. **Query data**: Use `useQuery(api.yourFunction.get)` in components
2. **Mutate data**: Use `useMutation(api.yourFunction.update)` in components
3. **Build UI**: Create components that display your Convex data
4. **Add auth**: Set up authentication with Clerk or Auth0

## Project Structure

```
ez-financial/
├── convex/              # Backend (Convex functions)
│   ├── schema.ts       # Database schema
│   ├── transactions.ts # Transaction functions
│   └── _generated/     # Auto-generated types
├── apps/
│   └── web/            # Next.js frontend
│       ├── app/        # App Router pages
│       └── .env.local   # Environment variables
└── packages/           # Shared packages
```

## Useful Commands

```bash
# Start Convex backend (in convex/ directory)
npx convex dev

# Start Next.js frontend (in apps/web/ directory)
pnpm dev

# Generate Convex types
npx convex dev --once

# Deploy Convex to production
npx convex deploy
```

