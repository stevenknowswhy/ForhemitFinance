# EZ Financial - Testing Directory

This directory contains all testing-related files organized by type and purpose.

## 📁 Directory Structure

```
tests/
├── unit/                    # Unit tests (co-located with source code)
├── integration/             # Integration tests
│   ├── plaid/              # Plaid integration tests
│   └── reports/            # Report integration tests
├── e2e/                     # End-to-end tests (future)
├── mocks/                   # Mock data and components
│   ├── data/               # Mock data files
│   ├── components/         # Mock React components
│   └── services/           # Mock service implementations
├── fixtures/                # Test fixtures (JSON, etc.)
├── utils/                   # Test utilities
│   ├── validation/         # Validation scripts
│   ├── helpers/            # Test helper functions
│   └── test-setup/         # Test setup utilities
├── config/                  # Test configurations
├── snapshots/               # Test snapshots
└── archive/                 # Archived tests
```

## 🧪 Test Types

### Unit Tests
- **Location**: Co-located with source code (e.g., `packages/*/src/**/*.test.ts`)
- **Framework**: Vitest
- **Purpose**: Test individual functions and components in isolation

### Integration Tests
- **Location**: `tests/integration/`
- **Framework**: Vitest + shell scripts
- **Purpose**: Test interactions between components/services

### E2E Tests
- **Location**: `tests/e2e/` (future)
- **Framework**: Playwright (planned)
- **Purpose**: Test complete user workflows

## 📦 Mocks & Fixtures

### Mock Data
- **Location**: `tests/mocks/data/`
- **Purpose**: Reusable mock data for testing
- **Usage**: Import in tests or demo pages

### Mock Components
- **Location**: `tests/mocks/components/`
- **Purpose**: Mock React components for testing
- **Usage**: Import in test files or development pages

### Fixtures
- **Location**: `tests/fixtures/`
- **Purpose**: Static test data (JSON, etc.)
- **Usage**: Load in tests for consistent test data

## 🛠️ Test Utilities

### Validation Scripts
- **Location**: `tests/utils/validation/`
- **Purpose**: Validate calculations, environment, etc.
- **Languages**: JavaScript, Python

### Helper Functions
- **Location**: `tests/utils/helpers/`
- **Purpose**: Reusable test helper functions
- **Usage**: Import in test files

## ⚙️ Running Tests

### Run All Tests
```bash
# From project root
pnpm test

# Or using Turbo
turbo run test
```

### Run Specific Test Suite
```bash
# Unit tests in a package
cd packages/shadcn-mcp-server
pnpm test

# Integration tests
cd tests/integration/plaid
./mock-plaid-workflow.test.sh
```

### Run with Coverage
```bash
pnpm test -- --coverage
```

## 📝 Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../myModule";

describe("myFunction", () => {
  it("should return expected value", () => {
    expect(myFunction()).toBe("expected");
  });
});
```

### Using Mocks
```typescript
import { mockDashboardData } from "../../../tests/mocks/data/dashboard-mock-data";

describe("Dashboard", () => {
  it("should render with mock data", () => {
    const data = mockDashboardData();
    // ... test
  });
});
```

## 🔍 Finding Tests

- **Unit tests**: Look for `*.test.ts` or `*.spec.ts` files next to source code
- **Integration tests**: Check `tests/integration/`
- **Mock data**: Check `tests/mocks/data/`
- **Test utilities**: Check `tests/utils/`

## 📚 Related Documentation

- [Testing Guide](../../docs/05-development/testing-guide.md) - Comprehensive testing guide
- [Testing Checklist](../../docs/05-development/testing-checklist.md) - Testing checklist
- [Test Results](../../docs/08-testing/) - Test results and reports

## 🗄️ Archiving Tests

See `tests/archive/README.md` for information about archiving obsolete tests.

---

**Last Updated**: December 2024

