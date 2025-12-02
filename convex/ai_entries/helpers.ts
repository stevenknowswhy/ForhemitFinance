/**
 * Helper functions for AI-powered double-entry accounting
 */

import { Account, EntrySuggestion, TransactionContext } from "./types";

/**
 * Inline accounting engine logic (since workspace packages aren't available in Convex)
 */
export function suggestEntry(
  transaction: TransactionContext,
  accounts: Account[],
  overrideDebitAccountId?: string,
  overrideCreditAccountId?: string,
  businessContext?: {
    businessType?: string;
    businessEntityType?: string;
    accountingMethod: string;
  } | null
): EntrySuggestion {
  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  // Smart account selection based on account types
  // For expenses: prefer credit cards (liability) if available, otherwise checking (asset)
  // For income: always use checking/savings (asset)
  
  let bankAccount: Account | undefined;
  let creditCardAccount: Account | undefined;

  // Find credit card accounts (liability type)
  creditCardAccount = accounts.find(
    a => a.type === 'liability' &&
    a.name.toLowerCase().includes('credit')
  );

  // Find checking account (preferred for income and as fallback)
  bankAccount = accounts.find(
    a => a.type === 'asset' && 
    a.name.toLowerCase().includes('checking')
  ) || accounts.find(
    a => a.type === 'asset' && 
    a.name.toLowerCase().includes('savings')
  ) || accounts.find(a => a.type === 'asset');

  if (!bankAccount) {
    throw new Error('No bank account found for entry');
  }

  // Income transaction
  if (isIncome) {
    const incomeAccount = findAccountByCategory(
      accounts,
      'income',
      transaction.category || []
    ) || accounts.find(a => a.type === 'income');
    
    // Use override if provided, otherwise use bank account
    const debitAccount = overrideDebitAccountId 
      ? accounts.find(a => a.id === overrideDebitAccountId) || bankAccount
      : bankAccount;
    
    const creditAccount = overrideCreditAccountId
      ? accounts.find(a => a.id === overrideCreditAccountId) || incomeAccount
      : incomeAccount;
    
    if (incomeAccount && debitAccount) {
      return {
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount?.id || incomeAccount.id,
        amount,
        memo: transaction.description,
        confidence: 0.85,
        explanation: `Income transaction: ${incomeAccount.name} → ${debitAccount.name}`,
      };
    }
  }

  // Expense transaction
  let expenseAccount: Account | null = null;
  if (isExpense) {
    // Enhanced expense account selection with business context
    if (transaction.isBusiness && businessContext) {
      // Industry-specific account preferences
      const industryAccounts = getIndustryPreferredAccounts(
        businessContext.businessType,
        accounts
      );
      
      if (industryAccounts.length > 0) {
        expenseAccount = industryAccounts[0];
      }
    }

    // If no industry match, try to find account by category
    if (!expenseAccount) {
      expenseAccount = findAccountByCategory(
        accounts,
        'expense',
        transaction.category || transaction.plaidCategory || []
      );
    }

    // If no category match, try to find a specific expense account based on description/merchant
    // Check description FIRST (user's title is most accurate)
    if (!expenseAccount) {
      const desc = transaction.description.toLowerCase();
      const merchant = (transaction.merchant || "").toLowerCase();
      
      // Check description for food/meals keywords FIRST
      if (desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || 
          desc.includes('meal') || desc.includes('food') || desc.includes('restaurant') || 
          desc.includes('coffee') || desc.includes('starbucks') || desc.includes('dining') ||
          desc.includes('cafe') || desc.includes('bar') || desc.includes('pizza') ||
          desc.includes('eat') || desc.includes('drink') || desc.includes('beverage')) {
        expenseAccount = accounts.find(a => 
          a.type === 'expense' && 
          (a.name.toLowerCase().includes('meals') || a.name.toLowerCase().includes('food') || 
           a.name.toLowerCase().includes('dining') || a.name.toLowerCase().includes('entertainment'))
        ) || null;
      } else if (desc.includes('office') || desc.includes('supplies') || desc.includes('stationery')) {
        expenseAccount = accounts.find(a =>
          a.type === 'expense' &&
          (a.name.toLowerCase().includes('office') || a.name.toLowerCase().includes('supplies'))
        ) || null;
      } else if (desc.includes('travel') || desc.includes('hotel') || desc.includes('flight')) {
        expenseAccount = accounts.find(a => 
          a.type === 'expense' && a.name.toLowerCase().includes('travel')
        ) || null;
      } else if (desc.includes('software') || desc.includes('saas') || desc.includes('subscription')) {
        expenseAccount = accounts.find(a => 
          a.type === 'expense' && 
          (a.name.toLowerCase().includes('software') || a.name.toLowerCase().includes('subscription'))
        ) || null;
      }
      
      // If still no match, check merchant
      if (!expenseAccount && transaction.merchant) {
        const merchantLower = merchant;
        if (merchantLower.includes('office') || merchantLower.includes('supplies')) {
          expenseAccount = accounts.find(a =>
            a.type === 'expense' &&
            (a.name.toLowerCase().includes('office') || a.name.toLowerCase().includes('supplies'))
          ) || null;
        } else if (merchantLower.includes('travel') || merchantLower.includes('hotel') || merchantLower.includes('flight')) {
          expenseAccount = accounts.find(a => 
            a.type === 'expense' && a.name.toLowerCase().includes('travel')
          ) || null;
        } else if (merchantLower.includes('software') || merchantLower.includes('saas') || merchantLower.includes('subscription')) {
          expenseAccount = accounts.find(a => 
            a.type === 'expense' && 
            (a.name.toLowerCase().includes('software') || a.name.toLowerCase().includes('subscription'))
          ) || null;
        } else if (merchantLower.includes('food') || merchantLower.includes('restaurant') || merchantLower.includes('coffee')) {
          expenseAccount = accounts.find(a => 
            a.type === 'expense' && 
            (a.name.toLowerCase().includes('meals') || a.name.toLowerCase().includes('food') || a.name.toLowerCase().includes('dining'))
          ) || null;
        }
      }
    }

    // If still no match, find any expense account EXCEPT uncategorized
    if (!expenseAccount) {
      expenseAccount = accounts.find(a => 
        a.type === 'expense' && 
        !a.name.toLowerCase().includes('uncategorized') &&
        !a.name.toLowerCase().includes('miscellaneous') &&
        !a.name.toLowerCase().includes('other')
      ) || null;
    }

    // Last resort: find any expense account (but prefer not uncategorized)
    if (!expenseAccount) {
      expenseAccount = accounts.find(a => a.type === 'expense') || null;
    }

    if (expenseAccount) {
      // For expenses: prefer credit card if available, otherwise use bank account
      // Use override if provided
      const creditAccount = overrideCreditAccountId
        ? accounts.find(a => a.id === overrideCreditAccountId)
        : (creditCardAccount || bankAccount);
      
      const debitAccount = overrideDebitAccountId
        ? accounts.find(a => a.id === overrideDebitAccountId) || expenseAccount
        : expenseAccount;

      if (creditAccount) {
        const accountType = creditCardAccount ? 'credit card' : 'bank account';
        return {
          debitAccountId: debitAccount.id,
          creditAccountId: creditAccount.id,
          amount,
          memo: transaction.description,
          confidence: expenseAccount.name.toLowerCase().includes('uncategorized') ? 0.50 : 0.80,
          explanation: `Expense: ${expenseAccount.name} paid from ${creditAccount.name} (${accountType})`,
        };
      }
    }
  }

  if (expenseAccount && bankAccount) {
    return {
      debitAccountId: expenseAccount.id,
      creditAccountId: bankAccount.id,
      amount,
      memo: transaction.description,
      confidence: 0.60,
      explanation: `Generic expense entry`,
    };
  }

  throw new Error('Unable to generate entry suggestion');
}

/**
 * Get industry-preferred accounts based on business type
 */
export function getIndustryPreferredAccounts(
  businessType: string | undefined,
  accounts: Account[]
): Account[] {
  if (!businessType) return [];

  const preferences: Record<string, string[]> = {
    creator: ['software', 'equipment', 'marketing', 'subscription'],
    tradesperson: ['vehicle', 'tools', 'materials', 'equipment'],
    wellness: ['equipment', 'certification', 'facility', 'marketing'],
    tutor: ['materials', 'software', 'education', 'marketing'],
    real_estate: ['marketing', 'professional', 'vehicle', 'software'],
    agency: ['software', 'marketing', 'professional', 'subscription'],
  };

  const preferredKeywords = preferences[businessType] || [];
  const matching = accounts.filter(acc =>
    acc.type === 'expense' &&
    preferredKeywords.some(keyword =>
      acc.name.toLowerCase().includes(keyword)
    )
  );

  return matching;
}

export function findAccountByCategory(
  accounts: Account[],
  accountType: Account['type'],
  categories: string[]
): Account | null {
  if (categories.length === 0) return null;

  // Map common categories to account types
  const categoryMap: Record<string, string[]> = {
    'office supplies': ['office', 'supplies', 'expenses'],
    'meals & entertainment': ['meals', 'food', 'restaurant', 'dining', 'entertainment', 'meals & entertainment'],
    'meals': ['meals', 'food', 'restaurant', 'dining', 'entertainment'],
    'travel': ['travel', 'transportation'],
    'software & subscriptions': ['software', 'subscription', 'saas'],
    'software': ['software', 'subscription', 'saas'],
    'utilities': ['utilities', 'electric', 'water'],
    'rent': ['rent', 'lease'],
  };

  const firstCategory = categories[0].toLowerCase();
  // Try exact match first, then try partial matches
  let keywords = categoryMap[firstCategory];
  if (!keywords) {
    // Try to find a partial match (e.g., "meals & entertainment" contains "meals")
    for (const [key, values] of Object.entries(categoryMap)) {
      if (firstCategory.includes(key) || key.includes(firstCategory)) {
        keywords = values;
        break;
      }
    }
    // If still no match, use the category name itself
    if (!keywords) {
      keywords = [firstCategory];
    }
  }

  // Try to find account matching category keywords
  for (const keyword of keywords) {
    const match = accounts.find(a => 
      a.type === accountType && 
      a.name.toLowerCase().includes(keyword)
    );
    if (match) return match;
  }

  // Fallback: find any account of the right type
  return accounts.find(a => a.type === accountType) || null;
}

/**
 * Enhanced keyword matching fallback for category inference
 */
export function inferCategoryFromKeywords(
  description: string,
  merchant: string | undefined,
  isBusiness: boolean
): { category: string; confidence: number; method: "keyword" } {
  const desc = description.toLowerCase();
  const merch = (merchant || "").toLowerCase();
  const combined = `${desc} ${merch}`;

  // Comprehensive keyword matching with business context
  const patterns = [
    // Meals & Entertainment (highest priority for common case)
    {
      keywords: ['dinner', 'lunch', 'breakfast', 'meal', 'food', 'restaurant', 'coffee', 'starbucks', 'dining', 'cafe', 'bar', 'pizza', 'eat', 'drink', 'beverage', 'catering'],
      category: 'Meals & Entertainment',
      confidence: 0.90,
    },
    // Office Supplies
    {
      keywords: ['office', 'supplies', 'stationery', 'paper', 'pens', 'staples', 'stapler', 'folder', 'binder'],
      category: 'Office Supplies',
      confidence: 0.85,
    },
    // Travel
    {
      keywords: ['travel', 'hotel', 'flight', 'uber', 'lyft', 'taxi', 'airline', 'airport', 'lodging', 'accommodation', 'car rental', 'rental car'],
      category: 'Travel',
      confidence: 0.90,
    },
    // Software & Subscriptions
    {
      keywords: ['software', 'saas', 'subscription', 'app', 'platform', 'service', 'cloud', 'hosting', 'domain', 'ssl'],
      category: 'Software & Subscriptions',
      confidence: 0.85,
    },
    // Marketing & Advertising
    {
      keywords: ['marketing', 'advertising', 'promotion', 'ad', 'campaign', 'social media', 'seo', 'ppc', 'google ads', 'facebook ads'],
      category: 'Marketing & Advertising',
      confidence: 0.85,
    },
    // Professional Services
    {
      keywords: ['legal', 'attorney', 'lawyer', 'accounting', 'bookkeeping', 'cpa', 'consulting', 'consultant', 'professional service'],
      category: 'Professional Services',
      confidence: 0.90,
    },
    // Utilities
    {
      keywords: ['utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'telephone', 'utility', 'power', 'electricity'],
      category: 'Utilities',
      confidence: 0.85,
    },
    // Rent
    {
      keywords: ['rent', 'lease', 'rental', 'landlord'],
      category: 'Rent',
      confidence: 0.90,
    },
    // Insurance
    {
      keywords: ['insurance', 'premium', 'coverage', 'policy'],
      category: 'Insurance',
      confidence: 0.85,
    },
    // Vehicle
    {
      keywords: ['vehicle', 'car', 'truck', 'gas', 'fuel', 'gasoline', 'maintenance', 'repair', 'auto', 'automotive'],
      category: 'Vehicle Expenses',
      confidence: 0.80,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => combined.includes(keyword))) {
      return { category: pattern.category, confidence: pattern.confidence, method: "keyword" };
    }
  }

  // Fallback
  return {
    category: isBusiness ? 'Other Business Expense' : 'Other Personal Expense',
    confidence: 0.50,
    method: "keyword",
  };
}

