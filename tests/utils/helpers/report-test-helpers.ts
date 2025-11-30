/**
 * Report Test Data Helpers
 * Utilities for testing and validating report data
 */

export interface ReportDataStructure {
  dateRange?: { start: number; end: number };
  revenue?: { total: number; items?: Array<{ account: string; amount: number }> };
  expenses?: { total: number; items?: Array<{ account: string; amount: number }> };
  netIncome?: number;
  grossMargin?: number;
  [key: string]: any;
}

/**
 * Validate that report data has required structure
 */
export function validateReportStructure(
  data: any,
  reportType: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ["Report data is null or undefined"] };
  }

  switch (reportType) {
    case "profit_loss":
      if (typeof data.revenue?.total !== "number") {
        errors.push("Revenue total is missing or invalid");
      }
      if (typeof data.expenses?.total !== "number") {
        errors.push("Expenses total is missing or invalid");
      }
      if (typeof data.netIncome !== "number") {
        errors.push("Net income is missing or invalid");
      }
      if (data.dateRange && (!data.dateRange.start || !data.dateRange.end)) {
        errors.push("Date range is incomplete");
      }
      break;

    case "balance_sheet":
      if (typeof data.assets?.total !== "number") {
        errors.push("Assets total is missing or invalid");
      }
      if (typeof data.liabilities?.total !== "number") {
        errors.push("Liabilities total is missing or invalid");
      }
      if (typeof data.equity?.total !== "number") {
        errors.push("Equity total is missing or invalid");
      }
      if (typeof data.isBalanced !== "boolean") {
        errors.push("Balance status is missing or invalid");
      }
      break;

    case "cash_flow":
      if (typeof data.operatingActivities?.cashFromOperations !== "number") {
        errors.push("Cash from operations is missing or invalid");
      }
      if (typeof data.netChangeInCash !== "number") {
        errors.push("Net change in cash is missing or invalid");
      }
      break;

    case "trial_balance":
      if (!data.entries || !Array.isArray(data.entries)) {
        errors.push("Trial balance entries are missing or invalid");
      }
      if (typeof data.totals?.debits !== "number") {
        errors.push("Total debits is missing or invalid");
      }
      if (typeof data.totals?.credits !== "number") {
        errors.push("Total credits is missing or invalid");
      }
      break;

    case "burn_rate":
      if (typeof data.averageMonthlyBurn !== "number") {
        errors.push("Average monthly burn is missing or invalid");
      }
      if (!Array.isArray(data.monthlyBurns)) {
        errors.push("Monthly burns array is missing or invalid");
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify calculation accuracy for P&L
 */
export function verifyProfitLossCalculations(data: any): {
  valid: boolean;
  discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }>;
} {
  const discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }> = [];

  if (!data) {
    return { valid: false, discrepancies: [] };
  }

  // Verify net income = revenue - expenses
  const revenue = data.revenue?.total || 0;
  const expenses = data.expenses?.total || 0;
  const expectedNetIncome = revenue - expenses;
  const actualNetIncome = data.netIncome || 0;
  const netIncomeDiff = Math.abs(expectedNetIncome - actualNetIncome);

  if (netIncomeDiff > 0.01) {
    discrepancies.push({
      field: "netIncome",
      expected: expectedNetIncome,
      actual: actualNetIncome,
      difference: netIncomeDiff,
    });
  }

  // Verify gross margin
  const expectedGrossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
  const actualGrossMargin = data.grossMargin || 0;
  const marginDiff = Math.abs(expectedGrossMargin - actualGrossMargin);

  if (marginDiff > 0.1) {
    discrepancies.push({
      field: "grossMargin",
      expected: expectedGrossMargin,
      actual: actualGrossMargin,
      difference: marginDiff,
    });
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Verify balance sheet balances
 */
export function verifyBalanceSheetCalculations(data: any): {
  valid: boolean;
  discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }>;
} {
  const discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }> = [];

  if (!data) {
    return { valid: false, discrepancies: [] };
  }

  const assets = data.assets?.total || 0;
  const liabilities = data.liabilities?.total || 0;
  const equity = data.equity?.total || 0;
  const retainedEarnings = data.equity?.retainedEarnings || 0;
  const totalEquity = equity + retainedEarnings;
  const expectedLiabEquity = liabilities + totalEquity;
  const actualLiabEquity = data.totalLiabilitiesAndEquity || 0;
  const balanceDiff = Math.abs(assets - expectedLiabEquity);

  if (balanceDiff > 0.01) {
    discrepancies.push({
      field: "balance",
      expected: expectedLiabEquity,
      actual: assets,
      difference: balanceDiff,
    });
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Verify trial balance totals
 */
export function verifyTrialBalanceCalculations(data: any): {
  valid: boolean;
  discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }>;
} {
  const discrepancies: Array<{ field: string; expected: number; actual: number; difference: number }> = [];

  if (!data || !data.entries) {
    return { valid: false, discrepancies: [] };
  }

  let calculatedDebits = 0;
  let calculatedCredits = 0;

  data.entries.forEach((entry: any) => {
    calculatedDebits += entry.debit || 0;
    calculatedCredits += entry.credit || 0;
  });

  const reportedDebits = data.totals?.debits || 0;
  const reportedCredits = data.totals?.credits || 0;

  const debitsDiff = Math.abs(calculatedDebits - reportedDebits);
  const creditsDiff = Math.abs(calculatedCredits - reportedCredits);
  const balanceDiff = Math.abs(calculatedDebits - calculatedCredits);

  if (debitsDiff > 0.01) {
    discrepancies.push({
      field: "totalDebits",
      expected: calculatedDebits,
      actual: reportedDebits,
      difference: debitsDiff,
    });
  }

  if (creditsDiff > 0.01) {
    discrepancies.push({
      field: "totalCredits",
      expected: calculatedCredits,
      actual: reportedCredits,
      difference: creditsDiff,
    });
  }

  if (balanceDiff > 0.01) {
    discrepancies.push({
      field: "balance",
      expected: 0,
      actual: balanceDiff,
      difference: balanceDiff,
    });
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Generate mock report data for testing
 */
export function generateMockProfitLossData(): ReportDataStructure {
  return {
    dateRange: {
      start: Date.now() - 365 * 24 * 60 * 60 * 1000,
      end: Date.now(),
    },
    revenue: {
      total: 100000,
      items: [
        { account: "Sales Revenue", amount: 80000 },
        { account: "Service Revenue", amount: 20000 },
      ],
      byCategory: [
        { category: "Product Sales", amount: 80000 },
        { category: "Consulting", amount: 20000 },
      ],
    },
    expenses: {
      total: 75000,
      items: [
        { account: "Cost of Goods Sold", amount: 40000 },
        { account: "Operating Expenses", amount: 35000 },
      ],
      byCategory: [
        { category: "Materials", amount: 40000 },
        { category: "Salaries", amount: 30000 },
        { category: "Rent", amount: 5000 },
      ],
    },
    netIncome: 25000,
    grossMargin: 25.0,
  };
}

