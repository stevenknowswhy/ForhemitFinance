# Reports Module

Financial reports and analytics module.

## Overview

The Reports module provides comprehensive financial reporting capabilities including:
- Core financial reports (P&L, Balance Sheet, Cash Flow)
- Business health reports (Burn Rate, KPI Dashboard)
- Specialized reports (Tax Preparation, Year-End Pack)

## Features

- 14+ different report types
- PDF and CSV export
- Customizable date ranges
- Business vs personal filtering

## Module Structure

```
modules/reports/
├── manifest.ts          # Module metadata and configuration
├── convex/              # Backend functions
│   ├── index.ts         # Re-exports
│   ├── utils.ts         # Shared utilities
│   └── [report files]   # Individual report queries
├── components/          # React components
│   ├── ReportsTab.tsx
│   └── [ReportModal components]
├── routes.ts            # Route definitions
├── navigation.ts        # Navigation items
└── permissions.ts       # Module permissions
```

## Usage

### Backend

Import from the module:
```typescript
import { getProfitAndLossData } from "../modules/reports/convex";
```

Or use the backward-compatible export:
```typescript
import { getProfitAndLossData } from "convex/reports";
```

### Frontend

Import the component:
```typescript
import { ReportsTab } from "../modules/reports/components/ReportsTab";
```

## Permissions

- `VIEW_REPORTS`: View reports
- `EXPORT_REPORTS`: Export reports to PDF/CSV

## Billing

Currently free for all subscription tiers. Advanced reports may become paid in the future.

## Data

Uses existing accounting entries and transaction data (no separate tables).

