# EZ Financial Web App

Next.js web application for EZ Financial, built with the App Router, TypeScript, Clerk authentication, and Convex backend.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the `apps/web/` directory:

```env
# Convex Deployment URL
NEXT_PUBLIC_CONVEX_URL=https://silent-reindeer-986.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

**Get your Clerk keys:**
1. Go to https://dashboard.clerk.com
2. Select your application (or create one)
3. Go to API Keys
4. Copy your Publishable Key and Secret Key

**Get your Convex URL:**
- Run `npx convex dev` in the `convex/` directory
- Or find it in the Convex dashboard

### 3. Set Up Convex Backend

In a separate terminal, navigate to the convex directory:

```bash
cd ../../convex
npx convex dev
```

Keep this running - it syncs your backend code.

### 4. Configure Convex Auth

In the `convex/` directory, create or update `.env.local`:

```env
CLERK_JWT_ISSUER_DOMAIN=https://allowing-cow-9.clerk.accounts.dev
```

Or update `convex/auth.config.ts` with your Clerk domain.

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Authentication Flow

1. **User signs up/signs in** via Clerk components (`/sign-in`, `/sign-up`)
2. **Clerk middleware** (`middleware.ts`) protects routes
3. **User data syncs** to Convex via `createOrUpdateUser` mutation
4. **Convex queries** use Clerk identity via `ctx.auth.getUserIdentity()`

## Project Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── components/
│   │   ├── Header.tsx          # Navigation with auth buttons
│   │   └── ProtectedRoute.tsx  # Route protection wrapper
│   ├── dashboard/
│   │   └── page.tsx            # Protected dashboard
│   ├── ConvexClientProvider.tsx
│   ├── layout.tsx              # Root layout with ClerkProvider
│   └── page.tsx                # Landing page
├── middleware.ts               # Clerk middleware
└── .env.local                  # Environment variables (not tracked)
```

## Using Authentication

### In Components

```typescript
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function MyComponent() {
  const { user } = useUser();
  const { userId } = useAuth();
  
  // Query Convex data (automatically uses Clerk identity)
  const data = useQuery(api.myFunction.get);
  
  return <div>Hello, {user?.firstName}</div>;
}
```

### In Convex Functions

```typescript
import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // Get Clerk identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Use identity.email, identity.name, etc.
    // ...
  },
});
```

## Protected Routes

Use the `ProtectedRoute` component or check auth in the page:

```typescript
"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) {
    router.push("/sign-in");
    return null;
  }
  
  return <div>Protected content</div>;
}
```

## Clerk Components

- `<SignInButton>` - Sign in button
- `<SignUpButton>` - Sign up button
- `<UserButton>` - User menu/avatar
- `<SignedIn>` - Show when signed in
- `<SignedOut>` - Show when signed out
- `<SignIn>` - Full sign-in page component
- `<SignUp>` - Full sign-up page component

## Next Steps

1. ✅ Clerk authentication set up
2. ✅ Convex integration
3. ⏭️ Connect Plaid for bank accounts
4. ⏭️ Build transaction approval UI
5. ⏭️ Add burn rate dashboard
6. ⏭️ Implement investor reports

## Troubleshooting

### "Clerk not configured"

- Make sure `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Restart the dev server after adding env variables

### "Not authenticated" in Convex

- Make sure Convex auth is configured with Clerk domain
- Check `convex/auth.config.ts` or `.env.local` in convex directory
- Verify Clerk keys are correct

### Type errors

- Run `npx convex dev` to regenerate types
- Make sure `@clerk/nextjs` is installed
- Restart TypeScript server in your IDE
