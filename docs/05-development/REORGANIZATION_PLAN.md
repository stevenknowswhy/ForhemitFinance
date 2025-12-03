# Codebase Reorganization Plan

**Date:** 2025-01-27  
**Status:** Analysis Complete - Ready for Review

## 📊 Organizational Principles Identified

The codebase follows these organizational patterns:

1. **Feature-based organization** in `convex/` (e.g., `ai_entries/`, `ai_stories/`, `transactions/`)
2. **Route-based organization** in `apps/web/app/` (Next.js App Router)
3. **Categorized documentation** in `docs/` with numbered prefixes (01-getting-started, 02-integrations, etc.)
4. **Test mirroring** in `tests/` matching source structure (unit/, integration/, e2e/)
5. **Shared packages** in `packages/` for reusable code
6. **Scripts** in `scripts/` for utility and automation scripts

## 🔍 Files Requiring Reorganization

### 1. Root Directory - Refactoring Documentation

**Current Location:** Root directory  
**Issue:** Multiple refactoring-related markdown files cluttering root

#### Files to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `REFACTORING_SUMMARY.md` | `docs/05-development/refactoring/REFACTORING_SUMMARY.md` | Development documentation about refactoring work |
| `REFACTORING_STATUS_COMPLETE.md` | `docs/05-development/refactoring/REFACTORING_STATUS_COMPLETE.md` | Development status report |
| `REFACTORING_STATUS.md` | `docs/05-development/refactoring/REFACTORING_STATUS.md` | Development status report |
| `REFACTORING_PROGRESS_AI_ENTRIES.md` | `docs/05-development/refactoring/REFACTORING_PROGRESS_AI_ENTRIES.md` | Feature-specific refactoring progress |
| `REFACTORING_PROGRESS_AI_STORIES.md` | `docs/05-development/refactoring/REFACTORING_PROGRESS_AI_STORIES.md` | Feature-specific refactoring progress |
| `REFACTORING_PROGRESS_REPORTS.md` | `docs/05-development/refactoring/REFACTORING_PROGRESS_REPORTS.md` | Feature-specific refactoring progress |
| `REFACTORING_PROGRESS.md` | `docs/05-development/refactoring/REFACTORING_PROGRESS.md` | General refactoring progress |
| `REFACTORING_REPORTS_PLAN.md` | `docs/05-development/refactoring/REFACTORING_REPORTS_PLAN.md` | Refactoring planning document |
| `REFACTORING_PROMPT_TEMPLATE.md` | `docs/05-development/refactoring/REFACTORING_PROMPT_TEMPLATE.md` | Development template |
| `REFACTORING_ANALYSIS.md` | `docs/05-development/refactoring/REFACTORING_ANALYSIS.md` | Technical analysis document |

**Action:** Create `docs/05-development/refactoring/` directory

---

### 2. Root Directory - Implementation Status Files

**Current Location:** Root directory  
**Issue:** Implementation status files should be in status reports

#### Files to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `IMPLEMENTATION_STATUS_UPDATED.md` | `docs/06-status-reports/IMPLEMENTATION_STATUS_UPDATED.md` | Status report |
| `IMPLEMENTATION_STATUS.md` | `docs/06-status-reports/IMPLEMENTATION_STATUS.md` | Status report |

---

### 3. Root Directory - Feature-Specific Documentation

**Current Location:** Root directory  
**Issue:** Feature implementation docs should be in appropriate docs sections

#### Files to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `BACKGROUND_GENERATION_IMPLEMENTATION.md` | `docs/05-development/BACKGROUND_GENERATION_IMPLEMENTATION.md` | Development implementation guide |
| `BOOLEAN_REFACTORING_IMPLEMENTATION.md` | `docs/05-development/refactoring/BOOLEAN_REFACTORING_IMPLEMENTATION.md` | Refactoring implementation |
| `BOOLEAN_REFACTORING_REPORT.md` | `docs/05-development/refactoring/BOOLEAN_REFACTORING_REPORT.md` | Refactoring report |

---

### 4. Root Directory - Test Results

**Current Location:** Root directory  
**Issue:** Test results should be in testing documentation

#### Files to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `AI_MODULE_TEST_RESULTS.md` | `docs/08-testing/AI_MODULE_TEST_RESULTS.md` | Test results documentation |
| `TEST_RESULTS_SUMMARY.md` | `docs/08-testing/TEST_RESULTS_SUMMARY.md` | Test results summary |

---

### 5. Root Directory - Test Script

**Current Location:** Root directory  
**Issue:** Test script should be in scripts or tests directory

#### File to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `test-ai-module.js` | `scripts/test-ai-module.js` | Test script belongs with other scripts |

---

### 6. Scripts Directory - Test Files Mixed with Scripts

**Current Location:** `scripts/`  
**Issue:** Test files are mixed with utility scripts

#### Files to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `scripts/test-ai-functions.ts` | `tests/integration/ai-functions.test.ts` | Integration test file |
| `scripts/test-stories-and-reports-comprehensive.ts` | `tests/integration/stories-and-reports-comprehensive.test.ts` | Integration test file |
| `scripts/test-story-generation-comprehensive.ts` | `tests/integration/story-generation-comprehensive.test.ts` | Integration test file |
| `scripts/test-story-generation.ts` | `tests/integration/story-generation.test.ts` | Integration test file |
| `scripts/validate-stories.ts` | `tests/utils/validation/validate-stories.ts` | Test utility/validation script |
| `scripts/verify-story-functions.ts` | `tests/integration/verify-story-functions.test.ts` | Integration test file |
| `scripts/README-TESTING.md` | `tests/integration/README-TESTING.md` | Testing documentation for story/report tests (references moved test files) |

---

### 7. Apps/Web Directory - Shell Script

**Current Location:** `apps/web/update-stripe-prices.sh`  
**Issue:** Shell script in app directory

#### File to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `apps/web/update-stripe-prices.sh` | `scripts/update-stripe-prices.sh` | Utility script belongs in scripts directory |

---

### 8. Apps/Web Directory - Test File

**Current Location:** `apps/web/tests/setup.ts`  
**Issue:** Test setup file in app directory

#### File Status:

| Current Location | Action | Reasoning |
|-----------------|--------|-----------|
| `apps/web/tests/setup.ts` | **Keep in place** | Next.js-specific test setup with mocks for `next/navigation` and Clerk. Different from root `tests/setup.ts` which is more general. Both serve different purposes. |

---

### 9. Assets Directory - Screenshot

**Current Location:** `assets/Screenshot_*.png`  
**Issue:** Screenshot file in root assets

#### File to Move:

| Current Location | Suggested New Location | Reasoning |
|-----------------|----------------------|-----------|
| `assets/Screenshot_*.png` | `docs/assets/screenshots/` or `assets/screenshots/` | Screenshots should be organized in subdirectory |

**Action:** Create `assets/screenshots/` or `docs/assets/screenshots/` directory

---

## 📁 New Directories to Create

### 1. `docs/05-development/refactoring/`
**Purpose:** Centralize all refactoring-related documentation  
**Files to Move:** 10 refactoring-related markdown files from root

### 2. `assets/screenshots/` or `docs/assets/screenshots/`
**Purpose:** Organize screenshot files  
**Files to Move:** Screenshot from `assets/` root

---

## ✅ Files That Are Correctly Placed

- `CHANGELOG.md` - Correctly in root (standard location)
- `README.md` - Correctly in root (standard location)
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` - Correctly in root
- `turbo.json` - Correctly in root (Turbo config)
- `convex/` structure - Well organized by feature
- `apps/web/` structure - Follows Next.js App Router conventions
- `tests/` structure - Well organized by test type
- `packages/` structure - Properly organized shared packages
- `docs/` structure - Well organized with numbered categories

---

## 🔄 Test File Organization Analysis

### Test Files Structure
- ✅ `tests/unit/` - Unit tests mirroring source structure
- ✅ `tests/integration/` - Integration tests
- ✅ `tests/e2e/` - End-to-end tests
- ✅ `tests/mocks/` - Mock data and components
- ✅ `tests/fixtures/` - Test fixtures
- ✅ `tests/utils/` - Test utilities

### Issues Found:
1. **Orphaned test scripts in `scripts/`** - 6 test files should be moved to `tests/integration/`
2. **Test setup duplication** - Check if `apps/web/tests/setup.ts` duplicates `tests/setup.ts`

---

## 📋 Execution Summary

### Phase 1: Create New Directories
1. Create `docs/05-development/refactoring/`
2. Create `assets/screenshots/` or `docs/assets/screenshots/`

### Phase 2: Move Documentation Files (15 files)
1. Move 10 refactoring files to `docs/05-development/refactoring/`
2. Move 2 implementation status files to `docs/06-status-reports/`
3. Move 2 feature docs to `docs/05-development/`
4. Move 2 test result files to `docs/08-testing/`

### Phase 3: Move Script and Test Files (8 files)
1. Move `test-ai-module.js` to `scripts/`
2. Move 6 test files from `scripts/` to `tests/integration/`
3. Move `scripts/README-TESTING.md` to `tests/integration/README-TESTING.md`
4. Move `update-stripe-prices.sh` from `apps/web/` to `scripts/`
5. **Keep** `apps/web/tests/setup.ts` in place (Next.js-specific, different from root setup)

### Phase 4: Move Asset Files (1 file)
1. Move screenshot to organized location

### Phase 5: Update References
1. Search codebase for references to moved files
2. Update any import paths or documentation links
3. Update README files if they reference moved files

---

## 🎯 Priority Order

1. **High Priority:** Move test files from `scripts/` to `tests/` (affects test organization)
2. **Medium Priority:** Move refactoring docs to organized location (improves root cleanliness)
3. **Low Priority:** Move screenshot and review test setup duplication (minor cleanup)

---

## 📝 Notes

- All file moves should preserve git history using `git mv` when possible
- After moving files, verify that:
  - Build scripts still work
  - Test commands still work
  - Documentation links are updated
  - CI/CD pipelines reference correct paths
- Consider adding a `.gitkeep` file in new directories if they might be empty initially

---

## 🔍 Additional Observations

1. **Documentation Organization:** The `docs/` directory is well-organized with numbered prefixes. The root directory markdown files should follow this pattern.

2. **Scripts vs Tests:** Clear separation needed - scripts are for automation/utilities, tests are for validation.

3. **Test Coverage:** Good test structure exists, but test files in `scripts/` directory break this organization.

4. **Root Directory Cleanliness:** 15+ markdown files in root should be moved to appropriate `docs/` subdirectories.

---

**Total Files to Move:** ~25 files  
**New Directories to Create:** 2 directories  
**Estimated Impact:** Low risk - mostly documentation and test files

---

## ⚠️ Important Notes After Moving Files

### Update References in Moved Files

After moving test files from `scripts/` to `tests/integration/`, update the `README-TESTING.md` file to reflect new paths:

- Change `npx tsx scripts/test-stories-and-reports-comprehensive.ts` to `npx tsx tests/integration/stories-and-reports-comprehensive.test.ts`
- Update any other script references in the documentation

### Verify Test Commands

After reorganization, verify that:
- `pnpm test` still works correctly
- Integration test scripts can still be run
- Test discovery still finds all test files
- CI/CD test commands reference correct paths

