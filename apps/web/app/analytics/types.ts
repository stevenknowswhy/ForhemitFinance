/**
 * Type definitions for Analytics page
 */

export type TabType = "business" | "personal" | "blended";

export interface AnalyticsData {
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
  transactionCount: number;
  topCategories: Array<{ category: string; amount: number }>;
  averageDailySpending: number;
}

