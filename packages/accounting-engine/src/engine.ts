/**
 * Core double-entry accounting engine
 */

import type { 
  Account, 
  AccountType, 
  ProposedEntry, 
  EntryLine,
  FinalEntry 
} from '@ez-financial/shared-models';

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
}

/**
 * Generate a double-entry suggestion for a transaction
 */
export function suggestEntry(
  transaction: TransactionContext,
  accounts: Account[],
  userRules?: EntryRule[]
): EntrySuggestion {
  // 1. Try user-defined rules first (highest confidence)
  if (userRules && userRules.length > 0) {
    const ruleMatch = matchUserRule(transaction, userRules, accounts);
    if (ruleMatch) {
      return ruleMatch;
    }
  }

  // 2. Apply standard accounting rules based on transaction type
  const standardMatch = applyStandardRules(transaction, accounts);
  if (standardMatch) {
    return standardMatch;
  }

  // 3. Fallback to generic expense/income entry
  return createGenericEntry(transaction, accounts);
}

/**
 * Match against user-defined categorization rules
 */
function matchUserRule(
  transaction: TransactionContext,
  rules: EntryRule[],
  accounts: Account[]
): EntrySuggestion | null {
  for (const rule of rules) {
    if (evaluateRuleConditions(transaction, rule.conditions)) {
      const debitAccount = accounts.find(a => a.id === rule.debitAccountId);
      const creditAccount = accounts.find(a => a.id === rule.creditAccountId);
      
      if (debitAccount && creditAccount) {
        return {
          debitAccountId: rule.debitAccountId,
          creditAccountId: rule.creditAccountId,
          amount: Math.abs(transaction.amount),
          memo: transaction.description,
          confidence: 0.95, // High confidence for user rules
          explanation: `Matched your rule: ${rule.name || 'Custom rule'}`,
        };
      }
    }
  }
  return null;
}

/**
 * Apply standard accounting rules based on Plaid categories and patterns
 */
function applyStandardRules(
  transaction: TransactionContext,
  accounts: Account[]
): EntrySuggestion | null {
  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  // Find default accounts
  const bankAccount = accounts.find(
    a => a.type === 'asset' && a.name.toLowerCase().includes('checking')
  ) || accounts.find(a => a.type === 'asset');

  if (!bankAccount) {
    return null;
  }

  // Income transaction
  if (isIncome) {
    const incomeAccount = findAccountByCategory(
      accounts,
      'income',
      transaction.category || []
    );
    
    if (incomeAccount) {
      return {
        debitAccountId: bankAccount.id,
        creditAccountId: incomeAccount.id,
        amount,
        memo: transaction.description,
        confidence: 0.85,
        explanation: `Income transaction: ${incomeAccount.name}`,
      };
    }
  }

  // Expense transaction
  if (isExpense) {
    const expenseAccount = findAccountByCategory(
      accounts,
      'expense',
      transaction.category || transaction.plaidCategory || []
    );

    if (expenseAccount) {
      return {
        debitAccountId: expenseAccount.id,
        creditAccountId: bankAccount.id,
        amount,
        memo: transaction.description,
        confidence: 0.80,
        explanation: `Expense: ${expenseAccount.name} (from ${transaction.category?.[0] || 'category'})`,
      };
    }
  }

  return null;
}

/**
 * Create a generic entry when no specific rules match
 */
function createGenericEntry(
  transaction: TransactionContext,
  accounts: Account[]
): EntrySuggestion {
  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  const bankAccount = accounts.find(
    a => a.type === 'asset'
  );

  if (!bankAccount) {
    throw new Error('No bank account found for entry');
  }

  if (isIncome) {
    const incomeAccount = accounts.find(
      a => a.type === 'income' && a.name.toLowerCase().includes('revenue')
    ) || accounts.find(a => a.type === 'income');

    if (incomeAccount) {
      return {
        debitAccountId: bankAccount.id,
        creditAccountId: incomeAccount.id,
        amount,
        memo: transaction.description,
        confidence: 0.60,
        explanation: 'Generic income entry - please review category',
      };
    }
  }

  // Default to uncategorized expense
  const expenseAccount = accounts.find(
    a => a.type === 'expense' && a.name.toLowerCase().includes('uncategorized')
  ) || accounts.find(a => a.type === 'expense');

  if (expenseAccount && bankAccount) {
    return {
      debitAccountId: expenseAccount.id,
      creditAccountId: bankAccount.id,
      amount,
      memo: transaction.description,
      confidence: 0.50,
      explanation: 'Uncategorized expense - please assign category',
    };
  }

  throw new Error('Unable to create generic entry - missing accounts');
}

/**
 * Find account by category keywords
 */
function findAccountByCategory(
  accounts: Account[],
  accountType: AccountType,
  categories: string[]
): Account | null {
  if (categories.length === 0) {
    return null;
  }

  const categoryLower = categories[0].toLowerCase();

  // Map Plaid categories to account names
  const categoryMappings: Record<string, string[]> = {
    'food_and_drink': ['meals', 'restaurant', 'food', 'dining'],
    'general_merchandise': ['supplies', 'merchandise', 'general'],
    'travel': ['travel', 'transportation'],
    'gas_stations': ['fuel', 'gas', 'transportation'],
    'software': ['software', 'subscriptions', 'technology'],
    'office_supplies': ['office', 'supplies'],
    'professional_services': ['professional', 'services', 'consulting'],
  };

  // Try exact matches first
  for (const [plaidCategory, keywords] of Object.entries(categoryMappings)) {
    if (categoryLower.includes(plaidCategory) || 
        keywords.some(kw => categoryLower.includes(kw))) {
      const account = accounts.find(a => 
        a.type === accountType && 
        keywords.some(kw => a.name.toLowerCase().includes(kw))
      );
      if (account) return account;
    }
  }

  // Fallback: find any account of the right type
  return accounts.find(a => a.type === accountType) || null;
}

/**
 * Evaluate rule conditions against a transaction
 */
function evaluateRuleConditions(
  transaction: TransactionContext,
  conditions?: EntryCondition[]
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every(condition => {
    switch (condition.field) {
      case 'merchant':
        if (!transaction.merchant) return false;
        return condition.operator === 'contains' 
          ? transaction.merchant.toLowerCase().includes(String(condition.value).toLowerCase())
          : transaction.merchant.toLowerCase() === String(condition.value).toLowerCase();
      
      case 'amount':
        const amount = Math.abs(transaction.amount);
        switch (condition.operator) {
          case 'equals':
            return amount === Number(condition.value);
          case 'greater_than':
            return amount > Number(condition.value);
          case 'less_than':
            return amount < Number(condition.value);
          case 'between':
            const [min, max] = condition.value as [number, number];
            return amount >= min && amount <= max;
          default:
            return false;
        }
      
      case 'category':
        if (!transaction.category) return false;
        const categoryLower = String(condition.value).toLowerCase();
        return transaction.category.some(cat => 
          cat.toLowerCase().includes(categoryLower)
        );
      
      default:
        return false;
    }
  });
}

/**
 * Validate that an entry balances (debits = credits)
 */
export function validateEntryBalance(lines: EntryLine[]): boolean {
  const totalDebits = lines
    .filter(l => l.side === 'debit')
    .reduce((sum, l) => sum + l.amount, 0);
  
  const totalCredits = lines
    .filter(l => l.side === 'credit')
    .reduce((sum, l) => sum + l.amount, 0);

  return Math.abs(totalDebits - totalCredits) < 0.01; // Allow small floating point differences
}

/**
 * Create entry lines from a proposed entry
 */
export function createEntryLines(
  entry: ProposedEntry,
  entryId: string
): EntryLine[] {
  return [
    {
      id: `${entryId}-debit`,
      entryId,
      accountId: entry.debitAccountId,
      side: 'debit',
      amount: entry.amount,
      currency: entry.currency,
    },
    {
      id: `${entryId}-credit`,
      entryId,
      accountId: entry.creditAccountId,
      side: 'credit',
      amount: entry.amount,
      currency: entry.currency,
    },
  ];
}

// Type definitions for internal use
interface EntryRule {
  name?: string;
  debitAccountId: string;
  creditAccountId: string;
  conditions?: EntryCondition[];
}

interface EntryCondition {
  field: 'merchant' | 'amount' | 'category' | 'date';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | [number, number];
}

