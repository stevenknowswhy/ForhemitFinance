# Clerk JWT Template Setup - REQUIRED

## ⚠️ Critical: This Must Be Done for Convex Authentication to Work

The error `No JWT template exists with name: convex` means you need to create a JWT template in your Clerk Dashboard.

## Step-by-Step Instructions

### 1. Go to Clerk Dashboard

1. Open https://dashboard.clerk.com
2. Sign in to your account
3. Select your application: **"allowing-cow-9"** (or your app name)

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

| Claim Name | Value | Required? |
|------------|-------|----------|
| `aud` | `convex` | ✅ **REQUIRED** (must match Convex config) |
| `email` | `{{user.primary_email_address}}` | ✅ Recommended |
| `name` | `{{user.full_name}}` or `{{user.first_name}} {{user.last_name}}` | ✅ Recommended |

**Important Notes:**
- ⚠️ **Do NOT add `sub` claim** - Clerk automatically includes it (it's reserved)
- ✅ **`aud` claim is critical** - Must be exactly `"convex"` to match your Convex auth config
- ✅ You can add optional claims like `picture`, `phone_number`, etc.

**How to add claims:**
1. In the template editor, find the **"Claims"** section
2. Click **"Add claim"** for each claim above
3. Enter the claim name (left side) and the value (right side)
4. Use the exact values from the table above

### 5. Save and Test

1. Click **"Save"** or **"Update template"**
2. Go back to your app
3. **Hard refresh** the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
4. The error should be gone!

## Verification

After setting up the template:

1. ✅ No more `No JWT template exists with name: convex` errors
2. ✅ Dashboard loads properly
3. ✅ Convex queries work
4. ✅ User data syncs to Convex

## Alternative: Quick Setup via Clerk Dashboard URL

Direct link (replace with your app):
```
https://dashboard.clerk.com/apps/[YOUR_APP_ID]/jwt-templates
```

## Troubleshooting

### Template Not Working?

1. **Check template name:** Must be exactly `convex` (lowercase)
2. **Check claims:** Make sure `sub` claim uses `{{user.id}}`
3. **Restart dev server:** After creating template, restart Next.js
4. **Clear browser cache:** Hard refresh or clear cache
5. **Check Clerk dashboard:** Verify template is saved and active

### Still Getting Errors?

1. Check browser console for specific error messages
2. Verify you're using the correct Clerk application
3. Make sure environment variables are set correctly
4. Check that Convex auth config matches your Clerk domain

## What This Does

The JWT template allows Clerk to generate tokens that Convex can verify. Without it:
- ❌ Convex queries fail
- ❌ Dashboard is blank
- ❌ User data doesn't sync
- ❌ Authentication doesn't work with Convex

With it:
- ✅ Convex receives valid JWT tokens
- ✅ Queries work with user context
- ✅ Dashboard loads properly
- ✅ Full authentication flow works

## Next Steps After Setup

Once the template is created:
1. Restart your Next.js dev server
2. Hard refresh your browser
3. Sign in again
4. Dashboard should load properly!

