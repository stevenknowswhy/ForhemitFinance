# Fix Dashboard Issues - Complete Guide

## ✅ All Code Fixes Applied

The code has been updated to handle errors gracefully. However, you **must** complete the Clerk JWT template setup for full functionality.

## 🔧 Quick Fix (5 minutes)

### Step 1: Create Clerk JWT Template

1. **Open Clerk Dashboard:**
   - Go to: https://dashboard.clerk.com
   - Sign in
   - Select app: **allowing-cow-9**

2. **Create JWT Template:**
   - Click **"JWT Templates"** in left sidebar
   - Click **"Create template"**
   - **Name:** `convex` (exactly, lowercase)
   - **Lifetime:** 1 hour
   - Click **"Create"**

3. **Add Claims:**
   Click **"Add claim"** for each:
   
   | Claim | Value |
   |-------|-------|
   | `sub` | `{{user.id}}` |
   | `email` | `{{user.primary_email_address}}` |
   | `name` | `{{user.first_name}} {{user.last_name}}` |

4. **Save** the template

### Step 2: Restart Everything

```bash
# Stop dev server (Ctrl+C)
cd apps/web
rm -rf .next  # Clear cache
pnpm dev      # Restart
```

### Step 3: Test

1. **Hard refresh browser:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Sign in** to your app
3. **Navigate to** `/dashboard`
4. **Verify:**
   - ✅ No console errors
   - ✅ Dashboard loads with content
   - ✅ No "JWT template" errors

## 📋 What Was Fixed

### Code Changes

1. **ConvexClientProvider.tsx**
   - ✅ Handles missing JWT template gracefully
   - ✅ Falls back to default token
   - ✅ Shows helpful error messages
   - ✅ Doesn't crash the app

2. **dashboard/page.tsx**
   - ✅ Handles undefined Convex queries
   - ✅ Shows user info even when Convex fails
   - ✅ Displays helpful error messages
   - ✅ No more blank screen

### Error Handling

- ✅ All errors are caught and displayed
- ✅ User-friendly error messages
- ✅ Clear instructions for fixing issues
- ✅ App continues to work (with limited functionality) when Convex auth fails

## 🧪 Testing Checklist

After creating JWT template:

- [ ] No `No JWT template exists` errors in console
- [ ] Dashboard loads with content
- [ ] User name/email displays correctly
- [ ] Convex queries work (onboarding status loads)
- [ ] No blank screens
- [ ] No 404 errors from Clerk

## ⚠️ Important Notes

1. **JWT Template Name:** Must be exactly `convex` (lowercase)
2. **Claims:** The `sub` claim is critical - must use `{{user.id}}`
3. **Cache:** Always clear `.next` cache after template setup
4. **Browser:** Hard refresh to clear browser cache

## 🐛 Troubleshooting

### Still Getting JWT Template Error?

1. **Verify template name:** Must be exactly `convex` (check spelling)
2. **Check template is saved:** Go back to Clerk dashboard and verify
3. **Restart dev server:** Stop and start again
4. **Clear all caches:**
   ```bash
   rm -rf .next
   # Then hard refresh browser
   ```

### Dashboard Still Blank?

1. **Check browser console** for specific errors
2. **Verify Convex is running:** `npx convex dev` should be running
3. **Check environment variables:** All should be set in `.env.local`
4. **Verify you're signed in:** Check Clerk authentication status

### Convex Queries Not Working?

1. **Check Convex dev server:** Should be running in separate terminal
2. **Verify Convex URL:** Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
3. **Check Convex auth config:** Verify `convex/auth.config.ts` has correct Clerk domain
4. **Check JWT template:** Must be created and saved in Clerk

## 📚 Additional Resources

- **Detailed JWT Template Setup:** See `CLERK_JWT_TEMPLATE_SETUP.md`
- **Dashboard Fix Details:** See `apps/web/DASHBOARD_FIX_SUMMARY.md`
- **Clerk Documentation:** https://clerk.com/docs/backend-requests/making/jwt-templates

## ✅ Success Criteria

Your dashboard is working correctly when:

1. ✅ No console errors
2. ✅ Dashboard loads with user information
3. ✅ Convex queries execute successfully
4. ✅ Onboarding status displays
5. ✅ All features are accessible

## 🚀 Next Steps

Once JWT template is set up:

1. ✅ Dashboard will work fully
2. ✅ Convex queries will work
3. ✅ User data will sync
4. ✅ All features will be accessible

**The app is now resilient and will guide you through any remaining setup issues!**

