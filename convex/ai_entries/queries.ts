/**
 * Queries for AI-powered double-entry accounting
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOrgContext } from "../helpers/orgContext";
import { requirePermission } from "../rbac";
import { PERMISSIONS } from "../permissions";

/**
 * Get comprehensive business context for AI decision-making
 * Phase 1: Updated to use org context
 */
export const getBusinessContext = query({
  args: {
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args) => {
    // Get org context (includes auth check)
    const { userId, orgId } = await getOrgContext(ctx, args.orgId);

    // Check permission
    await requirePermission(ctx, userId, orgId, PERMISSIONS.VIEW_FINANCIALS);

    // Get user for preferences
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get business profile - org-scoped
    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    // Type assertion for user (TypeScript sometimes infers wrong union type)
    const userData = user as any;
    
    return {
      businessType: userData.businessType || undefined, // creator, tradesperson, wellness, etc. (optional field)
      businessEntityType: userData.preferences?.businessEntityType, // llc, s_corp, etc.
      businessCategory: businessProfile?.businessCategory,
      naicsCode: businessProfile?.naicsCode,
      entityType: businessProfile?.entityType,
      businessDescription: businessProfile?.businessDescription,
      accountingMethod: userData.preferences?.accountingMethod || "cash", // cash or accrual
    };
  },
});

