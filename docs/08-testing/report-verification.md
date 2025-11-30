# Report Verification Checklist

This document tracks the systematic verification of all 14 financial reports to ensure:
1. Data is pulled correctly from database
2. Preview formatting is accurate
3. PDF generation is properly formatted

## Test Status Legend
- ✅ Passed
- ❌ Failed
- ⏳ In Progress
- ⏸️ Not Started

---

## Core Financial Reports (5 reports)

### 1. Profit & Loss (P&L) Statement
**Backend Function:** `getProfitAndLossData`

#### Data Verification
- [ ] Revenue calculations from income accounts match transactions
- [ ] Expense calculations from expense accounts match transactions
- [ ] Net income = revenue - expenses (verified with Python)
- [ ] Category breakdowns are accurate
- [ ] Date range filtering works correctly
- [ ] Business/personal/blended filters work
- [ ] Gross margin calculation is correct

#### Formatting Verification
- [ ] Currency formatting is consistent
- [ ] Dates are formatted correctly
- [ ] Tables are properly aligned
- [ ] Simple vs Advanced mode displays correctly
- [ ] Category/product/revenue stream breakdowns display correctly

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All data is included in PDF
- [ ] Formatting matches preview
- [ ] File name is descriptive (e.g., `profit-loss-2024-01-01-to-2024-12-31.pdf`)
- [ ] Headers and footers are present

#### Python Validation
- [ ] Python script validates net income calculation
- [ ] Python script validates gross margin calculation
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

### 2. Balance Sheet
**Backend Function:** `getBalanceSheetData`

#### Data Verification
- [ ] Asset balances calculated correctly from entry_lines
- [ ] Liability balances calculated correctly
- [ ] Equity calculations include retained earnings
- [ ] Balance sheet balances (Assets = Liabilities + Equity) (verified with Python)
- [ ] As-of-date filtering works
- [ ] Retained earnings calculation is correct

#### Formatting Verification
- [ ] Assets section displays correctly
- [ ] Liabilities section displays correctly
- [ ] Equity section displays correctly
- [ ] Balance validation alert shows correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### Python Validation
- [ ] Python script validates balance (Assets = Liabilities + Equity)
- [ ] Python script validates totals
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

### 3. Cash Flow Statement (Indirect Method)
**Backend Function:** `getCashFlowStatementData`

#### Data Verification
- [ ] Operating activities calculated correctly
- [ ] Net income matches P&L
- [ ] Working capital changes calculated properly
- [ ] Beginning/ending cash balances match balance sheet
- [ ] Monthly/quarterly breakdowns are accurate
- [ ] Cash from operations calculation is correct (verified with Python)

#### Formatting Verification
- [ ] Operating activities section displays correctly
- [ ] Investing activities section displays correctly
- [ ] Financing activities section displays correctly
- [ ] Period breakdown tab works correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### Python Validation
- [ ] Python script validates cash from operations
- [ ] Python script validates net change in cash
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

### 4. General Ledger Report
**Backend Function:** `getGeneralLedgerData`

#### Data Verification
- [ ] All entries in date range are included
- [ ] Account filtering works
- [ ] Debit/credit amounts are correct
- [ ] Running balances calculated correctly
- [ ] Entry details (date, memo, accounts) are accurate

#### Formatting Verification
- [ ] Table displays correctly
- [ ] Date formatting is consistent
- [ ] Account names display correctly
- [ ] Debit/credit columns are aligned
- [ ] Running balance column displays correctly (when filtered by account)

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All entries are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### CSV Export
- [ ] CSV export works correctly
- [ ] All columns are included
- [ ] Data is properly formatted

**Status:** ⏸️ Not Started

---

### 5. Trial Balance
**Backend Function:** `getTrialBalanceData`

#### Data Verification
- [ ] All accounts included
- [ ] Debits and credits calculated correctly per account type
- [ ] Totals balance (debits = credits) (verified with Python)
- [ ] Account type sorting is correct
- [ ] As-of-date filtering works

#### Formatting Verification
- [ ] Table displays correctly
- [ ] Account types are properly labeled
- [ ] Debit/credit columns are aligned
- [ ] Totals row displays correctly
- [ ] Balance validation alerts show correctly

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All accounts are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### Python Validation
- [ ] Python script validates debits = credits
- [ ] Python script validates account totals
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

## Business Health & Operations Reports (8 reports)

### 6. Burn Rate + Runway Report
**Backend Function:** `getBurnRateRunwayData`

#### Data Verification
- [ ] Monthly burn calculations are accurate
- [ ] Average burn rate is correct (verified with Python)
- [ ] Runway calculation (cash / burn rate) is accurate (verified with Python)
- [ ] Scenario analysis calculations are correct
- [ ] Monthly breakdown data is accurate

#### Formatting Verification
- [ ] Key metrics cards display correctly
- [ ] Runway status alerts show correctly
- [ ] Scenario analysis section displays correctly
- [ ] Monthly breakdown table displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### Python Validation
- [ ] Python script validates average monthly burn
- [ ] Python script validates runway months
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

### 7. Monthly / Quarterly Financial Summary
**Backend Function:** `getFinancialSummaryData`

#### Data Verification
- [ ] Revenue/expenses match P&L data
- [ ] Trend calculations (vs previous period) are accurate
- [ ] Top categories are correctly sorted
- [ ] Cash flow data is accurate
- [ ] Period filtering (monthly/quarterly) works

#### Formatting Verification
- [ ] Key metrics cards display correctly
- [ ] Trend indicators (up/down arrows) show correctly
- [ ] Top revenue categories display correctly
- [ ] Top expense categories display correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

**Status:** ⏸️ Not Started

---

### 8. Business KPI Dashboard Report
**Backend Function:** `getKPIDashboardData`

#### Data Verification
- [ ] Gross margin calculation is correct
- [ ] Revenue growth percentage is accurate
- [ ] ARPU calculation is correct
- [ ] Owner compensation filtering works
- [ ] Top products/revenue streams are accurate

#### Formatting Verification
- [ ] KPI cards display correctly
- [ ] Growth indicators show correctly
- [ ] Top products table displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All KPIs are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

**Status:** ⏸️ Not Started

---

### 9. Accounts Receivable Summary
**Backend Function:** `getAccountsReceivableData`

#### Data Verification
- [ ] Aging buckets are calculated correctly (0-30, 31-60, etc.) (verified with Python)
- [ ] Customer totals are accurate
- [ ] Total outstanding matches sum of buckets (verified with Python)
- [ ] Customer grouping is correct

#### Formatting Verification
- [ ] Summary cards display correctly
- [ ] Aging buckets display correctly
- [ ] Customers table displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### Python Validation
- [ ] Python script validates aging buckets
- [ ] Python script validates total outstanding
- [ ] No discrepancies found

**Status:** ⏸️ Not Started

---

### 10. Accounts Payable Summary
**Backend Function:** `getAccountsPayableData`

#### Data Verification
- [ ] Due dates calculated correctly (30 days from transaction date)
- [ ] Overdue detection works
- [ ] Vendor totals are accurate
- [ ] Outstanding bills list is complete

#### Formatting Verification
- [ ] Summary card displays correctly
- [ ] Overdue alerts show correctly
- [ ] Outstanding bills table displays correctly
- [ ] Vendors table displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

**Status:** ⏸️ Not Started

---

### 11. Vendor Spend Analysis
**Backend Function:** `getVendorSpendAnalysisData`

#### Data Verification
- [ ] Vendor grouping is correct
- [ ] Total spend per vendor is accurate
- [ ] Transaction counts are correct
- [ ] Date range filtering works
- [ ] Average transaction calculation is correct

#### Formatting Verification
- [ ] Summary cards display correctly
- [ ] Top vendors table displays correctly
- [ ] Currency formatting is consistent
- [ ] Date range displays correctly

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### CSV Export
- [ ] CSV export works correctly
- [ ] All columns are included
- [ ] Data is properly formatted

**Status:** ⏸️ Not Started

---

### 12. Tax Preparation Packet
**Backend Function:** `getTaxPreparationData`

#### Data Verification
- [ ] Deductible categories are correctly identified
- [ ] Home office expenses filtered correctly
- [ ] Vehicle expenses filtered correctly
- [ ] Tax year filtering works
- [ ] Profit calculation matches P&L

#### Formatting Verification
- [ ] Summary cards display correctly
- [ ] Deductible categories table displays correctly
- [ ] Currency formatting is consistent
- [ ] Tax year displays correctly

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

#### CSV Export
- [ ] CSV export works correctly
- [ ] All categories are included
- [ ] Summary rows are included

**Status:** ⏸️ Not Started

---

### 13. Year-End Accountant Pack
**Backend Function:** `getYearEndAccountantPackData`

#### Data Verification
- [ ] Trial balance data is included and accurate
- [ ] General ledger summary is complete
- [ ] P&L data is accurate
- [ ] Balance sheet data is accurate
- [ ] Adjustments log is complete
- [ ] Data consistency across all reports

#### Formatting Verification
- [ ] Tabs display correctly
- [ ] Summary section displays correctly
- [ ] All report sections are accessible
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors (all documents)
- [ ] All reports are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

**Status:** ⏸️ Not Started

---

## Business Snapshot Reports (4 reports)

### 14. Bank / Lender Application Snapshot
**Backend Function:** `getBankLenderReportData`

#### Data Verification
- [ ] Financial data is accurate
- [ ] Cash flow metrics are correct
- [ ] Accounts data is complete
- [ ] Date range filtering works

#### Formatting Verification
- [ ] All sections display correctly
- [ ] Business logo displays (if present)
- [ ] Currency formatting is consistent
- [ ] Print styles work correctly

#### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections are included
- [ ] Formatting matches preview
- [ ] File name is descriptive

**Status:** ⏸️ Not Started

---

### 15. Creditor / Vendor Snapshot
**Backend Function:** (Uses existing report data)

#### Data Verification
- [ ] Financial overview is accurate
- [ ] Payment terms data is correct

#### Formatting Verification
- [ ] Report displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] Formatting matches preview

**Status:** ⏸️ Not Started

---

### 16. Investor Summary
**Backend Function:** (Uses existing report data)

#### Data Verification
- [ ] Growth metrics are accurate
- [ ] Revenue trends are correct
- [ ] Business outlook data is complete

#### Formatting Verification
- [ ] Report displays correctly
- [ ] Charts/graphs render (if any)
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] Formatting matches preview

**Status:** ⏸️ Not Started

---

### 17. Internal Executive Summary
**Backend Function:** (Uses existing report data)

#### Data Verification
- [ ] Burn rate analysis is accurate
- [ ] Runway projections are correct
- [ ] Strategic recommendations are included

#### Formatting Verification
- [ ] Report displays correctly
- [ ] Currency formatting is consistent

#### PDF Generation
- [ ] PDF generates without errors
- [ ] Formatting matches preview

**Status:** ⏸️ Not Started

---

## Testing Notes

### Mock Data Testing
- [ ] Mock data set created (3-6 months of transactions)
- [ ] All reports tested with mock data
- [ ] Python validation run on all reports with mock data
- [ ] All discrepancies documented and fixed

### Real Data Testing
- [ ] All reports tested with real user data
- [ ] Python validation run on all reports with real data
- [ ] Edge cases tested (empty data, single transaction, etc.)
- [ ] Performance verified with large datasets

### PDF Generation Testing
- [ ] All 14 reports generate PDFs successfully
- [ ] PDFs open correctly in viewers
- [ ] All data is included in PDFs
- [ ] Formatting matches preview
- [ ] File names are descriptive
- [ ] PDFs are properly sized

### Python Validation Results
_Results will be documented here as validation runs_

---

## Issues Found and Fixed

### Issue Log
_Issues will be documented here as they are discovered and fixed_

---

## Final Status

**Overall Status:** ⏸️ Not Started

**Completion Date:** TBD

**Validated By:** TBD

