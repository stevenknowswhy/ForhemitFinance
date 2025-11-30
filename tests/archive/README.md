# Test Archive

This directory contains archived test files that are no longer actively used but are preserved for historical reference, audit trails, or regression investigation.

## 📁 Archive Structure

```
archive/
├── README.md                    # This file
├── YYYY-MM/                     # Monthly archives
│   ├── README.md                # Archive index for the month
│   ├── deprecated-tests/       # Tests for removed features
│   ├── obsolete-mocks/         # Mocks for deprecated services
│   └── superseded-snapshots/    # Old snapshot files
└── legacy/                      # Long-term archives
    └── (version-specific archives)
```

## 📋 Archival Criteria

Tests are archived when:

1. ✅ Feature is removed or significantly refactored
2. ✅ Test is superseded by better test
3. ✅ Mock is replaced by real implementation
4. ✅ Test framework changes (e.g., Jest → Vitest)
5. ✅ Test is obsolete due to architecture changes

**Do NOT archive:**
- ❌ Tests that are temporarily disabled (fix instead)
- ❌ Tests for deprecated but still-supported features
- ❌ Tests that need updating (update instead)

## 🔍 Finding Archived Tests

### Search Archive
```bash
# Search for specific feature
grep -r "feature-name" tests/archive/

# Find tests for removed feature
find tests/archive/ -name "*feature-name*"
```

### Review Archive Index
Each monthly archive contains a `README.md` with:
- What was archived
- Why it was archived
- When feature/test was removed
- Migration path (if applicable)

## 📅 Retention Policy

- **Active Archive**: 6 months (for audit and regression investigation)
- **Legacy Archive**: Indefinite (for historical reference)
- **Cleanup**: After 6 months, review and delete if no longer needed

## 🔄 Archival Process

1. **Identify candidates** - Review test coverage, identify obsolete tests
2. **Document decision** - Create entry in monthly archive README
3. **Move to archive** - Move files to appropriate archive directory
4. **Update documentation** - Update test README and archive index
5. **Commit changes** - Preserve history in git

## 📝 Archive Index Format

Each monthly archive should include a README with:

```markdown
# Test Archive - December 2024

## Archived Tests

### test-name.test.ts
- **Date Archived**: 2024-12-XX
- **Reason**: Feature removed
- **Original Location**: `tests/unit/`
- **Replacement**: None (feature removed)
- **Keep Until**: 2025-06-XX (6 months)
```

---

**Last Updated**: December 2024

