import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireSuperAdmin } from "./rbac";
import { logAuditEvent } from "./audit";

/**
 * List all organizations with filtering
 */
export const listOrganizations = query({
    args: {
        status: v.optional(v.string()),
        plan: v.optional(v.string()),
        search: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // 1. Check Super Admin permission
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");
        await requireSuperAdmin(ctx, user._id);

        // 2. Fetch organizations
        let orgs;
        if (args.status) {
            orgs = await ctx.db
                .query("organizations")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .order("desc")
                .take(args.limit || 100);
        } else {
            orgs = await ctx.db
                .query("organizations")
                .order("desc")
                .take(args.limit || 100);
        }

        // 3. Filter by search term (client-side filtering for MVP)
        if (args.search) {
            const searchLower = args.search.toLowerCase();
            orgs = orgs.filter((org) =>
                org.name.toLowerCase().includes(searchLower)
            );
        }

        // 4. Enrich with plan details
        const enrichedOrgs = await Promise.all(
            orgs.map(async (org) => {
                const subscription = await ctx.db
                    .query("subscriptions")
                    .withIndex("by_org", (q) => q.eq("orgId", org._id))
                    .first();

                let planName = "None";
                if (subscription) {
                    const plan = await ctx.db.get(subscription.planId);
                    if (plan) planName = plan.name;
                }

                return {
                    ...org,
                    planName,
                    subscriptionStatus: subscription?.status,
                };
            })
        );

        return enrichedOrgs;
    },
});

/**
 * Get organization details for Super Admin
 */
export const getOrganizationDetails = query({
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
        await requireSuperAdmin(ctx, user._id);

        const org = await ctx.db.get(args.orgId);
        if (!org) throw new Error("Organization not found");

        // Fetch subscription
        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .first();

        let plan = null;
        if (subscription) {
            plan = await ctx.db.get(subscription.planId);
        }

        // Fetch members
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        const members = await Promise.all(
            memberships.map(async (m) => {
                const u = await ctx.db.get(m.userId);
                return {
                    ...m,
                    userEmail: u?.email,
                    userName: u?.name,
                };
            })
        );

        return {
            org,
            subscription,
            plan,
            members,
        };
    },
});

/**
 * Create a new organization (Super Admin)
 */
export const createOrganization = mutation({
    args: {
        name: v.string(),
        type: v.union(v.literal("business"), v.literal("personal")),
        baseCurrency: v.string(),
        planId: v.optional(v.id("plans")),
        ownerEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!adminUser) throw new Error("User not found");
        await requireSuperAdmin(ctx, adminUser._id);

        // Create Org
        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            type: args.type,
            status: "active",
            baseCurrency: args.baseCurrency,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastActiveAt: Date.now(),
        });

        // Assign Plan
        if (args.planId) {
            await ctx.db.insert("subscriptions", {
                orgId,
                planId: args.planId,
                status: "active",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Invite Owner if email provided
        if (args.ownerEmail) {
            // Check if user exists
            let ownerUser = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.ownerEmail!))
                .first();

            if (!ownerUser) {
                // Create invited user
                const newUserId = await ctx.db.insert("users", {
                    email: args.ownerEmail!,
                    status: "invited",
                    createdAt: Date.now(),
                    subscriptionTier: "solo",
                    preferences: {
                        defaultCurrency: args.baseCurrency,
                        aiInsightLevel: "medium",
                        notificationsEnabled: true,
                    },
                });
                ownerUser = await ctx.db.get(newUserId);
            }

            if (ownerUser) {
                await ctx.db.insert("memberships", {
                    userId: ownerUser._id,
                    orgId,
                    role: "ORG_OWNER",
                    status: "invited",
                    invitedBy: adminUser._id,
                    invitedAt: Date.now(),
                    createdAt: Date.now(),
                });
            }
        }

        // Audit Log
        await logAuditEvent(ctx, {
            actorUserId: adminUser._id,
            actorRole: "SUPER_ADMIN",
            action: "ORG_CREATED_BY_ADMIN",
            targetType: "organization",
            targetId: orgId,
            metadata: { name: args.name, type: args.type },
        });

        return orgId;
    },
});

/**
 * Update Organization Status
 */
export const updateOrgStatus = mutation({
    args: {
        orgId: v.id("organizations"),
        status: v.union(
            v.literal("active"),
            v.literal("trial"),
            v.literal("suspended"),
            v.literal("deleted")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!adminUser) throw new Error("User not found");
        await requireSuperAdmin(ctx, adminUser._id);

        await ctx.db.patch(args.orgId, {
            status: args.status,
            updatedAt: Date.now(),
        });

        await logAuditEvent(ctx, {
            orgId: args.orgId,
            actorUserId: adminUser._id,
            actorRole: "SUPER_ADMIN",
            action: "ORG_STATUS_UPDATED",
            targetType: "organization",
            targetId: args.orgId,
            metadata: { status: args.status },
        });
    },
});

/**
 * Start Impersonation
 */
export const startImpersonation = mutation({
    args: {
        orgId: v.id("organizations"),
        userId: v.optional(v.id("users")), // Optional: specific user to impersonate
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!adminUser) throw new Error("User not found");
        await requireSuperAdmin(ctx, adminUser._id);

        // 1. Clear any existing sessions for this admin
        const existingSessions = await ctx.db
            .query("impersonation_sessions")
            .withIndex("by_super_admin", (q) => q.eq("superAdminUserId", adminUser._id))
            .collect();

        for (const session of existingSessions) {
            await ctx.db.delete(session._id);
        }

        // 2. Determine impersonated user/role
        let impersonatedUserId = args.userId;
        let impersonatedRole = "ORG_OWNER"; // Default to owner level access

        if (!impersonatedUserId) {
            // Find the org owner to impersonate
            const ownerMembership = await ctx.db
                .query("memberships")
                .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
                .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
                .first();

            if (ownerMembership) {
                impersonatedUserId = ownerMembership.userId;
            }
        }

        // 3. Create new session
        const sessionToken = crypto.randomUUID();
        await ctx.db.insert("impersonation_sessions", {
            superAdminUserId: adminUser._id,
            impersonatedOrgId: args.orgId,
            impersonatedUserId: impersonatedUserId,
            impersonatedRole,
            sessionToken,
            startedAt: Date.now(),
        });

        await logAuditEvent(ctx, {
            orgId: args.orgId,
            actorUserId: adminUser._id,
            actorRole: "SUPER_ADMIN",
            action: "IMPERSONATION_STARTED",
            targetType: "organization",
            targetId: args.orgId,
            metadata: { impersonatedUserId },
        });

        return { sessionToken };
    },
});

/**
 * Stop Impersonation
 */
export const stopImpersonation = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!adminUser) throw new Error("User not found");

        // Find active session
        const session = await ctx.db
            .query("impersonation_sessions")
            .withIndex("by_super_admin", (q) => q.eq("superAdminUserId", adminUser._id))
            .first();

        if (session) {
            await ctx.db.delete(session._id);

            await logAuditEvent(ctx, {
                orgId: session.impersonatedOrgId,
                actorUserId: adminUser._id,
                actorRole: "SUPER_ADMIN",
                action: "IMPERSONATION_ENDED",
                targetType: "organization",
                targetId: session.impersonatedOrgId,
            });
        }
    },
});

/**
 * Get Active Impersonation
 */
export const getActiveImpersonation = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) return null;

        const session = await ctx.db
            .query("impersonation_sessions")
            .withIndex("by_super_admin", (q) => q.eq("superAdminUserId", user._id))
            .first();

        if (!session) return null;

        const org = await ctx.db.get(session.impersonatedOrgId);

        return {
            isImpersonating: true,
            orgId: session.impersonatedOrgId,
            orgName: org?.name,
            role: session.impersonatedRole,
        };
    },
});
