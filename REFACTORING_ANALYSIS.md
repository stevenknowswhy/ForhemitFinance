# Large File Refactoring Analysis

**Date:** Generated before refactoring  
**Methodology:** Following the systematic refactoring workflow

## Files Requiring Refactoring (>800 LOC)

| File | LOC | Priority | Status |
|------|-----|----------|--------|
| `apps/web/app/dashboard/components/AddTransactionModal.tsx` | 2,972 | 🔴 CRITICAL | Analysis Complete |
| `convex/reports.ts` | 1,781 | 🟠 HIGH | Pending |
| `convex/ai_stories.ts` | 1,669 | 🟠 HIGH | Pending |
| `convex/ai_entries.ts` | 1,499 | 🟠 HIGH | Pending |
| `apps/web/app/settings/sections/BusinessProfileSettings.tsx` | 1,389 | 🟡 MEDIUM | Pending |
| `convex/plaid.ts` | 1,234 | 🟡 MEDIUM | Pending |
| `apps/web/app/dashboard/components/ApprovalQueue.tsx` | 1,071 | 🟡 MEDIUM | Pending |
| `convex/transactions.ts` | 940 | 🟡 MEDIUM | Pending |
| `apps/web/lib/storyPdfGenerator.ts` | 839 | 🟢 LOW | Pending |
| `apps/web/app/transactions/page.tsx` | 837 | 🟢 LOW | Pending |
| `convex/schema.ts` | 817 | 🟢 LOW | Pending |

---

## 1. AddTransactionModal.tsx (2,972 LOC) - Analysis

### Current Structure Outline

**Imports (Lines 1-24)**
- React hooks and utilities
- Convex hooks (useMutation, useQuery, useAction)
- UI components (shadcn/ui)
- Local components (ReceiptUploadModal, CategorySelector, etc.)
- Icons from lucide-react

**Types/Interfaces (Lines 26-39)**
- `AddTransactionModalProps`
- `LineItem` interface

**Main Component (Lines 41-2972)**
- **State Management (Lines 42-131)**: ~90 lines of useState declarations
  - Intent selection state
  - Form fields (title, amount, date, category, etc.)
  - Itemization/line items state
  - AI-related state
  - Receipt OCR state
  - Tax & compliance state
  - UI state (modals, previews, etc.)

- **Convex Hooks & Queries (Lines 133-161)**: ~30 lines
  - Mutations: createTransaction, processTransaction, etc.
  - Actions: generateAISuggestions, processReceiptOCR, suggestSplit
  - Queries: userAccounts, duplicateMatch, receipts, similarTransactions

- **Effects (Lines 164-475)**: ~310 lines
  - OCR auto-population (Lines 164-194)
  - Field completion tracking (Lines 197-235)
  - Split transaction detection (Lines 242-276)
  - Similar transaction auto-population (Lines 413-447)
  - Keyboard shortcuts (Lines 450-475)
  - Itemization preference (Lines 394-410)

- **Handler Functions (Lines 478-1140)**: ~660 lines
  - `handleIntentSelect` (Lines 478-483)
  - `enableItemization` / `disableItemization` (Lines 486-517)
  - `validateForm` (Lines 520-574)
  - `handleSubmit` (Lines 576-736) - **~160 lines**
  - `resetForm` (Lines 737-763)
  - Line item management (Lines 765-789)
  - AI handlers:
    - `handleDoubleEntryAI` (Lines 806-861) - **~55 lines**
    - `handleManualAITrigger` (Lines 862-927) - **~65 lines**
    - `handleSelectSuggestion` (Lines 928-1058) - **~130 lines**
    - `handleLineItemAI` (Lines 1060-1111) - **~50 lines**
  - `handleSplitSuggestion` (Lines 279-383) - **~105 lines**

- **Computed Values (Lines 791-1146)**: ~355 lines
  - Line items total calculation
  - Totals matching logic
  - AI button visibility logic

- **JSX Render (Lines 1148-2972)**: ~1,825 lines
  - Intent selection UI
  - Main form fields
  - Itemization UI
  - AI suggestions UI
  - Receipt upload UI
  - Accounting preview
  - Split transaction info modal
  - Various modals and overlays

### Responsibilities Identified

1. **State Management** - Managing 30+ state variables
2. **Form Validation** - Complex validation logic
3. **AI Integration** - Multiple AI suggestion handlers
4. **Receipt OCR** - OCR processing and auto-population
5. **Line Item Management** - Itemization/splitting logic
6. **Transaction Submission** - Complex submission flow
7. **UI Rendering** - Massive JSX with multiple sections
8. **Keyboard Shortcuts** - Keyboard event handling
9. **Auto-population** - Similar transactions, OCR, etc.
10. **Tax & Compliance** - Tax calculation and tracking

### Proposed File Structure

```
apps/web/app/dashboard/components/AddTransactionModal/
├── AddTransactionModal.tsx          # Main component (orchestration, ~200-300 LOC)
├── types.ts                         # TypeScript interfaces and types
├── hooks/
│   ├── useTransactionForm.ts        # Form state management (~150 LOC)
│   ├── useTransactionAI.ts         # AI suggestion logic (~200 LOC)
│   ├── useReceiptOCR.ts            # Receipt OCR handling (~150 LOC)
│   ├── useLineItems.ts             # Line item management (~150 LOC)
│   ├── useTransactionValidation.ts # Validation logic (~100 LOC)
│   └── useTransactionSubmission.ts # Submission logic (~200 LOC)
├── components/
│   ├── IntentSelector.tsx          # Intent selection UI (~150 LOC)
│   ├── TransactionFormFields.tsx   # Main form fields (~200 LOC)
│   ├── ItemizationPanel.tsx        # Line items UI (~300 LOC)
│   ├── AISuggestionsPanel.tsx      # AI suggestions UI (~200 LOC)
│   ├── ReceiptSection.tsx           # Receipt upload/preview (~150 LOC)
│   ├── AccountingPreview.tsx        # Already exists, reuse
│   ├── TaxComplianceSection.tsx    # Tax fields (~150 LOC)
│   └── SplitInfoModal.tsx          # Split info modal (~100 LOC)
├── utils/
│   ├── formHelpers.ts              # Form utility functions (~100 LOC)
│   ├── calculationHelpers.ts       # Amount/tax calculations (~100 LOC)
│   └── keyboardShortcuts.ts        # Keyboard handlers (~50 LOC)
└── constants.ts                     # Constants and defaults (~50 LOC)
```

**Target Sizes:**
- Main component: ~250 LOC (orchestration only)
- Hooks: 100-200 LOC each
- Components: 100-300 LOC each
- Utils: 50-100 LOC each

### Extraction Strategy

**Phase 1: Extract Pure Functions & Types** (Lowest Risk)
1. Extract types to `types.ts`
2. Extract calculation helpers to `utils/calculationHelpers.ts`
3. Extract form helpers to `utils/formHelpers.ts`
4. Extract constants to `constants.ts`

**Phase 2: Extract Custom Hooks** (Medium Risk)
1. Extract form state to `hooks/useTransactionForm.ts`
2. Extract validation to `hooks/useTransactionValidation.ts`
3. Extract line items to `hooks/useLineItems.ts`
4. Extract AI logic to `hooks/useTransactionAI.ts`
5. Extract OCR logic to `hooks/useReceiptOCR.ts`
6. Extract submission to `hooks/useTransactionSubmission.ts`

**Phase 3: Extract UI Components** (Medium Risk)
1. Extract IntentSelector component
2. Extract TransactionFormFields component
3. Extract ItemizationPanel component
4. Extract AISuggestionsPanel component
5. Extract ReceiptSection component
6. Extract TaxComplianceSection component
7. Extract SplitInfoModal component

**Phase 4: Refactor Main Component** (Higher Risk)
1. Wire up all extracted hooks and components
2. Keep public API stable (same props interface)
3. Ensure all functionality preserved

### Risks & Considerations

1. **Circular Dependencies**: Watch for hooks/components that need each other
2. **State Synchronization**: Ensure extracted hooks maintain state consistency
3. **Prop Drilling**: May need context provider for deeply nested state
4. **Testing**: Need to update tests for new structure
5. **Import Updates**: Update all files that import AddTransactionModal

### Public API Stability

**Before:**
```tsx
<AddTransactionModal onClose={() => {}} />
```

**After:** (Same interface)
```tsx
<AddTransactionModal onClose={() => {}} />
```

Internal structure changes, but external API remains identical.

---

## 2. reports.ts (1,781 LOC) - Analysis

### Current Structure

**Exported Functions (14 report types):**
1. `getBankLenderReportData` - Bank/Lender Application Snapshot
2. `getProfitAndLossData` - P&L Statement
3. `getBalanceSheetData` - Balance Sheet
4. `getCashFlowStatementData` - Cash Flow Statement
5. `getGeneralLedgerData` - General Ledger
6. `getTrialBalanceData` - Trial Balance
7. `getBurnRateRunwayData` - Burn Rate & Runway
8. `getFinancialSummaryData` - Financial Summary
9. `getKPIDashboardData` - KPI Dashboard
10. `getAccountsReceivableData` - AR Report
11. `getAccountsPayableData` - AP Report
12. `getVendorSpendAnalysisData` - Vendor Analysis
13. `getTaxPreparationData` - Tax Prep Report
14. `getYearEndAccountantPackData` - Year-End Pack

**Pattern:** Each function:
- Fetches user identity
- Queries business profile, accounts, transactions
- Aggregates data by category/period
- Calculates metrics
- Returns formatted report data

### Proposed File Structure

```
convex/reports/
├── index.ts                          # Re-exports all reports (~50 LOC)
├── types.ts                          # Report types and interfaces (~100 LOC)
├── helpers/
│   ├── dataAggregation.ts           # Shared aggregation logic (~200 LOC)
│   ├── calculations.ts              # Financial calculations (~150 LOC)
│   └── dateHelpers.ts              # Date range utilities (~50 LOC)
├── reports/
│   ├── bankLender.ts                # Bank/Lender report (~150 LOC)
│   ├── profitLoss.ts                # P&L report (~150 LOC)
│   ├── balanceSheet.ts              # Balance Sheet (~150 LOC)
│   ├── cashFlow.ts                  # Cash Flow (~150 LOC)
│   ├── generalLedger.ts            # General Ledger (~150 LOC)
│   ├── trialBalance.ts             # Trial Balance (~150 LOC)
│   ├── burnRate.ts                  # Burn Rate (~150 LOC)
│   ├── financialSummary.ts          # Financial Summary (~150 LOC)
│   ├── kpiDashboard.ts              # KPI Dashboard (~150 LOC)
│   ├── accountsReceivable.ts        # AR Report (~150 LOC)
│   ├── accountsPayable.ts           # AP Report (~150 LOC)
│   ├── vendorSpend.ts              # Vendor Analysis (~150 LOC)
│   ├── taxPreparation.ts            # Tax Prep (~150 LOC)
│   └── yearEnd.ts                   # Year-End Pack (~150 LOC)
└── shared/
    └── userDataFetcher.ts           # Common user/data fetching (~100 LOC)
```

**Target Sizes:**
- Individual report files: ~150 LOC each
- Helper files: 50-200 LOC each
- Total: ~2,500 LOC (more files, but each is manageable)

### Extraction Strategy

**Phase 1: Extract Shared Logic**
1. Extract common data fetching to `shared/userDataFetcher.ts`
2. Extract aggregation helpers to `helpers/dataAggregation.ts`
3. Extract calculation helpers to `helpers/calculations.ts`
4. Extract types to `types.ts`

**Phase 2: Split Report Functions**
1. Move each report function to its own file
2. Import shared helpers
3. Keep same function signatures

**Phase 3: Update Imports**
1. Update all frontend imports to use new structure
2. Create index.ts for backward compatibility

---

## 3. ai_stories.ts (1,669 LOC) - Analysis

### Current Structure

**Main Functions:**
- `aggregateFinancialDataQuery` - Data aggregation (~370 LOC)
- `createStory` - Story creation mutation
- `generateCompanyStory` / `_generateCompanyStoryInternal` - Company story
- `generateBankerStory` / `_generateBankerStoryInternal` - Banker story
- `generateInvestorStory` / `_generateInvestorStoryInternal` - Investor story
- `getStories` / `getStoryById` - Story queries
- `updateStory` - Story update
- `exportStory` - Story export

**Constants:**
- `STORY_SYSTEM_PROMPTS` - AI prompts for each story type

**Helper Functions:**
- `buildCompanyStoryPrompt`
- `buildBankerStoryPrompt`
- `buildInvestorStoryPrompt`

### Proposed File Structure

```
convex/ai_stories/
├── index.ts                          # Re-exports (~50 LOC)
├── types.ts                          # Types and interfaces (~100 LOC)
├── aggregation.ts                    # Financial data aggregation (~400 LOC)
├── prompts.ts                        # AI prompt builders (~300 LOC)
├── stories/
│   ├── company.ts                   # Company story generation (~250 LOC)
│   ├── banker.ts                    # Banker story generation (~250 LOC)
│   └── investor.ts                  # Investor story generation (~250 LOC)
├── mutations.ts                     # Story CRUD mutations (~200 LOC)
└── queries.ts                       # Story queries (~100 LOC)
```

**Target Sizes:**
- Aggregation: ~400 LOC (complex, but focused)
- Story generators: ~250 LOC each
- Other files: 100-300 LOC each

### Extraction Strategy

**Phase 1: Extract Data & Types**
1. Extract `FinancialData` interface to `types.ts`
2. Extract aggregation logic to `aggregation.ts`
3. Extract prompt builders to `prompts.ts`

**Phase 2: Split Story Generators**
1. Extract each story type to its own file
2. Share common prompt building logic

**Phase 3: Extract CRUD Operations**
1. Move mutations to `mutations.ts`
2. Move queries to `queries.ts`

---

## Next Steps

1. ✅ Git snapshot created
2. ✅ Analysis complete for top 3 files
3. ⏳ Get approval for refactoring plan
4. ⏳ Execute refactoring in phases (starting with AddTransactionModal)
5. ⏳ Run tests after each phase
6. ⏳ Update imports across codebase

---

## Testing Checklist

After refactoring, verify:
- [ ] Modal opens and closes correctly
- [ ] Intent selection works
- [ ] Form fields accept input
- [ ] Validation works
- [ ] AI suggestions generate
- [ ] Receipt upload works
- [ ] OCR auto-population works
- [ ] Line items can be added/removed
- [ ] Transaction submission works
- [ ] Keyboard shortcuts work
- [ ] "Save & Add Another" flow works
- [ ] All edge cases handled

