/**
 * Institution management operations
 */

import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";
import { limitArray, DEFAULT_QUERY_LIMIT } from "../helpers/convexLimits";

/**
 * Store institution connection in database
 * Phase 1: Updated to use org context
 */
export const storeInstitution = mutation({
  args: {
    plaidItemId: v.string(),
    plaidInstitutionId: v.string(),
    name: v.string(),
    accessTokenEncrypted: v.string(),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args): Promise<any> => {
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.MANAGE_INTEGRATIONS);

    const institutionId = await ctx.db.insert("institutions", {
      userId: userId, // Keep for backward compatibility
      orgId: orgId, // Phase 1: Add orgId
      plaidItemId: args.plaidItemId,
      plaidInstitutionId: args.plaidInstitutionId,
      name: args.name,
      accessTokenEncrypted: args.accessTokenEncrypted,
      syncStatus: "active",
      createdAt: Date.now(),
    });

    return institutionId;
  },
});

/**
 * Get institution by ID
 */
export const getInstitution = query({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.db.get(args.institutionId);
  },
});

/**
 * Get all institutions for current user
 */
export const getUserInstitutions = query({
  args: {},
  handler: async (ctx): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const institutions = await ctx.db
      .query("institutions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Apply safe limit (users typically have few institutions)
    return limitArray(institutions, DEFAULT_QUERY_LIMIT);
  },
});

/**
 * Update last sync time
 */
export const updateLastSync = mutation({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args): Promise<any> => {
    await ctx.db.patch(args.institutionId, {
      lastSyncAt: Date.now(),
    });
  },
});

/**
 * Update institution sync status
 */
export const updateInstitutionStatus = mutation({
  args: {
    institutionId: v.id("institutions"),
    status: v.union(v.literal("active"), v.literal("error"), v.literal("disconnected")),
  },
  handler: async (ctx, args): Promise<any> => {
    await ctx.db.patch(args.institutionId, {
      syncStatus: args.status,
    });
  },
});

/**
 * Get institution by Plaid item ID
 */
export const getInstitutionByItemId = query({
  args: {
    plaidItemId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.db
      .query("institutions")
      .withIndex("by_plaid_item", (q) => q.eq("plaidItemId", args.plaidItemId))
      .first();
  },
});

/**
 * Sync transactions by Plaid item ID (for webhooks)
 */
export const syncTransactionsByItemId = action({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Find institution by Plaid item ID
    const institution = await ctx.runQuery(api.plaid.getInstitutionByItemId, {
      plaidItemId: args.itemId,
    });

    if (!institution) {
      throw new Error(`Institution not found for Plaid item ${args.itemId}`);
    }

    // Call the existing syncTransactions with institutionId
    await ctx.scheduler.runAfter(0, api.plaid.syncTransactions, {
      institutionId: institution._id,
    });

    return { success: true };
  },
});

/**
 * Update item status (for webhooks)
 */
export const updateItemStatus = mutation({
  args: {
    itemId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("error"),
      v.literal("pending_expiration"),
      v.literal("permission_revoked"),
      v.literal("disconnected")
    ),
    error: v.optional(
      v.object({
        type: v.string(),
        code: v.string(),
        message: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<any> => {
    const institution = await ctx.db
      .query("institutions")
      .withIndex("by_plaid_item", (q) => q.eq("plaidItemId", args.itemId))
      .first();

    if (!institution) {
      throw new Error(`Institution not found for Plaid item ${args.itemId}`);
    }

    const updateData: any = {
      syncStatus: args.status === "active" ? "active" : "error",
      lastSyncAt: Date.now(),
    };

    if (args.error) {
      updateData.lastError = {
        type: args.error.type,
        code: args.error.code,
        message: args.error.message,
        timestamp: Date.now(),
      };
    }

    await ctx.db.patch(institution._id, updateData);

    return { success: true };
  },
});

