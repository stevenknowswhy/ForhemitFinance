# CSS Diagnostic Guide

## Current Status
- ✅ Server running on http://localhost:3003
- ✅ `globals.css` imported in `layout.tsx`
- ✅ Tailwind configured correctly
- ✅ PostCSS configured

## Quick Diagnostic Steps

### 1. Visit the Dashboard Page
Open in browser: **http://localhost:3003/dashboard-demo**

### 2. Check Browser DevTools

#### Network Tab:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **CSS**
4. Refresh page (Cmd+R or Ctrl+R)
5. Look for `globals.css` or `app.css` file
6. Check if it loads successfully (status 200)

#### Elements Tab:
1. Inspect any element (right-click → Inspect)
2. Check if Tailwind classes are applied
3. Look for styles in the **Styles** panel
4. Check if CSS variables are defined:
   - `--background`
   - `--foreground`
   - `--card`
   - `--border`

#### Console Tab:
1. Check for any CSS-related errors
2. Run this command to test CSS variables:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--background')
   ```
   Should return: `"0 0% 100%"`

### 3. Verify CSS is Generated

After visiting the page, check:
```bash
ls -la apps/web/.next/static/css/
```

You should see CSS files generated.

### 4. Hard Refresh Browser

If CSS isn't loading:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### 5. Check for CSS Conflicts

In DevTools Elements tab:
1. Inspect an element with `bg-background`
2. Check if the style is:
   - ✅ Applied (green checkmark)
   - ❌ Struck through (means overridden)
   - ❌ Not present (means not generated)

## Common Issues

### Issue: CSS Variables Not Working
**Symptom**: Colors are default/black instead of theme colors

**Solution**:
1. Verify `globals.css` is imported in `layout.tsx` ✅ (Already done)
2. Check CSS variables are defined in `:root` ✅ (Already done)
3. Hard refresh browser

### Issue: Tailwind Classes Not Applied
**Symptom**: Classes like `bg-background` don't work

**Solution**:
1. Check Tailwind content paths include dashboard files ✅ (Already done)
2. Restart dev server (after clearing `.next`)
3. Hard refresh browser

### Issue: Styles Partially Working
**Symptom**: Some styles work, others don't

**Solution**:
1. Check for CSS specificity conflicts
2. Verify all classes are spelled correctly
3. Check browser console for errors

## Test CSS is Working

Add this test element to verify CSS:

```tsx
// In dashboard-demo/page.tsx, add temporarily:
<div className="bg-background text-foreground p-4 border border-border rounded-lg">
  CSS Test: If you see styled box, CSS is working!
</div>
```

If this box has:
- ✅ White background
- ✅ Dark text
- ✅ Border
- ✅ Rounded corners

Then CSS is working! ✅

## Expected Behavior

When CSS is working correctly:
- Background should be white/light (`bg-background`)
- Text should be dark (`text-foreground`)
- Cards should have borders (`border-border`)
- Colors should match shadcn/ui theme
- Hover effects should work
- Transitions should be smooth

## If Still Not Working

1. **Clear all caches**:
   ```bash
   cd apps/web
   rm -rf .next
   pnpm dev
   ```

2. **Check browser console** for errors

3. **Verify CSS file loads** in Network tab

4. **Test in incognito/private window** to rule out extensions

5. **Check if other pages work** (try `/` or `/dashboard`)

## Quick Fix Commands

```bash
# Full reset
cd apps/web
rm -rf .next
pnpm dev

# Then in browser:
# 1. Open http://localhost:3003/dashboard-demo
# 2. Hard refresh (Cmd+Shift+R)
# 3. Check DevTools Network tab for CSS files
```

