# Mock Data & Components

This directory contains mock data, mock components, and mock service implementations used for testing and development.

## 📁 Structure

```
mocks/
├── data/              # Mock data files
├── components/        # Mock React components
└── services/         # Mock service implementations
```

## 📊 Mock Data

**Location**: `mocks/data/`

Mock data files provide reusable test data for:
- Dashboard demos
- Report testing
- Component testing
- Integration testing

### Available Mock Data

- `dashboard-mock-data.ts` - Dashboard demo data (KPIs, charts, etc.)

### Usage

```typescript
import { mockDashboardData } from "../../../tests/mocks/data/dashboard-mock-data";

const data = mockDashboardData();
```

## 🧩 Mock Components

**Location**: `mocks/components/`

Mock React components used for:
- Development (when real components aren't available)
- Testing (isolating components)
- Demos (showing functionality without real services)

### Available Mock Components

- `MockPlaidLink.tsx` - Mock Plaid bank connection component

### Usage

```typescript
import MockPlaidLink from "../../../../tests/mocks/components/MockPlaidLink";

<MockPlaidLink />
```

## 🔧 Mock Services

**Location**: `mocks/services/` (future)

Mock service implementations for:
- API mocking
- External service mocking
- Testing service integrations

## 📝 Guidelines

1. **Naming**: Use `Mock*` prefix for components, `*-mock-data.ts` for data
2. **Purpose**: Document what each mock is for
3. **Real vs Mock**: Clearly distinguish mock from real implementations
4. **Updates**: Keep mocks in sync with real implementations when possible

---

**Last Updated**: December 2024

