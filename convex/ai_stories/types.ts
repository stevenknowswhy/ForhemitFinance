/**
 * Type definitions for AI Stories
 */

/**
 * Financial data aggregation for story generation
 */
export interface FinancialData {
  // Period information
  periodStart: number;
  periodEnd: number;
  periodType: "monthly" | "quarterly" | "annually";

  // Revenue and expenses
  revenue: number;
  expenses: number;
  netIncome: number;

  // Cash flow
  cashFlow: number;
  startingCash: number;
  endingCash: number;

  // Business metrics
  burnRate: number;
  runway: number; // months

  // Debt metrics
  debtToIncome: number;
  debtToRevenue: number;

  // Growth metrics
  growthRate: number;
  revenueGrowth: number;

  // Category breakdowns
  revenueByCategory: Array<{ category: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;

  // Monthly/quarterly breakdowns
  periodBreakdown: Array<{
    period: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }>;

  // Account balances
  accountBalances: Array<{ accountName: string; balance: number; type: string }>;

  // Transaction counts
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;

  // Trends
  monthOverMonthChange: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };

  // Business context
  businessType?: string;
  businessEntityType?: string;
  accountingMethod: string;
}

