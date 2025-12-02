/**
 * Organization context helpers
 * Used by queries and mutations to get org context
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getOrgFromContext } from "../organizations";

export interface OrgContext {
  userId: Id<"users">;
  orgId: Id<"organizations">;
  userEmail: string;
}

/**
 * Get authenticated user and org context
 * 
 * @param ctx - Query or mutation context
 * @param orgId - Optional orgId from args. If not provided, uses user's first active org
 * @returns OrgContext with userId, orgId, and userEmail
 */
export async function getOrgContext(
  ctx: QueryCtx | MutationCtx,
  orgId?: Id<"organizations">
): Promise<OrgContext> {
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

  // Get orgId (from args or user's first org)
  const resolvedOrgId = await getOrgFromContext(ctx, user._id, orgId);

  return {
    userId: user._id,
    orgId: resolvedOrgId,
    userEmail: email,
  };
}

/**
 * Get authenticated user (without org context)
 * Useful for user-specific operations
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: Id<"users">; userEmail: string }> {
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

  return {
    userId: user._id,
    userEmail: email,
  };
}
