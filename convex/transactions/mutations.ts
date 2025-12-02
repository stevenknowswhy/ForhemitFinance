/**
 * Transaction mutation functions
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { api } from "../_generated/api";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";

/**
 * Approve a proposed entry
 * Phase 1: Updated to use org context
 */
export const approveEntry = mutation({
  args: {
    entryId: v.id("entries_proposed"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
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
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.APPROVE_ENTRIES);

    const proposedEntry = await ctx.db.get(args.entryId);
    if (!proposedEntry) {
      throw new Error("Entry not found");
    }

    // Verify entry belongs to org
    if (proposedEntry.orgId && proposedEntry.orgId !== orgId) {
      throw new Error("Entry does not belong to this organization");
    }

    // Apply edits if provided
    const finalEntry = {
      ...proposedEntry,
      ...(args.edits || {}),
    };

    // Create final entry
    const entryId = await ctx.db.insert("entries_final", {
      userId: userId, // Keep for backward compatibility
      orgId: orgId, // Phase 1: Add orgId
      date: finalEntry.date,
      memo: finalEntry.memo,
      source: "plaid", // Could be derived from proposedEntry.source
      status: "posted",
      createdAt: Date.now(),
      approvedAt: Date.now(),
      approvedBy: userId,
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
 * Phase 1: Updated to use org context
 */
export const rejectEntry = mutation({
  args: {
    entryId: v.id("entries_proposed"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.APPROVE_ENTRIES);

    const proposedEntry = await ctx.db.get(args.entryId);
    if (!proposedEntry) {
      throw new Error("Entry not found");
    }

    // Verify entry belongs to org
    if (proposedEntry.orgId && proposedEntry.orgId !== orgId) {
      throw new Error("Entry does not belong to this organization");
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
 * Phase 1: Updated to use org context
 */
export const processTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.EDIT_TRANSACTIONS);

    // Verify transaction belongs to org
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    if (transaction.orgId && transaction.orgId !== orgId) {
      throw new Error("Transaction does not belong to this organization");
    }

    // Schedule the AI suggestion to run as an action
    // This allows us to use the full AI system (actions can call external APIs)
    await ctx.scheduler.runAfter(0, api.ai_entries.suggestDoubleEntry, {
      transactionId: args.transactionId,
      orgId: orgId, // Phase 1: Pass orgId
    });

    // Return immediately - the AI system will create the proposed entry asynchronously
    return { success: true, message: "AI suggestion generation started" };
  },
});

/**
 * Create a raw transaction (from Plaid sync or manual entry)
 * Phase 1: Updated to use org context
 */
export const createRaw = mutation({
  args: {
    accountId: v.id("accounts"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
    plaidTransactionId: v.optional(v.string()),
    amount: v.number(),
    date: v.string(),
    merchant: v.optional(v.string()),
    description: v.string(),
    category: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("posted"),
      v.literal("cleared"),
      v.literal("reconciled")
    )),
    isBusiness: v.optional(v.boolean()),
    entryMode: v.optional(v.union(
      v.literal("simple"),
      v.literal("advanced")
    )),
    debitAccountId: v.optional(v.id("accounts")),
    creditAccountId: v.optional(v.id("accounts")),
    lineItems: v.optional(v.array(v.object({
      description: v.string(),
      category: v.optional(v.string()),
      amount: v.number(),
      tax: v.optional(v.number()),
      tip: v.optional(v.number()),
      debitAccountId: v.optional(v.id("accounts")),
      creditAccountId: v.optional(v.id("accounts")),
    }))),
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.EDIT_TRANSACTIONS);

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify account belongs to org
    if (account.orgId && account.orgId !== orgId) {
      throw new Error("Account does not belong to this organization");
    }

    // Parse date string (YYYY-MM-DD) to create timestamp at UTC midnight
    // This provides consistent sorting/filtering while preserving the date string
    const dateTimestamp = new Date(args.date + "T00:00:00Z").getTime();

    // Default status to "pending" if not provided, or use provided status
    const status = args.status || "pending";
    const now = Date.now();

    const transactionData: any = {
      userId: userId, // Keep for backward compatibility
      orgId: orgId, // Phase 1: Add orgId
      accountId: args.accountId,
      plaidTransactionId: args.plaidTransactionId,
      amount: args.amount,
      currency: "USD", // Default, could be from account
      date: args.date,
      dateTimestamp: dateTimestamp,
      merchant: args.merchant,
      description: args.description,
      category: args.category,
      status: status,
      source: args.plaidTransactionId ? "plaid" : "manual",
      createdAt: now,
    };

    // Set postedAt timestamp if status is posted or beyond
    if (status === "posted" || status === "cleared" || status === "reconciled") {
      transactionData.postedAt = now;
    }

    // Only include isBusiness if it's explicitly set (not undefined)
    if (args.isBusiness !== undefined) {
      transactionData.isBusiness = args.isBusiness;
    }

    // Include entry mode and line items if provided
    if (args.entryMode !== undefined) {
      transactionData.entryMode = args.entryMode;
    }

    // Include double entry accounts for simple mode
    if (args.debitAccountId !== undefined) {
      transactionData.debitAccountId = args.debitAccountId;
    }

    if (args.creditAccountId !== undefined) {
      transactionData.creditAccountId = args.creditAccountId;
    }

    if (args.lineItems !== undefined && args.lineItems.length > 0) {
      transactionData.lineItems = args.lineItems;
    }

    const transactionId = await ctx.db.insert("transactions_raw", transactionData);

    // Automatically process transaction to generate AI suggestion
    await ctx.scheduler.runAfter(0, api.transactions.processTransaction, {
      transactionId,
      orgId: orgId, // Phase 1: Pass orgId
    });

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
 * Update a transaction
 * Phase 1: Updated to use org context
 */
export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    merchant: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.array(v.string())),
    isBusiness: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("posted"),
      v.literal("cleared"),
      v.literal("reconciled")
    )),
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

    // Get orgId from transaction (Phase 1: Multi-tenant)
    const orgId = transaction.orgId;
    if (!orgId) {
      throw new Error("Transaction does not have an organization context");
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.date !== undefined) {
      updateData.date = args.date;
      // Update dateTimestamp when date is changed
      updateData.dateTimestamp = new Date(args.date + "T00:00:00Z").getTime();
    }
    if (args.merchant !== undefined) updateData.merchant = args.merchant;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.isBusiness !== undefined) updateData.isBusiness = args.isBusiness;
    if (args.status !== undefined) {
      updateData.status = args.status;
      const now = Date.now();
      // Update timestamps based on status transitions
      if (args.status === "posted" && !transaction.postedAt) {
        updateData.postedAt = now;
      }
      if (args.status === "cleared" && !transaction.clearedAt) {
        updateData.clearedAt = now;
        if (!transaction.postedAt) updateData.postedAt = now;
      }
      if (args.status === "reconciled" && !transaction.reconciledAt) {
        updateData.reconciledAt = now;
        if (!transaction.postedAt) updateData.postedAt = now;
        if (!transaction.clearedAt) updateData.clearedAt = now;
      }
    }
    updateData.updatedAt = Date.now();

    await ctx.db.patch(args.transactionId, updateData);

    // If transaction was updated, regenerate AI suggestion if needed
    if (args.description || args.category || args.merchant || args.isBusiness !== undefined) {
      // Schedule AI suggestion regeneration
      await ctx.scheduler.runAfter(0, api.ai_entries.suggestDoubleEntry, {
        transactionId: args.transactionId,
        orgId: orgId, // Phase 1: Pass orgId
      });
    }

    return { success: true };
  },
});

/**
 * Delete a transaction
 * Phase 1: Updated to use org context
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
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

    // Get orgId from transaction (Phase 1: Multi-tenant)
    const orgId = transaction.orgId;
    if (!orgId) {
      throw new Error("Transaction does not have an organization context");
    }

    // Delete associated proposed entries
    const proposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    for (const entry of proposedEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete associated receipts
    if (transaction.receiptIds && transaction.receiptIds.length > 0) {
      for (const receiptId of transaction.receiptIds) {
        await ctx.db.delete(receiptId);
      }
    }

    // Delete the transaction
    await ctx.db.delete(args.transactionId);

    return { success: true };
  },
});

/**
 * Remove Plaid transactions (called when webhook reports transactions removed)
 * This is the authenticated version for client-side use
 */
export const removePlaidTransactions = mutation({
  args: {
    plaidTransactionIds: v.array(v.string()),
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

    // Find and mark transactions as removed
    for (const plaidId of args.plaidTransactionIds) {
      const transaction = await ctx.db
        .query("transactions_raw")
        .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", plaidId))
        .first();

      if (transaction && transaction.userId === user._id) {
        // Mark as removed (don't delete, keep for audit trail)
        await ctx.db.patch(transaction._id, {
          removedAt: Date.now(),
        });

        // Also mark any associated proposed entries as removed
        const proposedEntries = await ctx.db
          .query("entries_proposed")
          .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
          .collect();

        for (const entry of proposedEntries) {
          if (entry.status === "pending") {
            await ctx.db.patch(entry._id, {
              status: "rejected",
            });
          }
        }
      }
    }

    return { success: true, removedCount: args.plaidTransactionIds.length };
  },
});

/**
 * Remove Plaid transactions (internal mutation for webhooks)
 * This version doesn't require user authentication - it looks up the user by itemId
 */
export const removePlaidTransactionsInternal = internalMutation({
  args: {
    itemId: v.string(), // Plaid item_id from webhook
    plaidTransactionIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Find institution by Plaid item ID to get the userId
    const institution = await ctx.db
      .query("institutions")
      .withIndex("by_plaid_item", (q) => q.eq("plaidItemId", args.itemId))
      .first();

    if (!institution) {
      throw new Error(`Institution not found for Plaid item ${args.itemId}`);
    }

    const userId = institution.userId;

    // Find and mark transactions as removed
    let removedCount = 0;
    for (const plaidId of args.plaidTransactionIds) {
      const transaction = await ctx.db
        .query("transactions_raw")
        .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", plaidId))
        .first();

      if (transaction && transaction.userId === userId) {
        // Mark as removed (don't delete, keep for audit trail)
        await ctx.db.patch(transaction._id, {
          removedAt: Date.now(),
        });

        // Also mark any associated proposed entries as removed
        const proposedEntries = await ctx.db
          .query("entries_proposed")
          .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
          .collect();

        for (const entry of proposedEntries) {
          if (entry.status === "pending") {
            await ctx.db.patch(entry._id, {
              status: "rejected",
            });
          }
        }
        removedCount++;
      }
    }

    return { success: true, removedCount };
  },
});

/**
 * Delete all transactions for the current user
 * This will also delete associated proposed entries and receipts
 */
export const deleteAllTransactions = mutation({
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

    // Get all transactions for the user
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let deletedCount = 0;

    // Delete each transaction and its associated data
    for (const transaction of transactions) {
      // Delete associated proposed entries
      const proposedEntries = await ctx.db
        .query("entries_proposed")
        .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
        .collect();

      for (const entry of proposedEntries) {
        await ctx.db.delete(entry._id);
      }

      // Delete associated receipts
      if (transaction.receiptIds && transaction.receiptIds.length > 0) {
        for (const receiptId of transaction.receiptIds) {
          await ctx.db.delete(receiptId);
        }
      }

      // Delete the transaction
      await ctx.db.delete(transaction._id);
      deletedCount++;
    }

    return { success: true, deletedCount };
  },
});

