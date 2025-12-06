/**
 * Actions for AI-powered double-entry accounting
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { suggestEntry } from "./helpers";
import { buildSystemPrompt } from "./prompts";
import { Account, EntrySuggestion, TransactionContext } from "./types";

/**
 * Generate AI suggestions for a transaction (can generate for both business and personal)
 * This is called from the modal when user clicks "Use AI"
 */
export const generateAISuggestions = action({
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
export const suggestDoubleEntry = action({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args): Promise<{ proposedEntryId: Id<"entries_proposed">; suggestion: EntrySuggestion }> => {
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

