/**
 * AI-powered double-entry preview and explanation system
 * Integrates accounting engine with OpenRouter LLM for plain-language explanations
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getOrgContext } from "./helpers/orgContext";
import { requirePermission } from "./rbac";
import { PERMISSIONS } from "./permissions";

// Types for accounting engine (inlined since workspace packages may not be available in Convex)
interface Account {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
}

interface EntrySuggestion {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  memo: string;
  confidence: number;
  explanation: string;
}

interface TransactionContext {
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

/**
 * Inline accounting engine logic (since workspace packages aren't available in Convex)
 */
function suggestEntry(
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
function getIndustryPreferredAccounts(
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

function findAccountByCategory(
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
 * Build comprehensive system prompt for AI accounting decisions
 */
function buildSystemPrompt(
  transactionContext: TransactionContext,
  businessContext: {
    businessType?: string;
    businessEntityType?: string;
    businessCategory?: string;
    naicsCode?: string;
    accountingMethod: string;
  } | null,
  accounts: Account[]
): string {
  const isBusiness = transactionContext.isBusiness;
  const isExpense = transactionContext.amount < 0;
  const isIncome = transactionContext.amount > 0;

  let prompt = `You are an expert certified public accountant (CPA) with deep knowledge of:
- Generally Accepted Accounting Principles (GAAP)
- Double-entry bookkeeping fundamentals
- Tax code and deduction rules (IRS guidelines)
- Industry-specific accounting practices
- Small business and startup accounting needs

YOUR ROLE:
You are helping categorize transactions and create accurate double-entry accounting entries that follow accounting best practices and are optimized for tax purposes.

CORE PRINCIPLES:
1. **Accuracy First**: Every entry must balance (debits = credits)
2. **Tax Optimization**: Choose categories that maximize legitimate deductions
3. **GAAP Compliance**: Follow Generally Accepted Accounting Principles
4. **Industry Awareness**: Consider business type and industry standards
5. **Audit Readiness**: Create entries that are clear and defensible

TRANSACTION CONTEXT:
- Description: "${transactionContext.description}"
- Merchant: ${transactionContext.merchant || "Not provided"}
- Amount: $${Math.abs(transactionContext.amount).toFixed(2)}
- Date: ${transactionContext.date}
- Type: ${isExpense ? "Expense" : "Income"}
- Classification: ${isBusiness ? "Business" : "Personal"}`;

  // Add business-specific context
  if (isBusiness && businessContext) {
    prompt += `\n\nBUSINESS CONTEXT:
- Business Type: ${businessContext.businessType || "Not specified"}
- Entity Type: ${businessContext.businessEntityType || "Not specified"}
- Business Category: ${businessContext.businessCategory || "Not specified"}
- NAICS Code: ${businessContext.naicsCode || "Not specified"}
- Accounting Method: ${businessContext.accountingMethod || "cash"}`;

    // Add industry-specific guidance
    if (businessContext.businessType) {
      prompt += `\n\nINDUSTRY-SPECIFIC CONSIDERATIONS:`;
      
      switch (businessContext.businessType) {
        case "creator":
          prompt += `\n- Content creators often have equipment, software subscriptions, and home office expenses
- Consider Section 179 deductions for equipment
- Software subscriptions (Adobe, Canva, etc.) are typically deductible
- Home office deduction may apply if space is used exclusively for business`;
          break;
        case "tradesperson":
          prompt += `\n- Tradespeople often have vehicle expenses, tools, and materials
- Vehicle expenses can be tracked via mileage or actual expenses
- Tools and equipment may qualify for Section 179
- Materials are typically cost of goods sold (COGS)`;
          break;
        case "wellness":
          prompt += `\n- Wellness businesses may have certification costs, equipment, and facility expenses
- Continuing education and certifications are typically deductible
- Equipment (yoga mats, weights, etc.) may be depreciated or expensed
- Facility rent or home office may apply`;
          break;
        case "tutor":
          prompt += `\n- Tutors often have educational materials, software, and home office expenses
- Educational materials and software subscriptions are deductible
- Home office deduction may apply
- Travel to students' locations may be deductible`;
          break;
        case "real_estate":
          prompt += `\n- Real estate professionals have unique deduction opportunities
- Marketing and advertising expenses are significant
- Vehicle expenses for property visits
- Professional services (legal, accounting) are deductible
- Consider passive activity loss rules`;
          break;
        case "agency":
          prompt += `\n- Agencies typically have high software, marketing, and professional service costs
- Software subscriptions (project management, design tools) are deductible
- Marketing and advertising are significant expenses
- Professional services (legal, accounting) are deductible
- Consider client acquisition costs`;
          break;
      }
    }

    // Add entity type considerations
    if (businessContext.businessEntityType) {
      prompt += `\n\nENTITY TYPE CONSIDERATIONS:`;
      switch (businessContext.businessEntityType) {
        case "sole_proprietorship":
          prompt += `\n- Personal and business expenses must be clearly separated
- Schedule C deductions apply
- Self-employment tax considerations`;
          break;
        case "llc":
          prompt += `\n- Can be taxed as sole proprietorship, partnership, or corporation
- Maintain clear separation of business and personal expenses
- Consider pass-through taxation benefits`;
          break;
        case "s_corp":
          prompt += `\n- Salary vs. distributions must be properly categorized
- Reasonable compensation rules apply
- Fringe benefits may be deductible`;
          break;
        case "c_corp":
          prompt += `\n- Corporate tax structure applies
- Employee benefits are deductible
- Consider fringe benefit deductions`;
          break;
      }
    }
  } else if (!isBusiness) {
    prompt += `\n\nPERSONAL TRANSACTION GUIDANCE:
- Personal expenses are NOT tax-deductible
- Focus on accurate categorization for budgeting and tracking
- No business deduction considerations needed`;
  }

  // Add accounting method considerations
  if (businessContext?.accountingMethod === "accrual") {
    prompt += `\n\nACCRUAL METHOD CONSIDERATIONS:
- Record expenses when incurred, not when paid
- Record income when earned, not when received
- Accounts receivable and payable may be involved`;
  } else {
    prompt += `\n\nCASH METHOD CONSIDERATIONS:
- Record expenses when paid
- Record income when received
- Simpler for small businesses`;
  }

  prompt += `\n\nAVAILABLE ACCOUNTS:
${accounts.map(a => `- ${a.name} (${a.type})`).join('\n')}

ACCOUNTING BEST PRACTICES:
1. **Expense Categorization**:
   - Use specific, descriptive categories (avoid "Miscellaneous")
   - Match categories to tax deduction categories when possible
   - Consider IRS Schedule C categories for business expenses
   - Group similar expenses for easier tax preparation

2. **Double-Entry Rules**:
   - Expenses: Debit expense account, Credit cash/credit card
   - Income: Debit cash/bank, Credit income/revenue account
   - Always ensure debits = credits
   - Use appropriate account types (asset, liability, equity, income, expense)

3. **Tax Deduction Optimization**:
   - Business meals: 50% deductible (100% for certain events)
   - Home office: Must be exclusive use for business
   - Vehicle: Choose between standard mileage or actual expenses
   - Equipment: Consider Section 179 expensing vs. depreciation

4. **Category Selection Guidelines**:
   - Be specific: "Office Supplies" not "Supplies"
   - Use standard categories: "Meals & Entertainment", "Travel", "Software & Subscriptions"
   - Avoid generic categories unless truly necessary
   - Consider industry-specific categories when appropriate

YOUR TASK:
Analyze the transaction and provide:
1. The most appropriate expense/income category
2. The correct double-entry accounts (debit and credit)
3. A clear explanation of why these choices follow accounting best practices
4. Confidence level (0-1) based on how certain you are

Be specific, accurate, and consider tax implications.`;

  return prompt;
}

/**
 * Enhanced keyword matching fallback for category inference
 */
function inferCategoryFromKeywords(
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

/**
 * Use AI to infer the best category for a transaction
 */
export const inferCategoryWithAI = action({
  args: {
    description: v.string(),
    merchant: v.optional(v.string()),
    amount: v.number(),
    isBusiness: v.boolean(),
    businessContext: v.optional(v.object({
      businessType: v.optional(v.string()),
      businessCategory: v.optional(v.string()),
      naicsCode: v.optional(v.string()),
    })),
    userDescription: v.optional(v.string()), // User-provided description for context/corrections
  },
  handler: async (ctx, args) => {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      // Fallback to keyword matching
      return inferCategoryFromKeywords(args.description, args.merchant, args.isBusiness);
    }

    const systemPrompt = `You are an expert accountant categorizing transactions for ${args.isBusiness ? "business" : "personal"} use.

${args.isBusiness && args.businessContext ? `Business Context:
- Type: ${args.businessContext.businessType || "Not specified"}
- Category: ${args.businessContext.businessCategory || "Not specified"}
- NAICS: ${args.businessContext.naicsCode || "Not specified"}
` : ""}

Select the MOST SPECIFIC and APPROPRIATE category from these options:
${args.isBusiness ? `
BUSINESS CATEGORIES:
- Meals & Entertainment (50% deductible, 100% for certain events)
- Office Supplies
- Travel (transportation, lodging, meals while traveling)
- Software & Subscriptions
- Marketing & Advertising
- Professional Services (legal, accounting, consulting)
- Rent & Utilities
- Insurance
- Vehicle Expenses
- Equipment & Depreciation
- Cost of Goods Sold (COGS)
- Payroll & Benefits
- Taxes & Licenses
- Interest Expense
- Depreciation
- Other Business Expense` : `
PERSONAL CATEGORIES:
- Food & Dining
- Shopping
- Transportation
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Personal Care
- Travel
- Other Personal Expense`}

Return ONLY the category name, nothing else.`;

    const userPrompt = `Transaction:
Description: "${args.description}"
${args.merchant ? `Merchant: ${args.merchant}` : ""}
Amount: $${Math.abs(args.amount).toFixed(2)}
${args.userDescription ? `\nUser Context: "${args.userDescription}"` : ""}

${args.userDescription ? "Note: The user has provided additional context above. Please use this information to better categorize the transaction.\n\n" : ""}What is the most appropriate category?`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ez-financial.app",
          "X-Title": "EZ Financial",
        },
        body: JSON.stringify({
          model: "x-ai/grok-4.1-fast:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3, // Lower temperature for more consistent categorization
          max_tokens: 50,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const category = data.choices?.[0]?.message?.content?.trim();
        if (category) {
          // Check if category exists in default lists
          const businessCategories = [
            "Meals & Entertainment", "Office Supplies", "Travel", "Software & Subscriptions",
            "Marketing & Advertising", "Professional Services", "Rent & Utilities", "Insurance",
            "Vehicle Expenses", "Equipment & Depreciation", "Cost of Goods Sold (COGS)",
            "Payroll & Benefits", "Taxes & Licenses", "Interest Expense", "Depreciation", "Other Business Expense"
          ];
          const personalCategories = [
            "Food & Dining", "Shopping", "Transportation", "Entertainment", "Bills & Utilities",
            "Healthcare", "Education", "Personal Care", "Travel", "Other Personal Expense"
          ];
          const defaultCategories = args.isBusiness ? businessCategories : personalCategories;
          const isNewCategory = !defaultCategories.some(cat => 
            cat.toLowerCase() === category.toLowerCase() || 
            category.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(category.toLowerCase())
          );
          
          return { 
            category, 
            confidence: 0.85, 
            method: "ai",
            isNewCategory: isNewCategory || false
          };
        }
      }
    } catch (error) {
      console.warn("AI category inference failed, using fallback:", error);
    }

    // Fallback to keyword matching
    const keywordResult = inferCategoryFromKeywords(args.description, args.merchant, args.isBusiness);
    // Keyword matching always returns existing categories, so isNewCategory is false
    return { ...keywordResult, isNewCategory: false };
  },
});

/**
 * Generate AI suggestions for a transaction (can generate for both business and personal)
 * This is called from the modal when user clicks "Use AI"
 */
export const generateAISuggestions: ReturnType<typeof action> = action({
  args: {
    description: v.string(),
    amount: v.number(),
    date: v.string(),
    merchant: v.optional(v.string()),
    category: v.optional(v.string()),
    isBusiness: v.optional(v.boolean()), // null = generate both, true = business only, false = personal only
    overrideDebitAccountId: v.optional(v.string()), // Force a different debit account
    overrideCreditAccountId: v.optional(v.string()), // Force a different credit account
    userDescription: v.optional(v.string()), // User-provided description for context/corrections
  },
  handler: async (ctx, args) => {
    // Get org context for this action
    const orgContext = await ctx.runQuery(api.helpers.index.getOrgContextQuery, {});
    if (!orgContext.orgId) {
      throw new Error("No organization context available");
    }
    const orgId = orgContext.orgId;
    
    // Fetch business context
    const businessContext = await ctx.runQuery(api.ai_entries.getBusinessContext, { orgId });
    
    // Get user's accounts
    const accounts = await ctx.runQuery(api.accounts.getAll, { orgId });
    
    // Convert Convex accounts to accounting engine format
    const engineAccounts: Account[] = accounts.map((acc: any) => ({
      id: acc._id,
      name: acc.name,
      type: acc.type,
    }));

    const suggestions: Array<{
      isBusiness: boolean;
      category: string;
      debitAccountName: string;
      creditAccountName: string;
      debitAccountId: string;
      creditAccountId: string;
      amount: number;
      explanation: string;
      confidence: number;
    }> = [];

    // If isBusiness is not set, generate suggestions for both
    const contexts = args.isBusiness === undefined 
      ? [true, false] // Generate for both business and personal
      : [args.isBusiness]; // Generate for selected type only

    for (const isBusiness of contexts) {
      // Combine description with user description if provided
      const fullDescription = args.userDescription 
        ? `${args.description}. ${args.userDescription}`
        : args.description;

      const transactionContext: TransactionContext = {
        amount: args.amount,
        merchant: args.merchant || undefined,
        description: fullDescription,
        category: args.category ? [args.category] : undefined,
        date: args.date,
        isBusiness,
        userId: "", // Not needed for suggestion generation
      };

      // Debug logging to verify what the AI is receiving
      console.log("[AI Suggestions] Processing transaction:", {
        description: args.description,
        merchant: args.merchant,
        category: args.category,
        amount: args.amount,
        isBusiness,
      });

      // Infer category using AI or keywords
      let inferredCategory = args.category;
      if (!inferredCategory) {
        const categoryResult = await ctx.runAction(api.ai_entries.inferCategoryWithAI, {
          description: args.description,
          merchant: args.merchant,
          amount: args.amount,
          isBusiness,
          businessContext: businessContext ? {
            businessType: businessContext.businessType,
            businessCategory: businessContext.businessCategory,
            naicsCode: businessContext.naicsCode,
          } : undefined,
          userDescription: args.userDescription,
        });
        inferredCategory = categoryResult.category;
        const isNewCategory = (categoryResult as any).isNewCategory || false;
        console.log("[AI Suggestions] Inferred category:", inferredCategory, "method:", categoryResult.method, "isNewCategory:", isNewCategory);
        
        // Store isNewCategory flag for later use in suggestions
        (transactionContext as any).isNewCategory = isNewCategory;
      }
      
      // Update transaction context with inferred category
      if (inferredCategory) {
        transactionContext.category = [inferredCategory];
      }

      // Get suggestion from accounting engine with override support and business context
      const engineSuggestion = suggestEntry(
        transactionContext, 
        engineAccounts,
        args.overrideDebitAccountId,
        args.overrideCreditAccountId,
        businessContext ? {
          businessType: businessContext.businessType,
          businessEntityType: businessContext.businessEntityType,
          accountingMethod: businessContext.accountingMethod,
        } : null
      );
      
      console.log("[AI Suggestions] Engine suggestion:", {
        debitAccount: engineAccounts.find(a => a.id === engineSuggestion.debitAccountId)?.name,
        creditAccount: engineAccounts.find(a => a.id === engineSuggestion.creditAccountId)?.name,
        explanation: engineSuggestion.explanation,
      });

      // Find account names
      const debitAccount = engineAccounts.find(a => a.id === engineSuggestion.debitAccountId);
      const creditAccount = engineAccounts.find(a => a.id === engineSuggestion.creditAccountId);

      // Enhance explanation with AI if OpenRouter is configured
      let enhancedExplanation = engineSuggestion.explanation;
      let confidence = engineSuggestion.confidence;

      try {
        // Build comprehensive system prompt
        const systemPrompt = buildSystemPrompt(
          transactionContext,
          businessContext,
          engineAccounts
        );

        // Remove userId from transaction context for AI explanation (not in validator)
        const { userId, ...transactionForAI } = transactionContext;
        const aiExplanation = await ctx.runAction(api.ai_entries.generateExplanation, {
          entry: {
            debitAccountId: engineSuggestion.debitAccountId,
            creditAccountId: engineSuggestion.creditAccountId,
            amount: engineSuggestion.amount,
            memo: engineSuggestion.memo,
            explanation: engineSuggestion.explanation,
          },
          transaction: transactionForAI,
          accounts: engineAccounts,
          businessContext: businessContext ? {
            businessType: businessContext.businessType,
            businessEntityType: businessContext.businessEntityType,
            businessCategory: businessContext.businessCategory,
            naicsCode: businessContext.naicsCode,
            accountingMethod: businessContext.accountingMethod,
          } : undefined,
          systemPrompt: systemPrompt,
        });

        if (aiExplanation) {
          enhancedExplanation = aiExplanation;
          confidence = Math.min(1.0, confidence + 0.05);
        }
      } catch (error) {
        // Fallback to accounting engine explanation if AI fails
        console.warn("AI explanation generation failed, using engine explanation:", error);
      }

      // Use the inferred category (already set in transactionContext.category)
      // This was determined by AI or keyword matching earlier
      const suggestedCategory = inferredCategory || args.category || 
        (debitAccount?.type === 'expense' ? debitAccount.name : 
         creditAccount?.type === 'income' ? creditAccount.name : 
         isBusiness ? 'Business Expense' : 'Personal Expense');
      
      console.log("[AI Suggestions] Final category selected:", suggestedCategory);
      
      // Check if this is a new category (from transactionContext or inferred)
      const suggestionIsNewCategory = (transactionContext as any).isNewCategory || false;
      
      suggestions.push({
        isBusiness,
        category: suggestedCategory,
        debitAccountName: debitAccount?.name || "Unknown",
        creditAccountName: creditAccount?.name || "Unknown",
        debitAccountId: debitAccount?.id || "",
        creditAccountId: creditAccount?.id || "",
        amount: engineSuggestion.amount,
        explanation: enhancedExplanation,
        confidence,
        isNewCategory: suggestionIsNewCategory,
      } as any);
    }

    return { suggestions };
  },
});

/**
 * Suggest a double-entry for a transaction with AI explanation
 * Phase 1: Updated to use org context
 */
export const suggestDoubleEntry: ReturnType<typeof action> = action({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context
    const orgContext = await ctx.runQuery(api.helpers.index.getOrgContextQuery, {
      orgId: args.orgId,
    });
    if (!orgContext) {
      throw new Error("Organization context required");
    }

    const transaction = await ctx.runQuery(api.transactions.getById, {
      transactionId: args.transactionId,
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify transaction belongs to org
    if (transaction.orgId && transaction.orgId !== orgContext.orgId) {
      throw new Error("Transaction does not belong to this organization");
    }

    // Fetch business context
    const businessContext = await ctx.runQuery(api.ai_entries.getBusinessContext, {
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });
    
    // Get user's accounts - org-scoped
    const accounts = await ctx.runQuery(api.accounts.getAll, {
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });
    
    // Convert Convex accounts to accounting engine format
    const engineAccounts: Account[] = accounts.map((acc: any) => ({
      id: acc._id,
      name: acc.name,
      type: acc.type,
    }));

    // Build transaction context for accounting engine
    const transactionContext: TransactionContext = {
      amount: transaction.amount,
      merchant: transaction.merchant || undefined,
      description: transaction.description,
      category: transaction.category || undefined,
      plaidCategory: transaction.plaidCategory || undefined,
      date: transaction.date,
      isBusiness: (transaction as any).isBusiness ?? true, // Use transaction's isBusiness flag, default to business
      userId: transaction.userId,
    };

    // Infer category if not provided
    if (!transactionContext.category || transactionContext.category.length === 0) {
      const categoryResult = await ctx.runAction(api.ai_entries.inferCategoryWithAI, {
        description: transaction.description,
        merchant: transaction.merchant,
        amount: transaction.amount,
        isBusiness: transactionContext.isBusiness,
        businessContext: businessContext ? {
          businessType: businessContext.businessType,
          businessCategory: businessContext.businessCategory,
          naicsCode: businessContext.naicsCode,
        } : undefined,
      });
      transactionContext.category = [categoryResult.category];
    }

    // Get initial suggestion from accounting engine with business context
    const engineSuggestion = suggestEntry(
      transactionContext, 
      engineAccounts, 
      undefined, 
      undefined,
      businessContext ? {
        businessType: businessContext.businessType,
        businessEntityType: businessContext.businessEntityType,
        accountingMethod: businessContext.accountingMethod,
      } : null
    );

    // Enhance explanation with AI if OpenRouter is configured
    let enhancedExplanation = engineSuggestion.explanation;
    let confidence = engineSuggestion.confidence;

    try {
      // Build comprehensive system prompt
      const systemPrompt = buildSystemPrompt(
        transactionContext,
        businessContext,
        engineAccounts
      );

      const aiExplanation = await ctx.runAction(api.ai_entries.generateExplanation, {
        entry: {
          debitAccountId: engineSuggestion.debitAccountId,
          creditAccountId: engineSuggestion.creditAccountId,
          amount: engineSuggestion.amount,
          memo: engineSuggestion.memo,
          explanation: engineSuggestion.explanation,
        },
        transaction: transactionContext,
        accounts: engineAccounts,
        businessContext: businessContext ? {
          businessType: businessContext.businessType,
          businessEntityType: businessContext.businessEntityType,
          businessCategory: businessContext.businessCategory,
          naicsCode: businessContext.naicsCode,
          accountingMethod: businessContext.accountingMethod,
        } : undefined,
        systemPrompt: systemPrompt,
      });

      if (aiExplanation) {
        enhancedExplanation = aiExplanation;
        // Boost confidence slightly if AI provided explanation
        confidence = Math.min(1.0, confidence + 0.05);
      }
    } catch (error) {
      // Fallback to accounting engine explanation if AI fails
      console.warn("AI explanation generation failed, using engine explanation:", error);
    }

    // Note: Alternatives are fetched dynamically in ApprovalQueue when confidence < 0.7
    // This avoids storing them in the database and allows real-time fetching

    // Create proposed entry
    const proposedEntryId = await ctx.runMutation(api.ai_entries.createProposedEntry, {
      transactionId: args.transactionId,
      suggestion: {
        ...engineSuggestion,
        explanation: enhancedExplanation,
        confidence,
      },
    });

    return {
      proposedEntryId,
      suggestion: {
        ...engineSuggestion,
        explanation: enhancedExplanation,
        confidence,
      },
    };
  },
});

/**
 * Generate AI explanation for a double-entry using OpenRouter
 */
export const generateExplanation = action({
  args: {
    entry: v.object({
      debitAccountId: v.string(),
      creditAccountId: v.string(),
      amount: v.number(),
      memo: v.string(),
      explanation: v.string(),
    }),
    transaction: v.object({
      amount: v.number(),
      merchant: v.optional(v.string()),
      description: v.string(),
      category: v.optional(v.array(v.string())),
      date: v.string(),
      isBusiness: v.boolean(),
    }),
    accounts: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
    })),
    businessContext: v.optional(v.object({
      businessType: v.optional(v.string()),
      businessEntityType: v.optional(v.string()),
      businessCategory: v.optional(v.string()),
      naicsCode: v.optional(v.string()),
      accountingMethod: v.string(),
    })),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    if (!openRouterKey) {
      // No API key configured, skip AI explanation
      return null;
    }

    const debitAccount = args.accounts.find(a => a.id === args.entry.debitAccountId);
    const creditAccount = args.accounts.find(a => a.id === args.entry.creditAccountId);

    if (!debitAccount || !creditAccount) {
      return null;
    }

    // Use provided system prompt or build one
    const systemPrompt = args.systemPrompt || buildSystemPrompt(
      {
        amount: args.transaction.amount,
        merchant: args.transaction.merchant,
        description: args.transaction.description,
        category: args.transaction.category,
        date: args.transaction.date,
        isBusiness: args.transaction.isBusiness,
        userId: "",
      },
      args.businessContext || null,
      args.accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type as Account['type'],
      }))
    );

    // Build user prompt
    const userPrompt = `Transaction: ${args.transaction.description}
${args.transaction.merchant ? `Merchant: ${args.transaction.merchant}` : ''}
Amount: $${Math.abs(args.transaction.amount).toFixed(2)}
${args.transaction.category ? `Category: ${args.transaction.category.join(', ')}` : ''}
${args.transaction.isBusiness ? 'Type: Business' : 'Type: Personal'}

Double-Entry:
Debit: ${debitAccount.name} (${debitAccount.type})
Credit: ${creditAccount.name} (${creditAccount.type})
Amount: $${args.entry.amount.toFixed(2)}

Provide a clear, friendly explanation starting with "I chose this because..." that:
1. Explains why this entry follows accounting best practices
2. Mentions any tax implications if applicable
3. Helps a non-accountant understand the reasoning
4. Is specific to this transaction and business context

Keep it under 3 sentences.`;

    try {
      // Try primary model first
      const models = [
        "x-ai/grok-4.1-fast:free",
        "z-ai/glm-4.5-air:free",
        "openai/gpt-oss-20b:free",
      ];

      let lastError: Error | null = null;

      for (const model of models) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ez-financial.app",
              "X-Title": "EZ Financial",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 200, // Increased for more detailed explanations
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          const explanation = data.choices?.[0]?.message?.content?.trim();

          if (explanation) {
            return explanation;
          }
        } catch (error: any) {
          lastError = error;
          console.warn(`Failed to get explanation from ${model}:`, error);
          // Try next model
          continue;
        }
      }

      // All models failed
      if (lastError) {
        throw lastError;
      }

      return null;
    } catch (error) {
      console.error("Failed to generate AI explanation:", error);
      return null;
    }
  },
});

/**
 * Create a proposed entry from a suggestion
 * Phase 1: Updated to use org context
 */
export const createProposedEntry = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
    suggestion: v.object({
      debitAccountId: v.string(),
      creditAccountId: v.string(),
      amount: v.number(),
      memo: v.string(),
      confidence: v.number(),
      explanation: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.EDIT_TRANSACTIONS);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify transaction belongs to org
    if (transaction.orgId && transaction.orgId !== orgId) {
      throw new Error("Transaction does not belong to this organization");
    }

    // Convert string IDs to Convex IDs
    const debitAccountId = args.suggestion.debitAccountId as any;
    const creditAccountId = args.suggestion.creditAccountId as any;

    // Check if entry already exists for this transaction - org-scoped
    const existing = await ctx.db
      .query("entries_proposed")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", orgId).eq("status", "pending")
      )
      .filter((q: any) => q.eq(q.field("transactionId"), args.transactionId))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        debitAccountId,
        creditAccountId,
        amount: args.suggestion.amount,
        memo: args.suggestion.memo,
        confidence: args.suggestion.confidence,
        explanation: args.suggestion.explanation,
        source: "ai_model",
      });
      return existing._id;
    }

    // Create new proposed entry
    const proposedEntryId = await ctx.db.insert("entries_proposed", {
      userId: userId, // Keep for backward compatibility
      orgId: orgId, // Phase 1: Add orgId
      transactionId: args.transactionId,
      date: new Date(transaction.date).getTime(),
      memo: args.suggestion.memo,
      debitAccountId,
      creditAccountId,
      amount: args.suggestion.amount,
      currency: transaction.currency,
      confidence: args.suggestion.confidence,
      source: "ai_model",
      explanation: args.suggestion.explanation,
      isBusiness: (transaction as any).isBusiness ?? true, // Default to business, can be refined by user
      status: "pending",
      createdAt: Date.now(),
    });

    return proposedEntryId;
  },
});

/**
 * Get comprehensive business context for AI decision-making
 * Phase 1: Updated to use org context
 */
export const getBusinessContext = query({
  args: {
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    // Get user for preferences
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get business profile - org-scoped
    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    // Type assertion for user (TypeScript sometimes infers wrong union type)
    const userData = user as any;
    
    return {
      businessType: userData.businessType || undefined, // creator, tradesperson, wellness, etc. (optional field)
      businessEntityType: userData.preferences?.businessEntityType, // llc, s_corp, etc.
      businessCategory: businessProfile?.businessCategory,
      naicsCode: businessProfile?.naicsCode,
      entityType: businessProfile?.entityType,
      businessDescription: businessProfile?.businessDescription,
      accountingMethod: userData.preferences?.accountingMethod || "cash", // cash or accrual
    };
  },
});

/**
 * Get alternative suggestions for a transaction (when confidence is low)
 * Phase 1: Updated to use org context
 */
export const getAlternativeSuggestions = action({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context
    const orgContext = await ctx.runQuery(api.helpers.index.getOrgContextQuery, {
      orgId: args.orgId,
    });
    if (!orgContext) {
      throw new Error("Organization context required");
    }
    const transaction = await ctx.runQuery(api.transactions.getById, {
      transactionId: args.transactionId,
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify transaction belongs to org
    if (transaction.orgId && transaction.orgId !== orgContext.orgId) {
      throw new Error("Transaction does not belong to this organization");
    }

    // Fetch business context
    const businessContext = await ctx.runQuery(api.ai_entries.getBusinessContext, {
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });

    // Get user's accounts - org-scoped
    const accounts = await ctx.runQuery(api.accounts.getAll, {
      orgId: orgContext.orgId, // Phase 1: Pass orgId
    });
    const engineAccounts: Account[] = accounts.map((acc: any) => ({
      id: acc._id,
      name: acc.name,
      type: acc.type,
    }));

    const transactionContext: TransactionContext = {
      amount: transaction.amount,
      merchant: transaction.merchant || undefined,
      description: transaction.description,
      category: transaction.category || undefined,
      plaidCategory: transaction.plaidCategory || undefined,
      date: transaction.date,
      isBusiness: (transaction as any).isBusiness ?? true, // Use transaction's isBusiness flag
      userId: transaction.userId,
    };

    // Get primary suggestion with business context
    const primary = suggestEntry(
      transactionContext, 
      engineAccounts, 
      undefined, 
      undefined,
      businessContext ? {
        businessType: businessContext.businessType,
        businessEntityType: businessContext.businessEntityType,
        accountingMethod: businessContext.accountingMethod,
      } : null
    );

    // Generate alternatives by trying different account combinations
    const alternatives: EntrySuggestion[] = [];
    const isExpense = transaction.amount < 0;
    const isIncome = transaction.amount > 0;

    if (isExpense) {
      // Try different expense accounts
      const expenseAccounts = engineAccounts.filter(a => a.type === "expense");
      const bankAccount = engineAccounts.find(a => a.type === "asset");

      if (bankAccount) {
        for (const expenseAccount of expenseAccounts.slice(0, 3)) {
          if (expenseAccount.id !== primary.debitAccountId) {
            alternatives.push({
              debitAccountId: expenseAccount.id,
              creditAccountId: bankAccount.id,
              amount: primary.amount,
              memo: primary.memo,
              confidence: 0.60, // Lower confidence for alternatives
              explanation: `Alternative: ${expenseAccount.name} expense`,
            });
          }
        }
      }
    } else if (isIncome) {
      // Try different income accounts
      const incomeAccounts = engineAccounts.filter(a => a.type === "income");
      const bankAccount = engineAccounts.find(a => a.type === "asset");

      if (bankAccount) {
        for (const incomeAccount of incomeAccounts.slice(0, 3)) {
          if (incomeAccount.id !== primary.creditAccountId) {
            alternatives.push({
              debitAccountId: bankAccount.id,
              creditAccountId: incomeAccount.id,
              amount: primary.amount,
              memo: primary.memo,
              confidence: 0.60,
              explanation: `Alternative: ${incomeAccount.name} income`,
            });
          }
        }
      }
    }

    return {
      primary,
      alternatives: alternatives.slice(0, 2), // Return top 2 alternatives
    };
  },
});
