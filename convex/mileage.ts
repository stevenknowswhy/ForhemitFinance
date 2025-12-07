import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUserOrThrow } from "./users";

// Default rates (2024 IRS Standard Mileage Rates)
const DEFAULT_RATES = {
    miles: 0.67, // $0.67 per mile
    km: 0.41,    // ~$0.41 per km (approximate conversion)
};

/**
 * Get all mileage entries for the current user/org
 */
export const getMileageEntries = query({
    args: {
        orgId: v.optional(v.string()),
        year: v.optional(v.number()), // Filter by year
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const entries = await ctx.db
            .query("mileage")
            .withIndex("by_org_date", (q) =>
                args.orgId
                    ? q.eq("orgId", args.orgId as any)
                    : q.eq("orgId", undefined) // Personal fallback if needed, though strictly we should respect orgId
            )
            .order("desc") // Newest first
            .take(args.limit || 100);

        // If "personal" mode without orgId, we might want to filter by userId if orgId is null? 
        // For now assuming orgId is passed for multi-tenant.

        // Filter by year in memory if needed (better to add index range in future if volume high)
        if (args.year) {
            const start = new Date(`${args.year}-01-01`).getTime();
            const end = new Date(`${args.year + 1}-01-01`).getTime();
            return entries.filter(e => e.date >= start && e.date < end);
        }

        return entries;
    },
});

/**
 * Get summary stats for mileage
 */
export const getMileageStats = query({
    args: {
        orgId: v.optional(v.string()),
        year: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Range for the year
        const start = new Date(`${args.year}-01-01`).getTime();
        const end = new Date(`${args.year + 1}-01-01`).getTime();

        const entries = await ctx.db
            .query("mileage")
            .withIndex("by_org_date", (q) =>
                args.orgId
                    ? q.eq("orgId", args.orgId as any).gte("date", start).lt("date", end)
                    : q.eq("orgId", undefined).gte("date", start).lt("date", end)
            )
            .collect();

        const totalDistance = entries.reduce((sum, e) => sum + e.distance, 0);
        const totalDeduction = entries.reduce((sum, e) => sum + e.amount, 0);
        const totalTrips = entries.length;

        return {
            totalDistance,
            totalDeduction,
            totalTrips,
            year: args.year,
        };
    },
});

/**
 * Add a new mileage trip
 */
export const addTrip = mutation({
    args: {
        orgId: v.optional(v.string()),
        date: v.number(),
        startLocation: v.optional(v.string()),
        endLocation: v.optional(v.string()),
        distance: v.number(),
        distanceUnit: v.union(v.literal("miles"), v.literal("km")),
        purpose: v.string(),
        description: v.optional(v.string()),
        vehicle: v.optional(v.string()),
        isRoundTrip: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const rate = args.distanceUnit === "miles" ? DEFAULT_RATES.miles : DEFAULT_RATES.km;
        const amount = args.distance * rate;

        const id = await ctx.db.insert("mileage", {
            userId: user._id,
            orgId: args.orgId as any,
            date: args.date,
            startLocation: args.startLocation,
            endLocation: args.endLocation,
            distance: args.distance,
            distanceUnit: args.distanceUnit,
            purpose: args.purpose,
            description: args.description,
            vehicle: args.vehicle,
            rate: rate,
            amount: amount,
            isRoundTrip: args.isRoundTrip,
            status: "active",
            tags: args.tags,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});

/**
 * Update a trip
 */
export const updateTrip = mutation({
    args: {
        id: v.id("mileage"),
        date: v.optional(v.number()),
        startLocation: v.optional(v.string()),
        endLocation: v.optional(v.string()),
        distance: v.optional(v.number()),
        purpose: v.optional(v.string()),
        vehicle: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const trip = await ctx.db.get(args.id);

        if (!trip) throw new Error("Trip not found");
        if (trip.userId !== user._id) throw new Error("Unauthorized");

        const updates: any = { ...args, updatedAt: Date.now() };
        delete updates.id;

        // Recalculate amount if distance changes
        if (args.distance !== undefined) {
            updates.amount = args.distance * (trip.rate || DEFAULT_RATES.miles);
        }

        await ctx.db.patch(args.id, updates);
    },
});

/**
 * Delete (archive) a trip
 */
export const deleteTrip = mutation({
    args: {
        id: v.id("mileage"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const trip = await ctx.db.get(args.id);

        if (!trip) throw new Error("Trip not found");
        // Ensure ownership check involves orgId if strictly enforcing multi-tenant
        // For now simplistic user check:
        if (trip.userId !== user._id) throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});
