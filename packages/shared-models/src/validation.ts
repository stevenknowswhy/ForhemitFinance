/**
 * Zod validation schemas for runtime type checking
 */

import { z } from 'zod';

export const AccountTypeSchema = z.enum([
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
]);

export const EntrySideSchema = z.enum(['debit', 'credit']);

export const ProposedEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  transactionId: z.string().optional(),
  receiptId: z.string().optional(),
  date: z.number(),
  memo: z.string(),
  debitAccountId: z.string(),
  creditAccountId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  confidence: z.number().min(0).max(1),
  source: z.enum(['plaid_rules', 'user_rule', 'ai_model', 'manual']),
  explanation: z.string(),
  isBusiness: z.boolean(),
  createdAt: z.number(),
});

export const RawTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  plaidTransactionId: z.string().optional(),
  accountId: z.string(),
  amount: z.number(),
  currency: z.string().length(3),
  date: z.string(),
  merchant: z.string().optional(),
  category: z.array(z.string()).optional(),
  plaidCategory: z.array(z.string()).optional(),
  description: z.string(),
  isPending: z.boolean(),
  source: z.enum(['plaid', 'manual', 'receipt']),
  receiptUrl: z.string().url().optional(),
  createdAt: z.number(),
});

