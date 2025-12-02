/**
 * Transaction query functions
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";
import { limitArray, normalizeLimit, DEFAULT_QUERY_LIMIT } from "../helpers/convexLimits";

/**
 * Get pending transactions that need approval
 * Phase 1: Updated to use org context
 */
export const getPendingTransactions = query({
  args: {
    filterType: v.optional(v.union(v.literal("business"), v.literal("personal"), v.literal("all"))),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    // Get proposed entries waiting for approval (org-scoped)
    let query = ctx.db
      .query("entries_proposed")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", orgId).eq("status", "pending")
      );

    // Apply filter if specified
    if (args.filterType === "business") {
      query = query.filter((q) => q.eq(q.field("isBusiness"), true));
    } else if (args.filterType === "personal") {
      query = query.filter((q) => q.eq(q.field("isBusiness"), false));
    }

    const proposedEntries = await query.order("desc").take(50);

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
    // Receipts per transaction should be small, but we still apply a safe limit
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    // Apply safe limit (unlikely to exceed, but safety first)
    return limitArray(receipts, 100);
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

    // Apply safe limit to prevent exceeding Convex array limits
    return limitArray(receipts, DEFAULT_QUERY_LIMIT);
  },
});

/**
 * Get transaction by ID
 * Phase 1: Updated to use org context
 */
export const getById = query({
  args: {
    transactionId: v.id("transactions_raw"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      return null;
    }

    // Verify transaction belongs to org
    if (transaction.orgId && transaction.orgId !== orgId) {
      throw new Error("Transaction does not belong to this organization");
    }

    return transaction;
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

    // Get user transactions with a safe limit to avoid exceeding Convex array limits
    // We collect more than needed for matching, but still cap at safe limit
    const maxTransactionsToCheck = normalizeLimit(args.limit ? args.limit * 10 : 1000, 1000);
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(maxTransactionsToCheck);

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
    return similar.slice(0, limit).map((item: any) => item.transaction);
  },
});

