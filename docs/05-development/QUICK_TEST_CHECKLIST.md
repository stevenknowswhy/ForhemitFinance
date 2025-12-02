# Quick Test Checklist

A condensed checklist for quick testing of Phase 1 implementation.

## 🚀 Quick Start

1. **Start dev servers**
   ```bash
   # Terminal 1: Convex
   npx convex dev
   
   # Terminal 2: Next.js
   npm run dev  # or pnpm dev
   ```

2. **Run migration (in Convex dashboard)**
   - Go to Functions → `migrations.phase1_multi_tenant.createDefaultPlans`
   - Run with `{}`
   - Then run `migrateUsersToOrgs` with `{}`
   - Then run `migrateDataToOrgScoped` with `{}`

3. **Test in browser**
   - Sign in
   - Check org switcher appears in header
   - Verify dashboard loads
   - Switch orgs (if you have multiple)

## ✅ Essential Tests

### Backend (Convex Dashboard)

- [ ] **Default plans created**
  - Run: `migrations.phase1_multi_tenant.createDefaultPlans`
  - Check: Returns `{ created: 3 }`

- [ ] **Users migrated to orgs**
  - Run: `migrations.phase1_multi_tenant.migrateUsersToOrgs`
  - Check: Returns `{ migrated: X }`
  - Verify: `organizations` table has entries
  - Verify: `memberships` table has entries

- [ ] **Data migrated**
  - Run: `migrations.phase1_multi_tenant.migrateDataToOrgScoped`
  - Check: Returns migration stats
  - Verify: Sample records have `orgId` set

- [ ] **Get user orgs**
  - Run: `organizations.getUserOrganizations`
  - Pass: `{ userId: "your-user-id" }`
  - Check: Returns array of orgs

- [ ] **Get accounts (org-scoped)**
  - Run: `accounts.getAll`
  - Pass: `{ orgId: "your-org-id" }`
  - Check: Returns accounts for that org only

### Frontend (Browser)

- [ ] **Org switcher visible**
  - Location: Top navigation bar
  - Shows: Current org name
  - Can click: Opens dropdown

- [ ] **Org context loads**
  - Open browser console
  - Check: No errors
  - Check: Org data loads

- [ ] **Dashboard works**
  - Navigate to `/dashboard`
  - Check: Data displays
  - Check: No errors in console

- [ ] **Org switching works**
  - Click org switcher
  - Select different org (if available)
  - Check: Data updates
  - Check: Selection persists on refresh

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "User has no active organizations" | Run `migrateUsersToOrgs` |
| Org switcher not showing | Check `OrgContextProvider` in layout |
| Data not showing | Verify `orgId` passed to queries |
| Migration fails | Check plans exist first |

## 📊 Success Criteria

✅ All migration steps complete without errors  
✅ Org switcher appears and works  
✅ Dashboard loads with org-scoped data  
✅ Can switch between orgs (if multiple)  
✅ No console errors  
✅ Data isolation works (no cross-org leakage)

## Next Steps

If all tests pass:
1. Continue updating remaining queries
2. Add more test coverage
3. Deploy to production (when ready)

If tests fail:
1. Check error messages
2. Review `PHASE1_TESTING_GUIDE.md` for detailed troubleshooting
3. Fix issues before continuing
