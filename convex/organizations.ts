/**
 * Organization management and context resolution
 * Phase 1: Shared Foundation
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { requireOrgMember, requirePermission } from "./rbac";
import { limitArray, DEFAULT_QUERY_LIMIT } from "./helpers/convexLimits";

/**
 * Get all organizations a user belongs to
 */
export const getUserOrganizations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Apply safe limit (users typically belong to few orgs)
    const safeMemberships = limitArray(memberships, DEFAULT_QUERY_LIMIT);

    const orgs = await Promise.all(
      safeMemberships.map(async (membership) => {
        const org = await ctx.db.get(membership.orgId);
        if (!org) return null;
        return {
          ...org,
          role: membership.role,
          membershipId: membership._id,
        };
      })
    );

    return orgs.filter((org) => org !== null);
  },
});

/**
 * Get all members of an organization
 */
export const getOrgMembers = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Apply safe limit (orgs typically have limited members)
    const safeMemberships = limitArray(memberships, DEFAULT_QUERY_LIMIT);

    const members = await Promise.all(
      safeMemberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;
        return {
          ...membership,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            status: user.status,
          },
        };
      })
    );

    return members.filter((member) => member !== null);
  },
});

/**
 * Get current organization context for a user
 * Resolves from explicit orgId or falls back to last-used org
 */
export const getCurrentOrg = query({
  args: {
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // If orgId is provided, verify membership and return
    if (args.orgId) {
      const orgId = args.orgId; // Type narrowing
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", args.userId).eq("orgId", orgId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!membership) {
        throw new Error("User is not a member of this organization");
      }

      const org = await ctx.db.get(args.orgId);
      if (!org) {
        throw new Error("Organization not found");
      }

      return {
        org,
        role: membership.role,
        membershipId: membership._id,
      };
    }

    // Otherwise, get user's first active org (or most recently used)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .first();

    if (!memberships) {
      return null;
    }

    const org = await ctx.db.get(memberships.orgId);
    if (!org) {
      return null;
    }

    return {
      org,
      role: memberships.role,
      membershipId: memberships._id,
    };
  },
});

/**
 * Set last used organization for a user
 * (Stored in user preferences or separate table - simplified for now)
 */
export const setLastUsedOrg = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Verify membership
    await requireOrgMember(ctx, args.userId, args.orgId);

    // Update org's lastActiveAt
    await ctx.db.patch(args.orgId, {
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a new organization
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("business"), v.literal("personal")),
    baseCurrency: v.string(),
    fiscalYearStart: v.optional(v.string()),
    ownerUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      status: "active",
      baseCurrency: args.baseCurrency,
      fiscalYearStart: args.fiscalYearStart,
      accountingMethod: "cash", // Default
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Create membership for owner
    await ctx.db.insert("memberships", {
      userId: args.ownerUserId,
      orgId,
      role: "ORG_OWNER",
      status: "active",
      joinedAt: Date.now(),
      createdAt: Date.now(),
    });

    return { orgId };
  },
});

/**
 * Update organization settings
 */
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    fiscalYearStart: v.optional(v.string()),
    accountingMethod: v.optional(v.union(v.literal("cash"), v.literal("accrual"))),
    baseCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    // Require admin permissions
    await requirePermission(ctx, user._id, args.orgId, "MANAGE_ORG_SETTINGS");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.fiscalYearStart !== undefined) updates.fiscalYearStart = args.fiscalYearStart;
    if (args.accountingMethod !== undefined) updates.accountingMethod = args.accountingMethod;
    if (args.baseCurrency !== undefined) updates.baseCurrency = args.baseCurrency;

    await ctx.db.patch(args.orgId, updates);

    // Log audit event
    // await logAuditEvent(ctx, { ... }); // TODO: Add audit logging

    return { success: true };
  },
});

/**
 * Get organization by ID (with permission check)
 */
export const getOrganization = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.userId, args.orgId);

    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    return org;
  },
});

/**
 * Helper function to get org context from request
 * Used by other functions to extract orgId
 */
export async function getOrgFromContext(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId?: Id<"organizations">
): Promise<Id<"organizations">> {
  if (orgId) {
    await requireOrgMember(ctx, userId, orgId);
    return orgId;
  }

  // Get user's first active org
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .order("desc")
    .first();

  if (!membership) {
    throw new Error("User has no active organizations");
  }

  return membership.orgId;
}
