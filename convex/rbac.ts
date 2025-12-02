/**
 * Role-Based Access Control (RBAC) helpers
 * Phase 1: Shared Foundation
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { PERMISSIONS, hasPermission, type Permission, type Role } from "./permissions";

/**
 * Helper to get active impersonation session
 */
async function getImpersonationSession(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  return await ctx.db
    .query("impersonation_sessions")
    .withIndex("by_super_admin", (q) => q.eq("superAdminUserId", userId))
    .first();
}

/**
 * Get user's role in an organization
 */
export async function getUserRoleInOrg(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">
): Promise<Role | null> {
  // Check for impersonation first
  const session = await getImpersonationSession(ctx, userId);
  if (session && session.impersonatedOrgId === orgId) {
    return session.impersonatedRole as Role;
  }

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  if (!membership) {
    return null;
  }

  return membership.role;
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  return user?.isSuperAdmin ?? false;
}

/**
 * Require that user is a member of the organization
 * Throws if user is not a member (unless super admin or impersonating)
 */
export async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">
): Promise<void> {
  // Check for impersonation
  const session = await getImpersonationSession(ctx, userId);
  if (session && session.impersonatedOrgId === orgId) {
    return;
  }

  // Super admins can access any org
  const isAdmin = await isSuperAdmin(ctx, userId);
  if (isAdmin) {
    return;
  }

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  if (!membership) {
    throw new Error("User is not a member of this organization");
  }
}

/**
 * Require that user has a specific permission in the organization
 * Throws if user doesn't have the permission
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  permission: Permission
): Promise<Role> {
  // Check for impersonation
  const session = await getImpersonationSession(ctx, userId);
  if (session && session.impersonatedOrgId === orgId) {
    const role = session.impersonatedRole as Role;
    if (hasPermission(role, permission)) {
      return role;
    }
    // If impersonating but role doesn't have permission, fall through to error
  } else {
    // Super admins have all permissions (if not impersonating someone with less)
    const isAdmin = await isSuperAdmin(ctx, userId);
    if (isAdmin) {
      return "ORG_OWNER";
    }
  }

  // Check membership and role
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  if (!membership) {
    // If we had a session but it failed permission check, we might still be here.
    // But if we have a session, we shouldn't check real membership.
    if (session && session.impersonatedOrgId === orgId) {
      throw new Error(
        `Impersonated role does not have permission: ${permission}. Role: ${session.impersonatedRole}`
      );
    }
    throw new Error("User is not a member of this organization");
  }

  // Check permission
  if (!hasPermission(membership.role, permission)) {
    throw new Error(
      `User does not have permission: ${permission}. Required role: ${membership.role}`
    );
  }

  return membership.role;
}

/**
 * Require that user is a super admin
 * Throws if user is not a super admin
 */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<void> {
  const isAdmin = await isSuperAdmin(ctx, userId);
  if (!isAdmin) {
    throw new Error("Super admin access required");
  }
}
