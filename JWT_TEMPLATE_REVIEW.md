# JWT Template Review & Fix

## ✅ What's Correct

1. **Name**: `convex` ✅ - Perfect
2. **Token lifetime**: 3600 seconds (1 hour) ✅ - Good
3. **Issuer**: `https://allowing-cow-9.clerk.accounts.dev` ✅ - Matches your config
4. **JWKS Endpoint**: `https://allowing-cow-9.clerk.accounts.dev/.well-known/jwks.json` ✅ - Standard
5. **Audience (`aud`)**: `"convex"` ✅ - Matches your Convex auth config
6. **Email claim**: `{{user.primary_email_address}}` ✅ - Good
7. **Name claim**: `{{user.full_name}}` ✅ - Good

## ❌ Critical Issue: Missing `sub` Claim

**You're missing the `sub` (subject) claim!** This is **required** for JWT tokens to work with Convex.

The `sub` claim should contain the user's unique identifier (Clerk user ID).

## 🔧 Required Fix

Add this claim to your JWT template:

```json
{
  "sub": "{{user.id}}",
  "aud": "convex",
  "name": "{{user.full_name}}",
  "email": "{{user.primary_email_address}}",
  "picture": "{{user.image_url}}",
  "nickname": "{{user.username}}",
  "given_name": "{{user.first_name}}",
  "updated_at": "{{user.updated_at}}",
  "family_name": "{{user.last_name}}",
  "phone_number": "{{user.primary_phone_number}}",
  "email_verified": "{{user.email_verified}}",
  "phone_number_verified": "{{user.phone_number_verified}}"
}
```

## 📋 Step-by-Step Fix

1. **In Clerk Dashboard**, go to your JWT template
2. **Find the Claims section**
3. **Add a new claim:**
   - **Claim name**: `sub`
   - **Value**: `{{user.id}}`
4. **Make sure `sub` is at the top** (or at least present)
5. **Save** the template

## ✅ Complete Claims List (Recommended)

Here's the complete, corrected claims list:

| Claim | Value | Required? |
|-------|-------|-----------|
| `sub` | `{{user.id}}` | ✅ **REQUIRED** |
| `aud` | `convex` | ✅ Required (matches Convex config) |
| `email` | `{{user.primary_email_address}}` | ✅ Recommended |
| `name` | `{{user.full_name}}` | ✅ Recommended |
| `picture` | `{{user.image_url}}` | Optional |
| `nickname` | `{{user.username}}` | Optional |
| `given_name` | `{{user.first_name}}` | Optional |
| `family_name` | `{{user.last_name}}` | Optional |
| `email_verified` | `{{user.email_verified}}` | Optional |
| `phone_number` | `{{user.primary_phone_number}}` | Optional |
| `phone_number_verified` | `{{user.phone_number_verified}}` | Optional |
| `updated_at` | `{{user.updated_at}}` | Optional |

## 🎯 Why `sub` is Critical

- **JWT Standard**: The `sub` (subject) claim is a standard JWT claim that identifies the user
- **Convex Requirement**: Convex uses this to identify and authenticate users
- **User Identity**: Without it, Convex can't properly map tokens to users
- **Security**: It ensures tokens are tied to specific user accounts

## ✅ After Adding `sub` Claim

1. **Save** the template in Clerk Dashboard
2. **Restart** your Next.js dev server
3. **Hard refresh** browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. **Test** the dashboard - should work perfectly!

## Current Status

- ✅ Template name: Correct
- ✅ Token lifetime: Good
- ✅ Issuer/JWKS: Correct
- ✅ Audience: Correct
- ✅ Email/Name: Good
- ❌ **Missing `sub` claim** - **MUST ADD THIS**

Once you add the `sub` claim, your JWT template will be perfect!

