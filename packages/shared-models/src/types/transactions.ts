/**
 * Transaction types from Plaid and manual entries
 */

export interface RawTransaction {
  id: string;
  userId: string;
  plaidTransactionId?: string;
  accountId: string; // Bank account ID
  amount: number;
  currency: string;
  date: string; // ISO date string
  merchant?: string;
  category?: string[];
  plaidCategory?: string[];
  description: string;
  status: 'pending' | 'posted' | 'cleared' | 'reconciled';
  postedAt?: number;
  clearedAt?: number;
  reconciledAt?: number;
  source: 'plaid' | 'manual' | 'receipt';
  receiptUrl?: string;
  createdAt: number;
}

export interface Receipt {
  id: string;
  userId: string;
  storageUrl: string; // S3/R2 URL
  ocrData?: ReceiptOCRData;
  matchedTransactionId?: string;
  uploadedAt: number;
}

export interface ReceiptOCRData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: ReceiptItem[];
  tax?: number;
  tip?: number;
  confidence: number;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface TransactionMatch {
  transactionId: string;
  receiptId: string;
  confidence: number;
  matchReason: 'amount_date' | 'merchant' | 'manual';
}

