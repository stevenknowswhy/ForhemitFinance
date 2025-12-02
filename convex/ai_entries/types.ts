/**
 * Types for AI-powered double-entry accounting system
 */

export interface Account {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
}

export interface EntrySuggestion {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  memo: string;
  confidence: number;
  explanation: string;
}

export interface TransactionContext {
  amount: number;
  merchant?: string;
  description: string;
  category?: string[];
  plaidCategory?: string[];
  date: string;
  isBusiness: boolean;
  userId: string;
  isNewCategory?: boolean; // Flag indicating if category is new (not in default list)
}

