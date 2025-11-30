# Clerk JWT Template Setup Guide

## ⚠️ Critical: Required for Convex Authentication

The JWT template is **required** for Convex authentication to work. Without it, you'll see errors like:
- `No JWT template exists with name: convex`
- Convex queries fail
- Dashboard is blank
- User data doesn't sync

---

## Step-by-Step Setup

### 1. Go to Clerk Dashboard

1. Open https://dashboard.clerk.com
2. Sign in to your account
3. Select your application (e.g., **"allowing-cow-9"**)

### 2. Navigate to JWT Templates

1. In the left sidebar, click **"JWT Templates"**
2. If you don't see it, look under **"Configure"** → **"JWT Templates"**

### 3. Create New Template

1. Click **"Create template"** or **"New template"** button
2. **Template name:** Enter exactly: `convex` (lowercase, no quotes)
3. **Token lifetime:** Set to `1 hour` (or your preference)
4. Click **"Create"** or **"Save"**

### 4. Configure Token Claims

In the template settings, add these claims:

| Claim Name | Value | Required? | Notes |
|------------|-------|-----------|-------|
| `aud` | `convex` | ✅ **REQUIRED** | Must match Convex config |
| `email` | `{{user.primary_email_address}}` | ✅ Recommended | Used by Convex to identify users |
| `name` | `{{user.full_name}}` or `{{user.first_name}} {{user.last_name}}` | ✅ Recommended | Used by Convex for display |

**How to add claims:**
1. In the template editor, find the **"Claims"** section
2. Click **"Add claim"** for each claim above
3. Enter the claim name (left side) and the value (right side)
4. Use the exact values from the table above

**Important Notes:**
- ⚠️ **Do NOT add `sub` claim** - Clerk automatically includes it (it's reserved)
- ✅ **`aud` claim is critical** - Must be exactly `"convex"` to match your Convex auth config
- ✅ You can add optional claims like `picture`, `phone_number`, etc.

### 5. Optional Claims

You can also add these optional claims for enhanced functionality:

- `picture` → `{{user.image_url}}`
- `nickname` → `{{user.username}}`
- `given_name` → `{{user.first_name}}`
- `family_name` → `{{user.last_name}}`
- `phone_number` → `{{user.primary_phone_number}}`
- `email_verified` → `{{user.email_verified}}`
- `phone_number_verified` → `{{user.phone_number_verified}}`
- `updated_at` → `{{user.updated_at}}`

### 6. Save and Test

1. Click **"Save"** or **"Update template"**
2. Go back to your app
3. **Restart your Next.js dev server:**
   ```bash
   cd apps/web
   rm -rf .next
   pnpm dev
   ```
4. **Hard refresh** the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
5. The error should be gone!

---

## Understanding JWT Claims

### What Clerk Adds Automatically

Clerk automatically includes these reserved claims (you don't need to add them):
- ✅ `sub` - User ID (automatically set to `{{user.id}}`)
- ✅ `iss` - Issuer (your Clerk domain)
- ✅ `exp` - Expiration time
- ✅ `iat` - Issued at time
- ✅ `nbf` - Not before time

### Critical Requirements

1. **Template name**: Must be exactly `convex` (lowercase)
2. **Audience (`aud`)**: Must be `"convex"` - This matches the `applicationID: "convex"` in your `convex/auth.config.ts`
3. **Issuer**: Must match your Clerk domain (e.g., `https://allowing-cow-9.clerk.accounts.dev`)
4. **Email claim**: Present - Used by Convex to find/create users in the database
5. **Name claim**: Present - Used by Convex for user display

### Example Complete Template

```json
{
  "aud": "convex",                              // ✅ Matches Convex config
  "name": "{{user.full_name}}",                // ✅ Used by Convex
  "email": "{{user.primary_email_address}}",   // ✅ Used by Convex
  "picture": "{{user.image_url}}",             // ✅ Optional
  "nickname": "{{user.username}}",             // ✅ Optional
  "given_name": "{{user.first_name}}",         // ✅ Optional
  "family_name": "{{user.last_name}}",         // ✅ Optional
  "phone_number": "{{user.primary_phone_number}}", // ✅ Optional
  "email_verified": "{{user.email_verified}}",  // ✅ Optional
  "phone_number_verified": "{{user.phone_number_verified}}" // ✅ Optional
}
```

**Note**: The `sub` claim is automatically included by Clerk and should NOT be added manually.

---

## Verification

After setting up the template, verify:

1. ✅ No more `No JWT template exists with name: convex` errors
2. ✅ Dashboard loads properly
3. ✅ Convex queries work
4. ✅ User data syncs to Convex
5. ✅ No `sub` claim errors (it's automatic)

---

## Troubleshooting

### Template Not Working?

1. **Check template name:** Must be exactly `convex` (lowercase, no quotes)
2. **Check `aud` claim:** Must be exactly `"convex"` (matches Convex config)
3. **Don't add `sub` claim:** Clerk includes it automatically
4. **Restart dev server:** After creating template, restart Next.js
5. **Clear browser cache:** Hard refresh or clear cache
6. **Check Clerk dashboard:** Verify template is saved and active

### Still Getting Errors?

1. Check browser console for specific error messages
2. Verify you're using the correct Clerk application
3. Make sure environment variables are set correctly:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_secret
   ```
4. Check that Convex auth config matches your Clerk domain:
   ```typescript
   // convex/auth.config.ts
   export default {
     providers: [
       {
         domain: "https://allowing-cow-9.clerk.accounts.dev",
         applicationID: "convex",
       },
     ],
   };
   ```

### Common Issues

**Issue**: `No JWT template exists with name: convex`
- **Solution**: Create the template in Clerk Dashboard with exact name `convex`

**Issue**: `sub claim is missing`
- **Solution**: Don't add it manually - Clerk includes it automatically

**Issue**: `aud claim mismatch`
- **Solution**: Ensure `aud` claim is exactly `"convex"` and matches your Convex config

---

## What This Does

The JWT template allows Clerk to generate tokens that Convex can verify. 

**Without it:**
- ❌ Convex queries fail
- ❌ Dashboard is blank
- ❌ User data doesn't sync
- ❌ Authentication doesn't work with Convex

**With it:**
- ✅ Convex receives valid JWT tokens
- ✅ Queries work with user context
- ✅ Dashboard loads properly
- ✅ Full authentication flow works

---

## Next Steps After Setup

Once the template is created:

1. **Restart your Next.js dev server**
2. **Hard refresh your browser** (`Cmd+Shift+R` or `Ctrl+Shift+R`)
3. **Sign in again** (if needed)
4. **Dashboard should load properly!**

---

## Related Documentation

- [Clerk Setup Guide](./clerk-setup.md) - Complete Clerk authentication setup
- [Convex Setup Guide](./convex-setup.md) - Convex backend configuration
- [Current Project Status](../06-status-reports/current-status.md) - Overall project status

---

**Last Updated**: December 2024
