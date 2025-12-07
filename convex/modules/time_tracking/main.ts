/**
 * Time Tracking Module
 * Time Tracking Add-on Backend
 */

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireAddon } from "../../marketplace/entitlements";
import { getAuthenticatedUserOrThrow } from "../../users";

const ADDON_SLUG = "time_tracking";

/**
 * List all time entries for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        userId: v.optional(v.id("users")),
        projectId: v.optional(v.id("projects")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Check entitlement
        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        let entries = await ctx.db
            .query("time_entries")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        // Filter by user if provided
        if (args.userId) {
            entries = entries.filter((e) => e.userId === args.userId);
        }

        // Filter by project if provided
        if (args.projectId) {
            entries = entries.filter((e) => e.projectId === args.projectId);
        }

        // Filter by date range
        if (args.startDate) {
            entries = entries.filter((e) => e.startTime >= args.startDate!);
        }
        if (args.endDate) {
            entries = entries.filter((e) => e.startTime <= args.endDate!);
        }

        // Sort by most recent first
        entries.sort((a, b) => b.startTime - a.startTime);

        return entries;
    },
});

/**
 * Get the currently running timer for a user
 */
export const getRunningTimer = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        const running = await ctx.db
            .query("time_entries")
            .withIndex("by_org_user", (q) =>
                q.eq("orgId", args.orgId).eq("userId", user._id)
            )
            .filter((q) => q.eq(q.field("status"), "running"))
            .first();

        return running;
    },
});

/**
 * Start a new timer
 */
export const startTimer = mutation({
    args: {
        orgId: v.id("organizations"),
        description: v.string(),
        projectId: v.optional(v.id("projects")),
        hourlyRate: v.optional(v.number()),
        isBillable: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        // Stop any running timers first
        const runningTimers = await ctx.db
            .query("time_entries")
            .withIndex("by_org_user", (q) =>
                q.eq("orgId", args.orgId).eq("userId", user._id)
            )
            .filter((q) => q.eq(q.field("status"), "running"))
            .collect();

        for (const timer of runningTimers) {
            const now = Date.now();
            const durationMinutes = Math.round(
                (now - timer.startTime) / (1000 * 60)
            );
            await ctx.db.patch(timer._id, {
                status: "stopped",
                endTime: now,
                durationMinutes,
                updatedAt: now,
            });
        }

        // Start new timer
        const id = await ctx.db.insert("time_entries", {
            orgId: args.orgId,
            userId: user._id,
            description: args.description,
            projectId: args.projectId,
            startTime: Date.now(),
            durationMinutes: 0,
            hourlyRate: args.hourlyRate,
            isBillable: args.isBillable ?? true,
            status: "running",
            tags: args.tags,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});

/**
 * Stop a running timer
 */
export const stopTimer = mutation({
    args: {
        id: v.id("time_entries"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error("Time entry not found");
        }

        await requireAddon(ctx, entry.orgId, ADDON_SLUG);

        if (entry.status !== "running") {
            throw new Error("Timer is not running");
        }

        const now = Date.now();
        const durationMinutes = Math.round((now - entry.startTime) / (1000 * 60));

        await ctx.db.patch(args.id, {
            status: "stopped",
            endTime: now,
            durationMinutes,
            updatedAt: now,
        });

        return { durationMinutes };
    },
});

/**
 * Create a manual time entry
 */
export const createManual = mutation({
    args: {
        orgId: v.id("organizations"),
        description: v.string(),
        projectId: v.optional(v.id("projects")),
        startTime: v.number(),
        endTime: v.number(),
        hourlyRate: v.optional(v.number()),
        isBillable: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        const durationMinutes = Math.round(
            (args.endTime - args.startTime) / (1000 * 60)
        );

        const id = await ctx.db.insert("time_entries", {
            orgId: args.orgId,
            userId: user._id,
            description: args.description,
            projectId: args.projectId,
            startTime: args.startTime,
            endTime: args.endTime,
            durationMinutes,
            hourlyRate: args.hourlyRate,
            isBillable: args.isBillable ?? true,
            status: "stopped",
            tags: args.tags,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});

/**
 * Update a time entry
 */
export const update = mutation({
    args: {
        id: v.id("time_entries"),
        description: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        durationMinutes: v.optional(v.number()),
        hourlyRate: v.optional(v.number()),
        isBillable: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const { id, ...updates } = args;

        const entry = await ctx.db.get(id);
        if (!entry) {
            throw new Error("Time entry not found");
        }

        await requireAddon(ctx, entry.orgId, ADDON_SLUG);

        // Recalculate duration if times changed
        let durationMinutes = updates.durationMinutes;
        if (updates.startTime || updates.endTime) {
            const start = updates.startTime ?? entry.startTime;
            const end = updates.endTime ?? entry.endTime;
            if (end) {
                durationMinutes = Math.round((end - start) / (1000 * 60));
            }
        }

        await ctx.db.patch(id, {
            ...updates,
            durationMinutes: durationMinutes ?? entry.durationMinutes,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete a time entry
 */
export const remove = mutation({
    args: {
        id: v.id("time_entries"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error("Time entry not found");
        }

        await requireAddon(ctx, entry.orgId, ADDON_SLUG);

        await ctx.db.delete(args.id);
    },
});

/**
 * Get time tracking summary/stats
 */
export const getStats = query({
    args: {
        orgId: v.id("organizations"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        await requireAddon(ctx, args.orgId, ADDON_SLUG);

        let entries = await ctx.db
            .query("time_entries")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.eq(q.field("status"), "stopped"))
            .collect();

        // Filter by date range
        if (args.startDate) {
            entries = entries.filter((e) => e.startTime >= args.startDate!);
        }
        if (args.endDate) {
            entries = entries.filter((e) => e.startTime <= args.endDate!);
        }

        // Calculate stats
        const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
        const billableMinutes = entries
            .filter((e) => e.isBillable)
            .reduce((sum, e) => sum + e.durationMinutes, 0);

        const totalEarnings = entries
            .filter((e) => e.isBillable && e.hourlyRate)
            .reduce((sum, e) => sum + (e.durationMinutes / 60) * (e.hourlyRate || 0), 0);

        // Group by project
        const byProject = entries.reduce((acc, e) => {
            const key = e.projectId?.toString() || "unassigned";
            if (!acc[key]) {
                acc[key] = { minutes: 0, count: 0 };
            }
            acc[key].minutes += e.durationMinutes;
            acc[key].count += 1;
            return acc;
        }, {} as Record<string, { minutes: number; count: number }>);

        return {
            totalEntries: entries.length,
            totalMinutes,
            totalHours: Math.round((totalMinutes / 60) * 100) / 100,
            billableMinutes,
            billableHours: Math.round((billableMinutes / 60) * 100) / 100,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            byProject,
        };
    },
});
