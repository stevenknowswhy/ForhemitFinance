/**
 * Account management functions
 * Phase 1: Updated to use org context
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getOrgContext } from "./helpers/orgContext";
import { requirePermission } from "./rbac";
import { PERMISSIONS } from "./permissions";
import { limitArray, DEFAULT_QUERY_LIMIT } from "./helpers/convexLimits";

/**
 * Get accounts by institution
 * Phase 1: Updated to use org context
 */
export const getByInstitution = query({
  args: {
    institutionId: v.id("institutions"),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    const institution = await ctx.db.get(args.institutionId);
    if (!institution) {
      throw new Error("Institution not found");
    }

    // Verify institution belongs to org
    if (institution.orgId && institution.orgId !== orgId) {
      throw new Error("Institution does not belong to this organization");
    }

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q: any) => q.eq(q.field("institutionId"), args.institutionId))
      .collect();
    
    // Apply safe limit (accounts per institution should be small, but safety first)
    return limitArray(accounts, 100);
  },
});

/**
 * Get all accounts for current organization
 * Phase 1: Updated to use org context
 */
export const getAll = query({
  args: {
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    
    // Apply safe limit to prevent exceeding Convex array limits
    // Most orgs won't have thousands of accounts, but we cap at a safe limit
    return limitArray(accounts, DEFAULT_QUERY_LIMIT);
  },
});

