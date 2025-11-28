/**
 * Transaction processing and approval flows
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Get pending transactions that need approval
 */
export const getPendingTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get proposed entries waiting for approval
    const proposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .order("desc")
      .take(50);

    // Enrich with transaction and account details
    const enriched = await Promise.all(
      proposedEntries.map(async (entry) => {
        const transaction = entry.transactionId
          ? await ctx.db.get(entry.transactionId)
          : null;

        const debitAccount = await ctx.db.get(entry.debitAccountId);
        const creditAccount = await ctx.db.get(entry.creditAccountId);

        return {
          ...entry,
          transaction,
          debitAccount: debitAccount ? { name: debitAccount.name, type: debitAccount.type } : null,
          creditAccount: creditAccount ? { name: creditAccount.name, type: creditAccount.type } : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Approve a proposed entry
 */
export const approveEntry = mutation({
  args: {
    entryId: v.id("entries_proposed"),
    edits: v.optional(
      v.object({
        debitAccountId: v.optional(v.id("accounts")),
        creditAccountId: v.optional(v.id("accounts")),
        memo: v.optional(v.string()),
        isBusiness: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const proposedEntry = await ctx.db.get(args.entryId);
    if (!proposedEntry || proposedEntry.userId !== user._id) {
      throw new Error("Entry not found or unauthorized");
    }

    // Apply edits if provided
    const finalEntry = {
      ...proposedEntry,
      ...(args.edits || {}),
    };

    // Create final entry
    const entryId = await ctx.db.insert("entries_final", {
      userId: user._id,
      date: finalEntry.date,
      memo: finalEntry.memo,
      source: "plaid", // Could be derived from proposedEntry.source
      status: "posted",
      createdAt: Date.now(),
      approvedAt: Date.now(),
      approvedBy: user._id,
    });

    // Create entry lines (debit and credit)
    await ctx.db.insert("entry_lines", {
      entryId,
      accountId: finalEntry.debitAccountId,
      side: "debit",
      amount: finalEntry.amount,
      currency: finalEntry.currency,
    });

    await ctx.db.insert("entry_lines", {
      entryId,
      accountId: finalEntry.creditAccountId,
      side: "credit",
      amount: finalEntry.amount,
      currency: finalEntry.currency,
    });

    // Mark proposed entry as approved
    await ctx.db.patch(args.entryId, {
      status: "approved",
    });

    return { entryId, success: true };
  },
});

/**
 * Reject a proposed entry (user will need to manually categorize)
 */
export const rejectEntry = mutation({
  args: {
    entryId: v.id("entries_proposed"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const proposedEntry = await ctx.db.get(args.entryId);
    if (!proposedEntry || proposedEntry.userId !== user._id) {
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.patch(args.entryId, {
      status: "rejected",
    });

    return { success: true };
  },
});

/**
 * Process a new transaction and generate proposed entry
 * This is called when Plaid syncs new transactions
 */
export const processTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const user = await ctx.db.get(transaction.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", transaction.userId))
      .collect();

    // Simple suggestion logic (in production, use accounting engine package)
    const isExpense = transaction.amount < 0;
    const isIncome = transaction.amount > 0;
    
    // Find default accounts
    const bankAccount = accounts.find(a => a.type === "asset") || accounts[0];
    const expenseAccount = accounts.find(a => a.type === "expense") || accounts[0];
    const incomeAccount = accounts.find(a => a.type === "income") || accounts[0];

    if (!bankAccount) {
      throw new Error("No bank account found");
    }

    // Generate simple suggestion
    const suggestion = isIncome
      ? {
          debitAccountId: bankAccount._id,
          creditAccountId: incomeAccount._id,
          amount: Math.abs(transaction.amount),
          confidence: 0.75,
          explanation: `Income transaction: ${transaction.description}`,
        }
      : {
          debitAccountId: expenseAccount._id,
          creditAccountId: bankAccount._id,
          amount: Math.abs(transaction.amount),
          confidence: 0.70,
          explanation: `Expense: ${transaction.merchant || transaction.description}`,
        };

    // Create proposed entry
    const proposedEntryId = await ctx.db.insert("entries_proposed", {
      userId: transaction.userId,
      transactionId: transaction._id,
      date: new Date(transaction.date).getTime(),
      memo: transaction.description,
      debitAccountId: suggestion.debitAccountId,
      creditAccountId: suggestion.creditAccountId,
      amount: suggestion.amount,
      currency: transaction.currency,
      confidence: suggestion.confidence,
      source: "plaid_rules",
      explanation: suggestion.explanation,
      isBusiness: true, // Default, can be refined
      status: "pending",
      createdAt: Date.now(),
    });

    return { proposedEntryId };
  },
});

/**
 * Create a raw transaction (from Plaid sync or manual entry)
 */
export const createRaw = mutation({
  args: {
    accountId: v.id("accounts"),
    plaidTransactionId: v.optional(v.string()),
    amount: v.number(),
    date: v.string(),
    merchant: v.optional(v.string()),
    description: v.string(),
    category: v.optional(v.array(v.string())),
    isPending: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found or unauthorized");
    }

    const transactionId = await ctx.db.insert("transactions_raw", {
      userId: user._id,
      accountId: args.accountId,
      plaidTransactionId: args.plaidTransactionId,
      amount: args.amount,
      currency: "USD", // Default, could be from account
      date: args.date,
      merchant: args.merchant,
      description: args.description,
      category: args.category,
      isPending: args.isPending,
      source: args.plaidTransactionId ? "plaid" : "manual",
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Get transaction by Plaid ID
 */
export const getByPlaidId = query({
  args: {
    plaidTransactionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions_raw")
      .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", args.plaidTransactionId))
      .first();
  },
});
