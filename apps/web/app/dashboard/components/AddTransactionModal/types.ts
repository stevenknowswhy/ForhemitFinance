/**
 * Types and interfaces for AddTransactionModal
 */

export interface AddTransactionModalProps {
  onClose: () => void;
}

export interface LineItem {
  id: string;
  description: string;
  category: string;
  amount: string;
  tax: string;
  tip: string;
  debitAccountId?: string;
  creditAccountId?: string;
}

export type TransactionIntent = 
  | "business_expense" 
  | "personal_expense" 
  | "business_income" 
  | "personal_income" 
  | null;

export type TransactionType = "income" | "expense" | null;

export interface TransactionFormData {
  title: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  note: string;
  debitAccountId: string;
  creditAccountId: string;
  intent: TransactionIntent;
  transactionType: TransactionType;
  isBusiness: boolean | null;
}

export interface FormErrors {
  [key: string]: string;
}

