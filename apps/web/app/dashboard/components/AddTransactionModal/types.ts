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

export interface AISuggestion {
  category: string;
  debitAccountId: string;
  creditAccountId: string;
  explanation: string;
  confidence: number; // 0-1
  isNewCategory?: boolean;
  debitAccountName?: string;
  creditAccountName?: string;
  isBusiness?: boolean;
}

export interface ReceiptOCRData {
  url: string;
  ocrData?: any; // This will likely be refined later
  items?: any[];
  confidence?: number;
}
