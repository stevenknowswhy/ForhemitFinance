/**
 * Transaction processing and approval flows
 * 
 * This file re-exports all transaction-related functions from organized modules.
 * The actual implementation is split across:
 * - transactions/queries.ts - Query functions for fetching transactions
 * - transactions/mutations.ts - Mutation functions for creating/updating/deleting transactions
 * - transactions/actions.ts - Action functions for transaction operations
 */

// Queries
export {
  getPendingTransactions,
  getReceiptsByTransaction,
  getUserReceipts,
  getById,
  getByPlaidId,
  findSimilarTransactions,
} from "./transactions/queries";

// Mutations
export {
  approveEntry,
  rejectEntry,
  processTransaction,
  createRaw,
  createReceipt,
  updateTransaction,
  deleteTransaction,
  removePlaidTransactions,
  removePlaidTransactionsInternal,
  deleteAllTransactions,
} from "./transactions/mutations";

// Actions
export {
  removePlaidTransactionsByItemId,
} from "./transactions/actions";
