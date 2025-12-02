/**
 * OpenRouter API integration for AI-powered category inference and explanations
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { inferCategoryFromKeywords } from "./helpers";
import { buildSystemPrompt } from "./prompts";
import { Account } from "./types";

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

