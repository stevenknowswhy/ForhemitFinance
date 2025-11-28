# Clerk Authentication Setup Guide

## Quick Setup

### 1. Install Clerk

```bash
cd apps/web
pnpm add @clerk/nextjs
```

### 2. Configure Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YWxsb3dpbmctY293LTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_4dYWAjwFomjpxR3cSZojyXw8AzS6kZY08fbcan33Er
NEXT_PUBLIC_CONVEX_URL=https://silent-reindeer-986.convex.cloud
```

### 3. Configure Convex to Use Clerk

In `convex/` directory, create or update `.env.local`:

```env
CLERK_JWT_ISSUER_DOMAIN=https://allowing-cow-9.clerk.accounts.dev
```

Or update `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: "https://allowing-cow-9.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

### 4. Set Up Clerk JWT Template (Important!)

In your Clerk Dashboard:

1. Go to **JWT Templates**
2. Create a new template named `convex`
3. Set the token lifetime (e.g., 1 hour)
4. Add claims:
   - `sub` → `{{user.id}}`
   - `email` → `{{user.primary_email_address}}`
   - `name` → `{{user.first_name}} {{user.last_name}}`

This allows Convex to receive Clerk authentication tokens.

## What's Already Set Up

✅ **Middleware** (`apps/web/middleware.ts`)
- Uses `clerkMiddleware()` to protect routes
- Handles authentication for all pages

✅ **Layout** (`apps/web/app/layout.tsx`)
- Wrapped with `<ClerkProvider>`
- Provides auth context to entire app

✅ **Convex Integration** (`apps/web/app/ConvexClientProvider.tsx`)
- Passes Clerk JWT tokens to Convex
- Enables authenticated Convex queries

✅ **Auth Pages**
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page

✅ **Components**
- `<Header>` - Navigation with auth buttons
- `<ProtectedRoute>` - Route protection wrapper

✅ **Convex Functions**
- `users.getCurrentUser` - Gets user from Clerk identity
- `users.createOrUpdateUser` - Syncs Clerk user to Convex

## Testing Authentication

1. **Start the app:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Visit the landing page:**
   - http://localhost:3000
   - Should show "Sign In" and "Get Started" buttons

3. **Sign up:**
   - Click "Get Started"
   - Use test email: `your_email+clerk_test@example.com`
   - Use test code: `424242` (for email verification)

4. **Visit dashboard:**
   - http://localhost:3000/dashboard
   - Should show your name and dashboard content

5. **Check Convex:**
   - User should be created in Convex `users` table
   - Can query user data via `api.users.getCurrentUser`

## Using Authentication in Components

### Get Current User

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Hello, {user.firstName}!</div>;
}
```

### Protect Routes

```typescript
"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) return null;
  
  return <div>Protected content</div>;
}
```

### Use in Convex Queries

```typescript
import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // identity.email, identity.name, etc. are available
    // ...
  },
});
```

## Clerk Components Available

- `<SignInButton>` - Sign in button
- `<SignUpButton>` - Sign up button  
- `<UserButton>` - User menu/avatar
- `<SignedIn>` - Render when signed in
- `<SignedOut>` - Render when signed out
- `<SignIn>` - Full sign-in page
- `<SignUp>` - Full sign-up page

## Troubleshooting

### "Clerk not configured"

- Check `.env.local` has both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Restart dev server after adding env variables
- Verify keys are correct in Clerk dashboard

### "Not authenticated" in Convex

- Make sure Convex auth config includes Clerk domain
- Check `convex/auth.config.ts` or `.env.local` in convex directory
- Verify Clerk JWT template is set up (named "convex")
- Check that `ConvexClientProvider` is passing tokens correctly

### User not syncing to Convex

- Check that `createOrUpdateUser` mutation is called after sign-in
- Verify Convex auth is configured correctly
- Check browser console for errors

### Type errors

- Run `npx convex dev` to regenerate types
- Make sure `@clerk/nextjs` is installed
- Restart TypeScript server in IDE

## Next Steps

1. ✅ Clerk authentication integrated
2. ✅ Convex auth configured
3. ⏭️ Add user onboarding flow
4. ⏭️ Connect Plaid for bank accounts
5. ⏭️ Build transaction approval UI

