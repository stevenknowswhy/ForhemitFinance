/**
 * Financial goals and budgeting types
 */

export type GoalType = 
  | 'save_amount' 
  | 'reduce_expense' 
  | 'increase_revenue' 
  | 'maintain_runway';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount?: number;
  targetDate?: number; // Unix timestamp
  currentAmount: number;
  status: GoalStatus;
  categoryId?: string; // If goal is category-specific
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  startDate: number;
  endDate: number;
  spent: number;
  createdAt: number;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: 'monthly_narrative' | 'alert' | 'recommendation' | 'forecast';
  period: string; // "2024-01" format
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

