import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requirePermission } from "./rbac";
import { logAuditEvent, logUserInvited } from "./audit";

/**
 * List members of an organization
 */
export const listMembers = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        // Check permission (VIEW_FINANCIALS is minimum for seeing team, or MANAGE_TEAM?)
        // Let's say any member can see the team list, but only admins can manage.
        // But for now, let's use MANAGE_TEAM for management actions, and maybe just membership check for listing.
        // Actually, let's restrict listing to MANAGE_TEAM for now to be safe, or at least require membership.
        // For now, we'll just check if they are a member.
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
            .first();

        if (!membership) throw new Error("Not a member of this organization");

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        const members = await Promise.all(
            memberships.map(async (m) => {
                const u = await ctx.db.get(m.userId);
                return {
                    _id: m._id,
                    userId: m.userId,
                    role: m.role,
                    status: m.status,
                    invitedAt: m.invitedAt,
                    joinedAt: m.joinedAt,
                    email: u?.email,
                    name: u?.name,
                };
            })
        );

        return members;
    },
});

/**
 * Invite a new member
 */
export const inviteMember = mutation({
    args: {
        orgId: v.id("organizations"),
        email: v.string(),
        role: v.union(
            v.literal("ORG_OWNER"),
            v.literal("ORG_ADMIN"),
            v.literal("BOOKKEEPER"),
            v.literal("VIEWER")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        // Require MANAGE_TEAM permission
        const actorRole = await requirePermission(ctx, user._id, args.orgId, "MANAGE_TEAM");

        // Check if user already exists
        let invitedUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!invitedUser) {
            // Create invited user placeholder
            const newUserId = await ctx.db.insert("users", {
                email: args.email,
                status: "invited",
                createdAt: Date.now(),
                subscriptionTier: "solo", // Default
                preferences: {
                    defaultCurrency: "USD",
                    aiInsightLevel: "medium",
                    notificationsEnabled: true,
                },
            });
            invitedUser = await ctx.db.get(newUserId);
        }

        if (!invitedUser) throw new Error("Failed to create/find user");

        // Check if already a member
        const existingMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", invitedUser!._id).eq("orgId", args.orgId))
            .first();

        if (existingMembership) {
            throw new Error("User is already a member of this organization");
        }

        // Create membership
        const membershipId = await ctx.db.insert("memberships", {
            userId: invitedUser._id,
            orgId: args.orgId,
            role: args.role,
            status: "invited",
            invitedBy: user._id,
            invitedAt: Date.now(),
            createdAt: Date.now(),
        });

        await logUserInvited(ctx, {
            orgId: args.orgId,
            actorUserId: user._id,
            actorRole,
            invitedUserId: invitedUser._id,
            role: args.role,
        });

        return membershipId;
    },
});

/**
 * Update member role
 */
export const updateMemberRole = mutation({
    args: {
        membershipId: v.id("memberships"),
        newRole: v.union(
            v.literal("ORG_OWNER"),
            v.literal("ORG_ADMIN"),
            v.literal("BOOKKEEPER"),
            v.literal("VIEWER")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        const membership = await ctx.db.get(args.membershipId);
        if (!membership) throw new Error("Membership not found");

        // Require MANAGE_TEAM permission
        const actorRole = await requirePermission(ctx, user._id, membership.orgId, "MANAGE_TEAM");

        // Prevent removing the last owner? 
        // (Ideally yes, but for MVP maybe just rely on frontend warning or simple check)

        await ctx.db.patch(args.membershipId, {
            role: args.newRole,
        });

        await logAuditEvent(ctx, {
            orgId: membership.orgId,
            actorUserId: user._id,
            actorRole,
            action: "MEMBER_ROLE_UPDATED",
            targetType: "membership",
            targetId: args.membershipId,
            metadata: { oldRole: membership.role, newRole: args.newRole },
        });
    },
});

/**
 * Remove member
 */
export const removeMember = mutation({
    args: {
        membershipId: v.id("memberships"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        const membership = await ctx.db.get(args.membershipId);
        if (!membership) throw new Error("Membership not found");

        // Require MANAGE_TEAM permission
        const actorRole = await requirePermission(ctx, user._id, membership.orgId, "MANAGE_TEAM");

        await ctx.db.delete(args.membershipId);

        await logAuditEvent(ctx, {
            orgId: membership.orgId,
            actorUserId: user._id,
            actorRole,
            action: "MEMBER_REMOVED",
            targetType: "membership",
            targetId: args.membershipId,
            metadata: { removedUserId: membership.userId },
        });
    },
});
