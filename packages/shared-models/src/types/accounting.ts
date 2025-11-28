/**
 * Core accounting types - shared across all platforms
 */

export type AccountType = 
  | 'asset' 
  | 'liability' 
  | 'equity' 
  | 'income' 
  | 'expense';

export type EntrySide = 'debit' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  isBusiness: boolean;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EntryLine {
  id: string;
  entryId: string;
  accountId: string;
  side: EntrySide;
  amount: number;
  currency: string;
}

export interface ProposedEntry {
  id: string;
  userId: string;
  transactionId?: string; // Links to raw transaction
  receiptId?: string; // Links to receipt upload
  date: number;
  memo: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  confidence: number; // 0-1
  source: 'plaid_rules' | 'user_rule' | 'ai_model' | 'manual';
  explanation: string;
  isBusiness: boolean;
  createdAt: number;
}

export interface FinalEntry {
  id: string;
  userId: string;
  date: number;
  memo: string;
  source: 'plaid' | 'manual' | 'ai' | 'adjustment';
  status: 'posted' | 'pending';
  createdAt: number;
  approvedAt: number;
  approvedBy: string; // userId
}

export interface EntryWithLines extends FinalEntry {
  lines: EntryLine[];
}

/**
 * Double-entry accounting rule: ensures debits = credits
 */
export interface DoubleEntryRule {
  debitAccountId: string;
  creditAccountId: string;
  conditions?: EntryCondition[];
}

export interface EntryCondition {
  field: 'merchant' | 'amount' | 'category' | 'date';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | [number, number];
}

