/**
 * Projects Module
 * Project Profitability Add-on Backend
 */

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireAddon } from "../../marketplace/entitlements";
import { getAuthenticatedUserOrThrow } from "../../users";

const ADDON_SLUG = "project_profitability";

/**
 * List all projects for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Check entitlement
        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        let projects = await ctx.db
            .query("projects")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        // Filter by status if provided
        if (args.status) {
            projects = projects.filter((p) => p.status === args.status);
        }

        // Sort by name
        projects.sort((a, b) => a.name.localeCompare(b.name));

        return projects;
    },
});

/**
 * Get a single project by ID
 */
export const getById = query({
    args: {
        id: v.id("projects"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const project = await ctx.db.get(args.id);

        if (project) {
            await requireAddon(ctx, project.orgId, ADDON_SLUG);
        }

        return project;
    },
});

/**
 * Create a new project
 */
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        name: v.string(),
        clientId: v.optional(v.id("vendors")),
        budgetAmount: v.optional(v.number()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        color: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Check entitlement
        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        const id = await ctx.db.insert("projects", {
            ...args,
            status: "active",
            createdByUserId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});

/**
 * Update a project
 */
export const update = mutation({
    args: {
        id: v.id("projects"),
        name: v.optional(v.string()),
        status: v.optional(
            v.union(
                v.literal("active"),
                v.literal("completed"),
                v.literal("on_hold"),
                v.literal("cancelled")
            )
        ),
        clientId: v.optional(v.id("vendors")),
        budgetAmount: v.optional(v.number()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        color: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const { id, ...updates } = args;

        const project = await ctx.db.get(id);
        if (!project) {
            throw new Error("Project not found");
        }

        await requireAddon(ctx, project.orgId, ADDON_SLUG);

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete a project
 */
export const remove = mutation({
    args: {
        id: v.id("projects"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const project = await ctx.db.get(args.id);
        if (!project) {
            throw new Error("Project not found");
        }

        await requireAddon(ctx, project.orgId, ADDON_SLUG);

        // Delete all project transactions first
        const projectTransactions = await ctx.db
            .query("project_transactions")
            .withIndex("by_project", (q) => q.eq("projectId", args.id))
            .collect();

        for (const pt of projectTransactions) {
            await ctx.db.delete(pt._id);
        }

        await ctx.db.delete(args.id);
    },
});

/**
 * Tag a transaction to a project
 */
export const tagTransaction = mutation({
    args: {
        projectId: v.id("projects"),
        transactionId: v.id("transactions_raw"),
        allocatedAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        await requireAddon(ctx, project.orgId, ADDON_SLUG);

        // Check if already tagged
        const existing = await ctx.db
            .query("project_transactions")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("transactionId"), args.transactionId))
            .first();

        if (existing) {
            // Update allocation
            await ctx.db.patch(existing._id, {
                allocatedAmount: args.allocatedAmount,
            });
            return existing._id;
        }

        // Create new tag
        const id = await ctx.db.insert("project_transactions", {
            projectId: args.projectId,
            transactionId: args.transactionId,
            allocatedAmount: args.allocatedAmount,
            createdAt: Date.now(),
        });

        return id;
    },
});

/**
 * Remove a transaction from a project
 */
export const untagTransaction = mutation({
    args: {
        projectId: v.id("projects"),
        transactionId: v.id("transactions_raw"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        await requireAddon(ctx, project.orgId, ADDON_SLUG);

        const tag = await ctx.db
            .query("project_transactions")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("transactionId"), args.transactionId))
            .first();

        if (tag) {
            await ctx.db.delete(tag._id);
        }
    },
});

/**
 * Get project profitability report
 */
export const getProfitability = query({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        await requireAddon(ctx, project.orgId, ADDON_SLUG);

        // Get all tagged transactions
        const projectTransactions = await ctx.db
            .query("project_transactions")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        // Fetch actual transactions
        const transactions = await Promise.all(
            projectTransactions.map(async (pt) => {
                const tx = await ctx.db.get(pt.transactionId);
                return { ...tx, allocatedAmount: pt.allocatedAmount };
            })
        );

        // Calculate totals
        let totalRevenue = 0;
        let totalCost = 0;

        for (const tx of transactions) {
            if (!tx) continue;
            const amount = (tx.allocatedAmount ?? tx.amount) || 0;

            // Positive amounts are income, negative are expenses
            if (amount > 0) {
                totalRevenue += amount;
            } else {
                totalCost += Math.abs(amount);
            }
        }

        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const budgetUsed = project.budgetAmount
            ? (totalCost / project.budgetAmount) * 100
            : null;

        return {
            project,
            transactions,
            summary: {
                totalRevenue,
                totalCost,
                profit,
                margin: Math.round(margin * 100) / 100,
                budgetAmount: project.budgetAmount,
                budgetUsed: budgetUsed ? Math.round(budgetUsed * 100) / 100 : null,
                transactionCount: transactions.length,
            },
        };
    },
});
