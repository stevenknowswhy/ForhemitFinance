# Testing File Organization & Archival Plan

## Executive Summary

This document proposes a comprehensive reorganization plan for all testing-related files in the EZ Financial repository. The plan addresses current test file locations, proposes a scalable folder structure, identifies conflicts and redundancies, and establishes an archival workflow.

**Total Testing Files Identified**: 10 files  
**Test Types Found**: Unit tests, mock data, test utilities, validation scripts, integration test scripts  
**Test Frameworks**: Vitest (configured), Playwright (planned)

---

## 1. Identified Testing Files

### Unit Tests

| File Path | Type | Framework | Status |
|-----------|------|-----------|--------|
| `packages/shadcn-mcp-server/src/tools/list-components.test.ts` | Unit test | Vitest | ✅ Active |
| `packages/accounting-engine/` (no tests found) | Unit test | Vitest | ⚠️ Configured but no tests |

### Test Configuration

| File Path | Purpose | Status |
|-----------|---------|--------|
| `packages/shadcn-mcp-server/vitest.config.ts` | Vitest configuration | ✅ Active |
| `turbo.json` (test pipeline) | Turbo test configuration | ✅ Active |

### Mock Data & Components

| File Path | Type | Purpose | Status |
|-----------|------|---------|--------|
| `apps/web/app/dashboard-demo/data/mockData.ts` | Mock data | Dashboard demo data | ✅ Active (demo) |
| `apps/web/app/components/MockPlaidLink.tsx` | Mock component | Plaid integration mock | ✅ Active (dev) |

### Test Utilities

| File Path | Type | Purpose | Status |
|-----------|------|---------|--------|
| `apps/web/lib/reportTestData.ts` | Test utility | Report validation helpers | ✅ Active |

### Validation & Test Scripts

| File Path | Type | Purpose | Status |
|-----------|------|---------|--------|
| `test-mock-plaid.sh` | Integration test script | Mock Plaid workflow validation | ✅ Active |
| `scripts/validate_report_calculations.py` | Validation script | Financial calculation verification | ✅ Active |
| `scripts/get_datetime.py` | Utility script | Date/time formatting for tests | ✅ Active |
| `apps/web/validate-env.js` | Validation script | Environment variable validation | ✅ Active |

### Test Documentation

| File Path | Type | Purpose | Status |
|-----------|------|---------|--------|
| `docs/05-development/testing-guide.md` | Documentation | Testing instructions | ✅ Active |
| `docs/05-development/testing-checklist.md` | Documentation | Testing checklist | ✅ Active |
| `docs/08-testing/` | Documentation | Test results and reports | ✅ Active |

---

## 2. Proposed Folder Structure

### Recommended Structure

```
tests/
├── README.md                          # Testing overview and guidelines
│
├── unit/                              # Unit tests
│   ├── packages/
│   │   ├── shadcn-mcp-server/
│   │   │   └── tools/
│   │   │       └── list-components.test.ts
│   │   └── accounting-engine/
│   │       └── (tests to be added)
│   └── apps/
│       └── web/
│           └── lib/
│               └── (tests to be added)
│
├── integration/                       # Integration tests
│   ├── plaid/
│   │   └── mock-plaid-workflow.test.sh
│   └── reports/
│       └── (report integration tests)
│
├── e2e/                               # End-to-end tests (future)
│   ├── playwright.config.ts
│   ├── tests/
│   │   ├── dashboard.spec.ts
│   │   ├── transactions.spec.ts
│   │   └── reports.spec.ts
│   └── fixtures/
│       └── (E2E test fixtures)
│
├── mocks/                              # Mock data and components
│   ├── data/
│   │   ├── dashboard-mock-data.ts     # From apps/web/app/dashboard-demo/data/mockData.ts
│   │   └── report-mock-data.ts        # From apps/web/lib/reportTestData.ts
│   ├── components/
│   │   └── MockPlaidLink.tsx          # From apps/web/app/components/MockPlaidLink.tsx
│   └── services/
│       └── (service mocks)
│
├── fixtures/                           # Test fixtures
│   ├── transactions.json
│   ├── accounts.json
│   └── reports/
│       ├── profit-loss.json
│       ├── balance-sheet.json
│       └── cash-flow.json
│
├── utils/                              # Test utilities
│   ├── validation/
│   │   ├── validate-env.js             # From apps/web/validate-env.js
│   │   └── validate-report-calculations.py  # From scripts/validate_report_calculations.py
│   ├── helpers/
│   │   ├── report-test-helpers.ts      # From apps/web/lib/reportTestData.ts
│   │   └── datetime-utils.py           # From scripts/get_datetime.py
│   └── test-setup/
│       └── (test setup utilities)
│
├── config/                             # Test configurations
│   ├── vitest.config.ts                # Shared Vitest config
│   ├── vitest.unit.config.ts           # Unit test config
│   ├── vitest.integration.config.ts    # Integration test config
│   └── playwright.config.ts            # E2E test config (future)
│
├── snapshots/                          # Test snapshots (if using)
│   └── (snapshot files)
│
└── archive/                            # Archived tests
    ├── README.md                       # Archive index
    ├── YYYY-MM/                        # Monthly archives
    │   ├── deprecated-tests/
    │   ├── obsolete-mocks/
    │   └── superseded-snapshots/
    └── legacy/                         # Legacy test archives
        └── (old test suites)
```

### Alternative: Keep Package-Specific Tests

**Option B**: Keep tests co-located with source code (recommended for monorepo)

```
packages/
  shadcn-mcp-server/
    src/
      tools/
        list-components.ts
        list-components.test.ts        # ✅ Keep here
    vitest.config.ts                   # ✅ Keep here

packages/
  accounting-engine/
    src/
      (source files)
    tests/                              # ✅ Create here
      (test files)
    vitest.config.ts                    # ✅ Create here

apps/
  web/
    app/
      components/
        MockPlaidLink.tsx               # ⚠️ Move to tests/mocks/components/
    lib/
      reportTestData.ts                 # ⚠️ Move to tests/utils/helpers/
    tests/                              # ✅ Create here
      unit/
      integration/
      e2e/
```

**Recommendation**: Use **Hybrid Approach**
- Keep unit tests co-located with source (Option B)
- Centralize shared mocks, fixtures, and utilities (Option A)
- Centralize integration and E2E tests (Option A)

---

## 3. File Mapping & Rename Recommendations

### Current → Proposed Location

| Current File | Proposed Location | Rename Suggestion | Reason |
|--------------|-------------------|-------------------|--------|
| `packages/shadcn-mcp-server/src/tools/list-components.test.ts` | **Keep in place** | None | Co-location with source |
| `packages/shadcn-mcp-server/vitest.config.ts` | **Keep in place** | None | Package-specific config |
| `apps/web/app/dashboard-demo/data/mockData.ts` | `tests/mocks/data/dashboard-mock-data.ts` | `dashboard-mock-data.ts` | Centralize mocks |
| `apps/web/app/components/MockPlaidLink.tsx` | `tests/mocks/components/MockPlaidLink.tsx` | None | Centralize mocks |
| `apps/web/lib/reportTestData.ts` | `tests/utils/helpers/report-test-helpers.ts` | `report-test-helpers.ts` | Clearer naming |
| `test-mock-plaid.sh` | `tests/integration/plaid/mock-plaid-workflow.test.sh` | `mock-plaid-workflow.test.sh` | Standard naming |
| `scripts/validate_report_calculations.py` | `tests/utils/validation/validate-report-calculations.py` | `validate-report-calculations.py` | Consistent naming |
| `scripts/get_datetime.py` | `tests/utils/helpers/datetime-utils.py` | `datetime-utils.py` | Clearer purpose |
| `apps/web/validate-env.js` | `tests/utils/validation/validate-env.js` | None | Centralize validation |

### Naming Conventions

**Test Files:**
- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts` or `*.integration.spec.ts`
- E2E tests: `*.e2e.test.ts` or `*.e2e.spec.ts`
- Test scripts: `*.test.sh` or `*.test.js`

**Mock Files:**
- Mock data: `*-mock-data.ts` or `*-mock.ts`
- Mock components: `Mock*.tsx` or `*-mock.tsx`
- Mock services: `*-mock-service.ts`

**Utility Files:**
- Test helpers: `*-test-helpers.ts` or `*-helpers.ts`
- Validation: `validate-*.ts` or `validate-*.js` or `validate-*.py`
- Setup: `test-setup.ts` or `setup.ts`

---

## 4. Conflict & Redundancy Report

### Category 1: Mock Data Duplication

**Files:**
- `apps/web/app/dashboard-demo/data/mockData.ts` - Dashboard demo data
- `apps/web/lib/reportTestData.ts` - Contains `generateMockProfitLossData()`

**Conflict Type**: Potential duplication of mock data generation

**Severity**: Low

**Analysis**:
- `mockData.ts` is for dashboard demo UI
- `reportTestData.ts` is for report validation
- Different purposes, but could share common data structures

**Recommended Action**:
- Keep separate (different purposes)
- Consider extracting shared types/interfaces to `tests/fixtures/types.ts`
- Document the distinction in README

---

### Category 2: Validation Scripts Scattered

**Files:**
- `scripts/validate_report_calculations.py` - Python validation
- `apps/web/validate-env.js` - Node.js validation
- `apps/web/lib/reportTestData.ts` - TypeScript validation

**Conflict Type**: Validation logic in multiple languages/locations

**Severity**: Medium

**Analysis**:
- Python script: Independent calculation verification
- Node.js script: Environment setup validation
- TypeScript: In-app validation helpers
- All serve different purposes but could be better organized

**Recommended Action**:
- Move all to `tests/utils/validation/`
- Keep language separation (Python vs JS/TS)
- Document when to use each
- Consider consolidating TypeScript validation into single module

---

### Category 3: Test Configuration

**Files:**
- `packages/shadcn-mcp-server/vitest.config.ts` - Package-specific config
- `turbo.json` (test pipeline) - Monorepo test orchestration

**Conflict Type**: No conflict, but could benefit from shared base config

**Severity**: Low

**Analysis**:
- Package configs are appropriate for package-specific needs
- Turbo handles test orchestration
- Could add shared base config for common settings

**Recommended Action**:
- Create `tests/config/vitest.base.config.ts` for shared settings
- Package configs extend base config
- Document configuration hierarchy

---

### Category 4: Missing Test Coverage

**Files:**
- `packages/accounting-engine/` - Has `vitest` configured but no tests
- `apps/web/` - No test files found
- `convex/` - No test files found

**Conflict Type**: Test infrastructure exists but tests missing

**Severity**: High

**Analysis**:
- Test frameworks configured but not utilized
- Critical packages lack test coverage
- Backend functions (Convex) have no tests

**Recommended Action**:
- **Priority 1**: Add tests for `accounting-engine` (core business logic)
- **Priority 2**: Add tests for critical Convex functions
- **Priority 3**: Add unit tests for web app utilities
- Create test templates/stubs for new features

---

### Category 5: Test Script Location

**Files:**
- `test-mock-plaid.sh` - Root-level test script
- `scripts/validate_report_calculations.py` - In scripts folder
- `scripts/get_datetime.py` - In scripts folder

**Conflict Type**: Test scripts in different locations

**Severity**: Low

**Analysis**:
- `test-mock-plaid.sh` is clearly a test script (should be in tests/)
- Scripts folder contains both test and non-test scripts
- Inconsistent organization

**Recommended Action**:
- Move `test-mock-plaid.sh` to `tests/integration/plaid/`
- Move test-related scripts from `scripts/` to `tests/utils/`
- Keep non-test scripts in `scripts/` (e.g., build scripts, deployment scripts)

---

### Category 6: Mock Component in Production Code

**Files:**
- `apps/web/app/components/MockPlaidLink.tsx` - Mock component in app components

**Conflict Type**: Test/mock code in production codebase

**Severity**: Medium

**Analysis**:
- Mock component is used for development/demo
- Should be separated from production components
- Currently mixed with real components

**Recommended Action**:
- Move to `tests/mocks/components/MockPlaidLink.tsx`
- Update imports in demo/test pages
- Consider feature flag or environment-based loading
- Document when mock vs real component should be used

---

### Category 7: Demo Data vs Test Data

**Files:**
- `apps/web/app/dashboard-demo/data/mockData.ts` - Demo data in demo app

**Conflict Type**: Demo data location vs test data organization

**Severity**: Low

**Analysis**:
- Demo data is for `dashboard-demo` page (demo/example)
- Could be considered test data or demo data
- Currently in app codebase

**Recommended Action**:
- **Option A**: Keep in demo app (it's for demo, not testing)
- **Option B**: Move to `tests/mocks/data/` and import in demo
- **Recommendation**: Keep in demo app but document it's demo-only
- If used in tests, create separate test version in `tests/mocks/data/`

---

## 5. Orphaned & Obsolete Tests

### Currently No Orphaned Tests Found

**Reason**: Very few tests exist currently. However, potential issues:

1. **Future Risk**: As tests are added, some may target code that gets refactored
2. **Mock Plaid Test**: `test-mock-plaid.sh` tests mock implementation - if real Plaid is implemented, this test may become obsolete
3. **Demo Data**: `mockData.ts` in demo app may become stale if dashboard structure changes

### Recommendations for Future

1. **Regular Audit**: Quarterly review of test files for orphaned tests
2. **Test Coverage Reports**: Track which files have tests
3. **Deprecation Process**: Mark tests as deprecated before removing code
4. **Migration Path**: Document how to migrate tests when code moves

---

## 6. Archival Workflow

### Archival Strategy

#### Structure

```
tests/archive/
├── README.md                    # Archive index and search guide
├── YYYY-MM/                     # Monthly archives
│   ├── README.md                # What was archived and why
│   ├── deprecated-tests/         # Tests for removed features
│   ├── obsolete-mocks/          # Mocks for deprecated services
│   ├── superseded-snapshots/    # Old snapshot files
│   └── migration-notes.md       # Migration information
└── legacy/                      # Long-term archives
    ├── v1.0-tests/              # Version-specific archives
    └── pre-refactor/            # Pre-major-refactor tests
```

#### Archival Criteria

**Archive When:**
1. Feature is removed or significantly refactored
2. Test is superseded by better test
3. Mock is replaced by real implementation
4. Test framework changes (e.g., Jest → Vitest migration)
5. Test is obsolete due to architecture changes

**Do NOT Archive:**
1. Tests that are temporarily disabled (fix instead)
2. Tests for deprecated but still-supported features
3. Tests that need updating (update instead)

#### Archival Process

**Step 1: Identify Candidates**
```bash
# Review test coverage reports
# Check for tests targeting removed code
# Identify obsolete mocks
```

**Step 2: Document Decision**
- Create entry in `tests/archive/YYYY-MM/README.md`
- Document:
  - What was archived
  - Why it was archived
  - When feature/test was removed
  - Migration path (if applicable)

**Step 3: Move to Archive**
```bash
# Create archive directory
mkdir -p tests/archive/2024-12

# Move files
mv tests/unit/old-feature.test.ts tests/archive/2024-12/deprecated-tests/
mv tests/mocks/old-service-mock.ts tests/archive/2024-12/obsolete-mocks/
```

**Step 4: Update Documentation**
- Update test README
- Update archive index
- Add to git (preserve history)

**Step 5: Cleanup (After 6 Months)**
- Review archived tests
- Delete if no longer needed for audit
- Keep if needed for compliance/history

#### Archive Index Format

```markdown
# Test Archive - December 2024

## Archived Tests

### mock-plaid-integration.test.sh
- **Date Archived**: 2024-12-XX
- **Reason**: Real Plaid integration implemented
- **Original Location**: `tests/integration/plaid/`
- **Replacement**: Real Plaid integration tests
- **Keep Until**: 2025-06-XX (6 months)

### old-dashboard-mock-data.ts
- **Date Archived**: 2024-12-XX
- **Reason**: Dashboard structure changed
- **Original Location**: `tests/mocks/data/`
- **Replacement**: New dashboard mock data
- **Keep Until**: 2025-06-XX
```

#### Search & Retrieval

**For Audit Trails:**
```bash
# Search archived tests
grep -r "feature-name" tests/archive/

# Find tests for removed feature
find tests/archive/ -name "*feature-name*"
```

**For Regression Investigation:**
```bash
# Review archived tests when investigating regressions
cat tests/archive/2024-12/README.md
```

#### Automated Archival (Future)

Consider automation:
- CI/CD job to detect orphaned tests
- Script to identify tests targeting removed code
- Automated archival with documentation generation

---

## 7. Implementation Priority

### Phase 1: Immediate (High Priority)

1. **Create Test Structure**
   - Create `tests/` directory structure
   - Create README files
   - Set up base configurations

2. **Move Mock Components**
   - Move `MockPlaidLink.tsx` to `tests/mocks/components/`
   - Update imports

3. **Organize Validation Scripts**
   - Move validation scripts to `tests/utils/validation/`
   - Document usage

4. **Move Test Scripts**
   - Move `test-mock-plaid.sh` to `tests/integration/plaid/`
   - Update documentation

### Phase 2: Short Term (Medium Priority)

1. **Extract Test Utilities**
   - Move `reportTestData.ts` to `tests/utils/helpers/`
   - Consider splitting into focused modules

2. **Create Shared Configs**
   - Create `tests/config/vitest.base.config.ts`
   - Update package configs to extend base

3. **Add Missing Tests**
   - Add tests for `accounting-engine`
   - Add tests for critical Convex functions

4. **Document Test Strategy**
   - Create comprehensive test README
   - Document test organization principles

### Phase 3: Long Term (Low Priority)

1. **Set Up E2E Tests**
   - Configure Playwright
   - Create E2E test structure
   - Add initial E2E tests

2. **Implement Archival Workflow**
   - Set up archive structure
   - Create archival scripts
   - Document process

3. **Test Coverage Tracking**
   - Set up coverage reporting
   - Track test coverage over time
   - Identify gaps

---

## 8. Benefits of Reorganization

### Discoverability
- All test files in logical locations
- Easy to find tests for specific features
- Clear separation of test types

### Maintainability
- Centralized test utilities
- Shared configurations
- Consistent naming

### Scalability
- Easy to add new tests
- Clear structure for new test types
- Organized archival process

### Collaboration
- Clear test organization principles
- Easy onboarding for new developers
- Consistent test patterns

### Quality
- Better test coverage tracking
- Easier to identify missing tests
- Clearer test purpose

---

## 9. Migration Checklist

### Pre-Migration

- [ ] Review current test files
- [ ] Identify all test-related files
- [ ] Document current test coverage
- [ ] Get team approval for structure

### Migration

- [ ] Create `tests/` directory structure
- [ ] Move mock components
- [ ] Move validation scripts
- [ ] Move test scripts
- [ ] Update imports
- [ ] Update documentation
- [ ] Update CI/CD configurations

### Post-Migration

- [ ] Verify all tests still run
- [ ] Update README files
- [ ] Train team on new structure
- [ ] Set up archival workflow
- [ ] Monitor for issues

---

## 10. Summary

### Current State
- **10 test-related files** identified
- **1 unit test** (active)
- **2 mock files** (in production code)
- **4 validation/utility scripts** (scattered)
- **1 integration test script** (root level)
- **Test frameworks configured** but underutilized

### Proposed State
- **Centralized test structure** in `tests/`
- **Co-located unit tests** with source (monorepo best practice)
- **Centralized mocks and utilities**
- **Organized integration tests**
- **Clear archival workflow**
- **Comprehensive documentation**

### Key Recommendations

1. **Hybrid Approach**: Co-locate unit tests, centralize shared resources
2. **Immediate Action**: Move mocks and validation scripts
3. **Short Term**: Add missing tests for critical packages
4. **Long Term**: Set up E2E tests and archival workflow

---

**Plan Status**: ✅ **READY FOR REVIEW**

**Next Step**: Review and approve before implementation

---

**Generated**: December 2024  
**Total Files Analyzed**: 10 test-related files  
**Conflicts Identified**: 7 categories  
**Recommended Structure**: Hybrid approach (co-located + centralized)

