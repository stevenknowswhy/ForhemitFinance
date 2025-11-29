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
 * Process a new transaction and generate proposed entry using AI system
 * This is called when Plaid syncs new transactions or manual entries
 * Uses the full AI system with accounting engine + OpenRouter LLM
 */
export const processTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
  },
  handler: async (ctx, args) => {
    // Schedule the AI suggestion to run as an action
    // This allows us to use the full AI system (actions can call external APIs)
    await ctx.scheduler.runAfter(0, api.ai_entries.suggestDoubleEntry, {
      transactionId: args.transactionId,
    });

    // Return immediately - the AI system will create the proposed entry asynchronously
    return { success: true, message: "AI suggestion generation started" };
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
    isBusiness: v.optional(v.boolean()),
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

    const transactionData: any = {
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
    };

    // Only include isBusiness if it's explicitly set (not undefined)
    if (args.isBusiness !== undefined) {
      transactionData.isBusiness = args.isBusiness;
    }

    const transactionId = await ctx.db.insert("transactions_raw", transactionData);

    return transactionId;
  },
});

/**
 * Create a receipt from UploadThing upload
 */
export const createReceipt = mutation({
  args: {
    userId: v.id("users"),
    transactionId: v.optional(v.id("transactions_raw")),
    fileUrl: v.string(),
    fileKey: v.string(),
    originalFilename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    // Legacy support
    storageUrl: v.optional(v.string()),
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

    if (!user || user._id !== args.userId) {
      throw new Error("User not found or unauthorized");
    }

    const now = Date.now();

    // Create receipt doc with enhanced metadata
    const receiptId = await ctx.db.insert("receipts", {
      userId: args.userId,
      transactionId: args.transactionId,
      fileUrl: args.fileUrl,
      fileKey: args.fileKey,
      originalFilename: args.originalFilename,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      // Legacy field for backward compatibility
      storageUrl: args.storageUrl || args.fileUrl,
      uploadedAt: now,
    });

    // Bidirectional linking: If transaction ID is provided, update the transaction
    if (args.transactionId) {
      const transaction = await ctx.db.get(args.transactionId);
      if (transaction && transaction.userId === args.userId) {
        const existingReceiptIds = transaction.receiptIds ?? [];
        
        // Update transaction with receiptIds array and legacy receiptUrl
        await ctx.db.patch(args.transactionId, {
          receiptIds: [...existingReceiptIds, receiptId],
          receiptUrl: args.fileUrl, // Keep for backward compatibility
        });
      }
    }

    return receiptId;
  },
});

/**
 * Get receipts for a transaction
 */
export const getReceiptsByTransaction = query({
  args: {
    transactionId: v.id("transactions_raw"),
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

    // Verify transaction belongs to user
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== user._id) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Get all receipts for this transaction using the new index
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    return receipts;
  },
});

/**
 * Get all receipts for the current user
 */
export const getUserReceipts = query({
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

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return receipts;
  },
});

/**
 * Get transaction by ID
 */
export const getById = query({
  args: {
    transactionId: v.id("transactions_raw"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transactionId);
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

/**
 * Update a transaction
 */
export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    merchant: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.array(v.string())),
    isBusiness: v.optional(v.boolean()),
    isPending: v.optional(v.boolean()),
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

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== user._id) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.date !== undefined) updateData.date = args.date;
    if (args.merchant !== undefined) updateData.merchant = args.merchant;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.isBusiness !== undefined) updateData.isBusiness = args.isBusiness;
    if (args.isPending !== undefined) updateData.isPending = args.isPending;

    await ctx.db.patch(args.transactionId, updateData);

    // If transaction was updated, regenerate AI suggestion if needed
    if (args.description || args.category || args.merchant || args.isBusiness !== undefined) {
      // Schedule AI suggestion regeneration
      await ctx.scheduler.runAfter(0, api.ai_entries.suggestDoubleEntry, {
        transactionId: args.transactionId,
      });
    }

    return { success: true };
  },
});

/**
 * Delete a transaction
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
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

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== user._id) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Delete any associated proposed entries
    const proposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    for (const entry of proposedEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete the transaction
    await ctx.db.delete(args.transactionId);

    return { success: true };
  },
});

/**
 * Find similar transactions by merchant/description
 * Used for auto-populating fields based on previous transactions
 */
export const findSimilarTransactions = query({
  args: {
    merchant: v.optional(v.string()),
    description: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return [];
    }

    // Get all user transactions
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Find similar transactions
    const similar: Array<{
      transaction: any;
      matchScore: number;
    }> = [];

    const searchMerchant = (args.merchant || "").toLowerCase().trim();
    const searchDescription = (args.description || "").toLowerCase().trim();

    for (const tx of allTransactions) {
      let matchScore = 0;

      // Exact merchant match
      if (searchMerchant && tx.merchant) {
        const txMerchant = tx.merchant.toLowerCase().trim();
        if (txMerchant === searchMerchant) {
          matchScore += 10;
        } else if (txMerchant.includes(searchMerchant) || searchMerchant.includes(txMerchant)) {
          matchScore += 5;
        }
      }

      // Description match
      if (searchDescription && tx.description) {
        const txDescription = tx.description.toLowerCase().trim();
        if (txDescription === searchDescription) {
          matchScore += 10;
        } else if (txDescription.includes(searchDescription) || searchDescription.includes(txDescription)) {
          matchScore += 5;
        }
      }

      // Merchant name match (for mock transactions)
      if (searchMerchant && tx.merchantName) {
        const txMerchantName = tx.merchantName.toLowerCase().trim();
        if (txMerchantName === searchMerchant) {
          matchScore += 10;
        } else if (txMerchantName.includes(searchMerchant) || searchMerchant.includes(txMerchantName)) {
          matchScore += 5;
        }
      }

      if (matchScore > 0) {
        similar.push({ transaction: tx, matchScore });
      }
    }

    // Sort by match score (highest first) and recency
    similar.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const dateA = a.transaction.dateTimestamp || new Date(a.transaction.date).getTime();
      const dateB = b.transaction.dateTimestamp || new Date(b.transaction.date).getTime();
      return dateB - dateA;
    });

    // Return most recent similar transaction (highest match score)
    const limit = args.limit || 1;
    return similar.slice(0, limit).map((item) => item.transaction);
  },
});
