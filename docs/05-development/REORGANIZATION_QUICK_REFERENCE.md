# Codebase Reorganization - Quick Reference

## 📋 Summary

**Total Files to Move:** 25 files  
**New Directories:** 2 directories  
**Priority:** Medium (improves organization, low risk)

## 🎯 Quick Action Checklist

### ✅ Phase 1: Create Directories
- [ ] Create `docs/05-development/refactoring/`
- [ ] Create `assets/screenshots/` or `docs/assets/screenshots/`

### ✅ Phase 2: Move Documentation (15 files)

**Refactoring Docs → `docs/05-development/refactoring/`** (10 files)
- [ ] REFACTORING_SUMMARY.md
- [ ] REFACTORING_STATUS_COMPLETE.md
- [ ] REFACTORING_STATUS.md
- [ ] REFACTORING_PROGRESS_AI_ENTRIES.md
- [ ] REFACTORING_PROGRESS_AI_STORIES.md
- [ ] REFACTORING_PROGRESS_REPORTS.md
- [ ] REFACTORING_PROGRESS.md
- [ ] REFACTORING_REPORTS_PLAN.md
- [ ] REFACTORING_PROMPT_TEMPLATE.md
- [ ] REFACTORING_ANALYSIS.md

**Status Reports → `docs/06-status-reports/`** (2 files)
- [ ] IMPLEMENTATION_STATUS_UPDATED.md
- [ ] IMPLEMENTATION_STATUS.md

**Feature Docs → `docs/05-development/`** (3 files)
- [ ] BACKGROUND_GENERATION_IMPLEMENTATION.md
- [ ] BOOLEAN_REFACTORING_IMPLEMENTATION.md → `docs/05-development/refactoring/`
- [ ] BOOLEAN_REFACTORING_REPORT.md → `docs/05-development/refactoring/`

**Test Results → `docs/08-testing/`** (2 files)
- [ ] AI_MODULE_TEST_RESULTS.md
- [ ] TEST_RESULTS_SUMMARY.md

### ✅ Phase 3: Move Test & Script Files (8 files)

**Root → Scripts** (1 file)
- [ ] test-ai-module.js → `scripts/test-ai-module.js`

**Scripts → Tests** (7 files)
- [ ] scripts/test-ai-functions.ts → `tests/integration/ai-functions.test.ts`
- [ ] scripts/test-stories-and-reports-comprehensive.ts → `tests/integration/stories-and-reports-comprehensive.test.ts`
- [ ] scripts/test-story-generation-comprehensive.ts → `tests/integration/story-generation-comprehensive.test.ts`
- [ ] scripts/test-story-generation.ts → `tests/integration/story-generation.test.ts`
- [ ] scripts/validate-stories.ts → `tests/utils/validation/validate-stories.ts`
- [ ] scripts/verify-story-functions.ts → `tests/integration/verify-story-functions.test.ts`
- [ ] scripts/README-TESTING.md → `tests/integration/README-TESTING.md`

**Apps/Web → Scripts** (1 file)
- [ ] apps/web/update-stripe-prices.sh → `scripts/update-stripe-prices.sh`

### ✅ Phase 4: Move Assets (1 file)
- [ ] assets/Screenshot_*.png → `assets/screenshots/` or `docs/assets/screenshots/`

### ✅ Phase 5: Update References
- [ ] Update paths in `tests/integration/README-TESTING.md` after move
- [ ] Verify `pnpm test` still works
- [ ] Check CI/CD test paths
- [ ] Update any documentation links

## 📝 Files to Keep in Place

- ✅ `apps/web/tests/setup.ts` - Next.js-specific, different from root setup
- ✅ `CHANGELOG.md` - Standard root location
- ✅ `README.md` - Standard root location
- ✅ All config files in root (package.json, turbo.json, etc.)

## 🔍 Key Findings

1. **Root directory cleanup:** 15+ markdown files should be organized into `docs/`
2. **Test organization:** 6 test files in `scripts/` should be in `tests/integration/`
3. **Clear separation:** Scripts (automation) vs Tests (validation) needs better separation
4. **Documentation structure:** Well-organized `docs/` structure should be followed consistently

---

See `REORGANIZATION_PLAN.md` for detailed reasoning and analysis.

