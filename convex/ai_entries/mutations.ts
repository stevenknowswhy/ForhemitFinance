/**
 * Mutations for AI-powered double-entry accounting
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";

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

