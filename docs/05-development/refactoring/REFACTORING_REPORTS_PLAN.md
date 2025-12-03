# Reports.ts Refactoring Plan

## Current Status
- **File:** `convex/reports.ts`
- **Size:** 1,781 LOC
- **Structure:** 14 exported query functions + 2 helper functions

## Extraction Strategy

### Phase 1: Create Structure ✅
- ✅ Created `convex/reports/` directory
- ✅ Created `convex/reports/utils.ts` with shared helpers
  - `getAuthenticatedUser`
  - `calculateAccountBalanceFromEntries`

### Phase 2: Extract Reports (In Progress)
- ✅ `reports/bankLender.ts` - Bank/Lender Application Snapshot
- ✅ `reports/profitLoss.ts` - Profit & Loss Statement
- ✅ `reports/balanceSheet.ts` - Balance Sheet
- ⏳ `reports/cashFlow.ts` - Cash Flow Statement
- ⏳ `reports/generalLedger.ts` - General Ledger
- ⏳ `reports/trialBalance.ts` - Trial Balance
- ⏳ `reports/burnRateRunway.ts` - Burn Rate & Runway
- ⏳ `reports/financialSummary.ts` - Monthly/Quarterly Summary
- ⏳ `reports/kpiDashboard.ts` - KPI Dashboard
- ⏳ `reports/accountsReceivable.ts` - Accounts Receivable
- ⏳ `reports/accountsPayable.ts` - Accounts Payable
- ⏳ `reports/vendorSpendAnalysis.ts` - Vendor Spend Analysis
- ⏳ `reports/taxPreparation.ts` - Tax Preparation
- ⏳ `reports/yearEndAccountantPack.ts` - Year-End Accountant Pack

### Phase 3: Update Main File
- Update `convex/reports.ts` to re-export all functions
- Maintain backward compatibility with `api.reports.*` imports
- Remove extracted code from main file

## Target Structure

```
convex/
├── reports.ts (re-exports only, ~50 LOC)
└── reports/
    ├── utils.ts (shared helpers)
    ├── bankLender.ts
    ├── profitLoss.ts
    ├── balanceSheet.ts
    ├── cashFlow.ts
    ├── generalLedger.ts
    ├── trialBalance.ts
    ├── burnRateRunway.ts
    ├── financialSummary.ts
    ├── kpiDashboard.ts
    ├── accountsReceivable.ts
    ├── accountsPayable.ts
    ├── vendorSpendAnalysis.ts
    ├── taxPreparation.ts
    └── yearEndAccountantPack.ts
```

## Notes
- Each report file should be self-contained
- All reports import from `utils.ts` for shared helpers
- Main `reports.ts` will re-export everything to maintain API compatibility
- Frontend uses `api.reports.getXxxData` - this must continue to work

