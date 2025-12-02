/**
 * Plaid integration for bank account connections and transaction syncing
 * 
 * This file re-exports all Plaid-related functions from organized modules.
 * The actual implementation is split across:
 * - plaid/sdk.ts - SDK loading and client configuration
 * - plaid/link.ts - Link token creation and public token exchange
 * - plaid/institutions.ts - Institution management operations
 * - plaid/accounts.ts - Account syncing and management
 * - plaid/transactions.ts - Transaction syncing from Plaid
 * - plaid/mock.ts - Mock functions for testing
 * - plaid/analytics.ts - Transaction analytics queries
 */

// Link token and exchange
export { createLinkToken, exchangePublicToken } from "./plaid/link";

// Institution operations
export {
  storeInstitution,
  getInstitution,
  getUserInstitutions,
  updateLastSync,
  updateInstitutionStatus,
  getInstitutionByItemId,
  syncTransactionsByItemId,
  updateItemStatus,
} from "./plaid/institutions";

// Account syncing
export { syncAccounts, upsertAccount } from "./plaid/accounts";

// Transaction syncing
export { syncTransactions } from "./plaid/transactions";

// Mock functions
export {
  mockConnectBank,
  generateMockTransactions,
  getMockAccounts,
  getMockTransactions,
} from "./plaid/mock";

// Analytics queries
export {
  getMockTransactionAnalytics,
  getFilteredTransactionAnalytics,
  getFilteredTransactions,
  getAccountClassificationStats,
} from "./plaid/analytics";
