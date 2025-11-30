# Convex Plaid Import Fix

## Problem
`npx convex dev` hangs because Convex tries to bundle the `plaid` package at build time, but it's not available in the Convex runtime environment.

## Solution
Use dynamic imports (`await import("plaid")`) instead of static imports. This allows Convex to bundle the code without requiring the package to be available at build time.

## Status
✅ Fixed - All `getPlaidClient()` calls now use `await` and Plaid SDK is loaded dynamically.

## Testing
Run: `npx convex dev`

It should now bundle successfully without hanging.

