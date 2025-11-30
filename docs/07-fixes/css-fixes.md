# CSS Not Applying - Fix Guide

## Issue
CSS styles are not being applied to the dashboard app as expected.

## Root Cause Analysis

### ✅ Verified Working:
1. `globals.css` is imported in `app/layout.tsx`
2. Tailwind CSS is installed (`tailwindcss@^3.3.0`)
3. PostCSS is configured correctly
4. CSS variables are defined in `globals.css`
5. Tailwind config includes all content paths
6. `cn()` utility function exists

### Potential Issues:
1. **Build Cache**: Next.js cache might be stale
2. **CSS Variables**: CSS variables might not be loading
3. **Content Paths**: Tailwind might not be scanning all files

## Fixes Applied

### 1. Cleared Next.js Cache ✅
```bash
rm -rf .next
```

### 2. Updated Tailwind Content Paths ✅
Added explicit path for dashboard-demo:
```js
content: [
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/dashboard-demo/**/*.{js,ts,jsx,tsx,mdx}", // Explicit path
],
```

## Next Steps

### 1. Restart Dev Server
```bash
cd apps/web
rm -rf .next  # Already done
pnpm dev
```

### 2. Verify CSS is Loading
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by CSS
4. Check if `globals.css` is loaded
5. Check if styles are in the `<style>` tag in `<head>`

### 3. Check CSS Variables
In browser console, run:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--background')
// Should return: "0 0% 100%"
```

### 4. Verify Tailwind Classes
Check if Tailwind classes are being generated:
- Open browser DevTools
- Inspect an element with `bg-background`
- Check if the class exists in the stylesheet

## Common Issues & Solutions

### Issue: CSS Variables Not Working
**Solution**: Ensure `globals.css` is imported before any component styles

### Issue: Tailwind Classes Not Generated
**Solution**: 
1. Check `tailwind.config.js` content paths
2. Restart dev server
3. Clear `.next` cache

### Issue: Styles Not Applying
**Solution**:
1. Check browser cache (hard refresh: Cmd+Shift+R)
2. Verify CSS is loaded in Network tab
3. Check for CSS conflicts

## Verification Checklist

- [ ] `globals.css` imported in `layout.tsx`
- [ ] Tailwind installed
- [ ] PostCSS configured
- [ ] Content paths correct
- [ ] `.next` cache cleared
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] CSS loaded in browser
- [ ] CSS variables working

## Test Commands

```bash
# Clear cache and restart
cd apps/web
rm -rf .next
pnpm dev

# Check if CSS is generated
ls -la .next/static/css/

# Verify Tailwind config
cat tailwind.config.js
```

## Expected Behavior

After fixes:
- ✅ `bg-background` should apply white background
- ✅ `text-muted-foreground` should apply gray text
- ✅ `bg-card` should apply card background
- ✅ `border-border` should apply border color
- ✅ All CSS variables should work

## If Still Not Working

1. **Check Browser Console** for CSS errors
2. **Check Network Tab** for failed CSS requests
3. **Verify CSS Variables** are defined correctly
4. **Check for CSS Conflicts** with other stylesheets
5. **Try Hard Refresh** (Cmd+Shift+R or Ctrl+Shift+R)

