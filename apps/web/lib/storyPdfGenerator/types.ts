/**
 * Type definitions for PDF story generation
 */

export interface StoryData {
  id: string;
  type: 'company' | 'banker' | 'investor';
  period: 'monthly' | 'quarterly' | 'annually';
  title: string;
  content: string;
  keyMetrics: Record<string, number | string>;
  insight: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  role: string;
}

export interface ConvexFinancialData {
  cash_balance: number;
  monthly_revenue: number;
  monthly_expenses: number;
  expense_breakdown: Record<string, number>;
  total_debt?: number;
  accounts_receivable?: number;
  accounts_payable?: number;
  previous_revenue?: number;
  customer_ltv?: number;
  customer_cac?: number;
  churn_rate?: number;
}

export interface CompanyInfo {
  name: string;
  logo?: string;
}

