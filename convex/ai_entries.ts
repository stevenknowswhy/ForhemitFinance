/**
 * AI-powered double-entry preview and explanation system
 * Integrates accounting engine with OpenRouter LLM for plain-language explanations
 */

import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

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
}

/**
 * Inline accounting engine logic (since workspace packages aren't available in Convex)
 */
function suggestEntry(
  transaction: TransactionContext,
  accounts: Account[],
  overrideDebitAccountId?: string,
  overrideCreditAccountId?: string
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
    // First, try to find account by category
    expenseAccount = findAccountByCategory(
      accounts,
      'expense',
      transaction.category || transaction.plaidCategory || []
    );

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
  },
  handler: async (ctx, args) => {
    // Get user's accounts
    const accounts = await ctx.runQuery(api.accounts.getAll);
    
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
      const transactionContext: TransactionContext = {
        amount: args.amount,
        merchant: args.merchant || undefined,
        description: args.description,
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

      // FIRST: Infer category from description (before selecting accounts)
      // This ensures the expense account matches the category
      let inferredCategory = args.category;
      if (!inferredCategory) {
        const desc = args.description.toLowerCase();
        const merchant = (args.merchant || "").toLowerCase();
        const combined = `${desc} ${merchant}`;
        
        // Check for food/meals FIRST
        if (desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || 
            desc.includes('meal') || desc.includes('food') || desc.includes('restaurant') || 
            desc.includes('coffee') || desc.includes('starbucks') || desc.includes('dining') ||
            desc.includes('cafe') || desc.includes('bar') || desc.includes('pizza') ||
            desc.includes('eat') || desc.includes('drink') || desc.includes('beverage')) {
          inferredCategory = 'Meals & Entertainment';
        } else if (combined.includes('office') || combined.includes('supplies') || combined.includes('stationery')) {
          inferredCategory = 'Office Supplies';
        } else if (combined.includes('travel') || combined.includes('hotel') || combined.includes('flight')) {
          inferredCategory = 'Travel';
        } else if (combined.includes('software') || combined.includes('saas') || combined.includes('subscription')) {
          inferredCategory = 'Software & Subscriptions';
        }
      }
      
      // Update transaction context with inferred category
      if (inferredCategory) {
        transactionContext.category = [inferredCategory];
        console.log("[AI Suggestions] Inferred category for account matching:", inferredCategory);
      }

      // Get suggestion from accounting engine with override support
      const engineSuggestion = suggestEntry(
        transactionContext, 
        engineAccounts,
        args.overrideDebitAccountId,
        args.overrideCreditAccountId
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
        });

        if (aiExplanation) {
          enhancedExplanation = aiExplanation;
          confidence = Math.min(1.0, confidence + 0.05);
        }
      } catch (error) {
        // Fallback to accounting engine explanation if AI fails
        console.warn("AI explanation generation failed, using engine explanation:", error);
      }

      // Determine suggested category - avoid "Uncategorized" using best practices
      let suggestedCategory = args.category;
      
      // Debug logging for category inference
      console.log("[AI Suggestions] Category inference:", {
        providedCategory: args.category,
        debitAccountName: debitAccount?.name,
        debitAccountType: debitAccount?.type,
        description: args.description,
        merchant: args.merchant,
      });
      
      if (!suggestedCategory) {
        if (debitAccount?.type === 'expense') {
          const accountName = debitAccount.name;
          
          // ALWAYS infer category from description FIRST (user's title is most accurate)
          // This ensures we use what the user typed, not just the account name
          const desc = args.description.toLowerCase();
          const merchant = (args.merchant || "").toLowerCase();
          const combined = `${desc} ${merchant}`;
          
          console.log("[AI Suggestions] Inferring category from:", { desc, merchant, combined, accountName });
          
          // Check for food/meals FIRST (most common) - check description FIRST
          if (desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || 
              desc.includes('meal') || desc.includes('food') || desc.includes('restaurant') || 
              desc.includes('coffee') || desc.includes('starbucks') || desc.includes('dining') ||
              desc.includes('cafe') || desc.includes('bar') || desc.includes('pizza') ||
              desc.includes('eat') || desc.includes('drink') || desc.includes('beverage')) {
            suggestedCategory = 'Meals & Entertainment';
            console.log("[AI Suggestions] ✅ Matched: Meals & Entertainment (from description keyword)");
          } else if (combined.includes('food') || combined.includes('restaurant') || combined.includes('coffee') || 
              combined.includes('starbucks') || combined.includes('dining') || combined.includes('dinner') ||
              combined.includes('lunch') || combined.includes('breakfast') || combined.includes('meal')) {
            suggestedCategory = 'Meals & Entertainment';
            console.log("[AI Suggestions] ✅ Matched: Meals & Entertainment (from combined)");
          } else if (combined.includes('office') || combined.includes('supplies') || combined.includes('stationery')) {
            suggestedCategory = 'Office Supplies';
            console.log("[AI Suggestions] ✅ Matched: Office Supplies");
          } else if (combined.includes('travel') || combined.includes('hotel') || combined.includes('flight') || combined.includes('uber') || combined.includes('lyft')) {
            suggestedCategory = 'Travel';
            console.log("[AI Suggestions] ✅ Matched: Travel");
          } else if (combined.includes('software') || combined.includes('saas') || combined.includes('subscription') || combined.includes('app')) {
            suggestedCategory = 'Software & Subscriptions';
            console.log("[AI Suggestions] ✅ Matched: Software & Subscriptions");
          } else if (combined.includes('utilities') || combined.includes('electric') || combined.includes('water') || combined.includes('gas') || combined.includes('internet')) {
            suggestedCategory = 'Utilities';
            console.log("[AI Suggestions] ✅ Matched: Utilities");
          } else if (combined.includes('marketing') || combined.includes('advertising') || combined.includes('promotion')) {
            suggestedCategory = 'Marketing & Advertising';
            console.log("[AI Suggestions] ✅ Matched: Marketing & Advertising");
          } else if (combined.includes('rent') || combined.includes('lease')) {
            suggestedCategory = 'Rent';
            console.log("[AI Suggestions] ✅ Matched: Rent");
          } else if (combined.includes('insurance')) {
            suggestedCategory = 'Insurance';
            console.log("[AI Suggestions] ✅ Matched: Insurance");
          } else if (combined.includes('legal') || combined.includes('attorney') || combined.includes('lawyer')) {
            suggestedCategory = 'Legal & Professional Services';
            console.log("[AI Suggestions] ✅ Matched: Legal & Professional Services");
          } else if (combined.includes('accounting') || combined.includes('bookkeeping') || combined.includes('cpa')) {
            suggestedCategory = 'Accounting & Bookkeeping';
            console.log("[AI Suggestions] ✅ Matched: Accounting & Bookkeeping");
          }
          
          // If we couldn't infer from description, fall back to account name or merchant
          if (!suggestedCategory) {
            // NEVER use uncategorized - always infer a better category
            if (accountName.toLowerCase().includes('uncategorized') || 
                accountName.toLowerCase().includes('miscellaneous') ||
                accountName.toLowerCase().includes('other')) {
              // Use merchant name if available, otherwise use descriptive category
              if (args.merchant && args.merchant.length > 0) {
                suggestedCategory = args.merchant;
                console.log("[AI Suggestions] ✅ Using merchant name:", args.merchant);
              } else {
                suggestedCategory = isBusiness ? 'Business Expense' : 'Personal Expense';
                console.log("[AI Suggestions] ✅ Using fallback category:", suggestedCategory);
              }
            } else {
              // Account name is good, use it
              suggestedCategory = accountName;
              console.log("[AI Suggestions] ✅ Using account name:", accountName);
            }
          }
        } else if (creditAccount?.type === 'income') {
          // For income, use account name or infer
          suggestedCategory = creditAccount.name || 'Revenue';
          console.log("[AI Suggestions] ✅ Income category:", suggestedCategory);
        } else {
          suggestedCategory = isBusiness ? 'Business Expense' : 'Personal Expense';
          console.log("[AI Suggestions] ✅ Fallback category:", suggestedCategory);
        }
      }

      console.log("[AI Suggestions] Final category selected:", suggestedCategory);
      
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
      });
    }

    return { suggestions };
  },
});

/**
 * Suggest a double-entry for a transaction with AI explanation
 */
export const suggestDoubleEntry: ReturnType<typeof action> = action({
  args: {
    transactionId: v.id("transactions_raw"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.runQuery(api.transactions.getById, {
      transactionId: args.transactionId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Get user's accounts
    const accounts = await ctx.runQuery(api.accounts.getAll);
    
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

    // Get initial suggestion from accounting engine
    const engineSuggestion = suggestEntry(transactionContext, engineAccounts, undefined, undefined);

    // Enhance explanation with AI if OpenRouter is configured
    let enhancedExplanation = engineSuggestion.explanation;
    let confidence = engineSuggestion.confidence;

    try {
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

    // Build prompt for OpenRouter
    const prompt = `Explain why this double-entry accounting entry is correct in plain, friendly language. Use "I chose this because..." format.

Transaction: ${args.transaction.description}
${args.transaction.merchant ? `Merchant: ${args.transaction.merchant}` : ''}
Amount: $${Math.abs(args.transaction.amount).toFixed(2)}
${args.transaction.category ? `Category: ${args.transaction.category.join(', ')}` : ''}
${args.transaction.isBusiness ? 'Type: Business' : 'Type: Personal'}

Double-Entry:
Debit: ${debitAccount.name} (${debitAccount.type})
Credit: ${creditAccount.name} (${creditAccount.type})
Amount: $${args.entry.amount.toFixed(2)}

Current explanation: ${args.entry.explanation}

Provide a clear, friendly explanation starting with "I chose this because..." that helps a non-accountant understand why this entry makes sense. Keep it under 2 sentences.`;

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
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 150,
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
 */
export const createProposedEntry = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
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
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Convert string IDs to Convex IDs
    const debitAccountId = args.suggestion.debitAccountId as any;
    const creditAccountId = args.suggestion.creditAccountId as any;

    // Check if entry already exists for this transaction
    const existing = await ctx.db
      .query("entries_proposed")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", transaction.userId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("transactionId"), args.transactionId))
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
      userId: transaction.userId,
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
 * Get alternative suggestions for a transaction (when confidence is low)
 */
export const getAlternativeSuggestions = action({
  args: {
    transactionId: v.id("transactions_raw"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.runQuery(api.transactions.getById, {
      transactionId: args.transactionId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const accounts = await ctx.runQuery(api.accounts.getAll);
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

    // Get primary suggestion
    const primary = suggestEntry(transactionContext, engineAccounts, undefined, undefined);

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
