/**
 * Reports data aggregation functions
 * Re-exports all report queries from the reports module
 * 
 * Note: This file maintains backward compatibility.
 * The actual implementation is in modules/reports/convex/
 */

// Re-export from reports module
export { getBankLenderReportData } from "./modules/reports/bankLender";
export { getProfitAndLossData } from "./modules/reports/profitLoss";
export { getBalanceSheetData } from "./modules/reports/balanceSheet";
export { getCashFlowStatementData } from "./modules/reports/cashFlow";
export { getGeneralLedgerData } from "./modules/reports/generalLedger";
export { getTrialBalanceData } from "./modules/reports/trialBalance";
export { getBurnRateRunwayData } from "./modules/reports/burnRateRunway";
export { getFinancialSummaryData } from "./modules/reports/financialSummary";
export { getKPIDashboardData } from "./modules/reports/kpiDashboard";
export { getAccountsReceivableData } from "./modules/reports/accountsReceivable";
export { getAccountsPayableData } from "./modules/reports/accountsPayable";
export { getVendorSpendAnalysisData } from "./modules/reports/vendorSpendAnalysis";
export { getTaxPreparationData } from "./modules/reports/taxPreparation";
export { getYearEndAccountantPackData } from "./modules/reports/yearEndAccountantPack";
export * from "./modules/reports/utils";
