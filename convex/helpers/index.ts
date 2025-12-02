/**
 * Helper functions exposed as queries for use in actions
 * Phase 1: Multi-tenant support
 */

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getOrgContext as getOrgContextHelper } from "./orgContext";

/**
 * Get org context (for use in actions)
 * Actions can't directly use getOrgContext helper, so we expose it as a query
 * Note: This is a query wrapper around the helper function
 */
export const getOrgContextQuery = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    return await getOrgContextHelper(ctx, args.orgId);
  },
});
