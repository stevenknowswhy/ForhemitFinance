/**
 * Marketplace Registry
 * List and discover available add-ons
 */

import { v } from "convex/values";
import { query } from "./../_generated/server";

/**
 * List all available add-ons for the marketplace
 * Enriches with org-specific entitlement data
 */
export const listAvailableAddons = query({
    args: {
        orgId: v.optional(v.id("organizations")),
        category: v.optional(v.string()),
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let addons;

        // Fetch addons based on search or category
        if (args.search) {
            addons = await ctx.db
                .query("addons")
                .withSearchIndex("search_name", (q) => {
                    let query = q.search("name", args.search!);
                    return query.eq("status", "active");
                })
                .collect();
        } else if (args.category && args.category !== "all") {
            addons = await ctx.db
                .query("addons")
                .withIndex("by_category", (q) => q.eq("category", args.category as any))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();
        } else {
            addons = await ctx.db
                .query("addons")
                .withIndex("by_status", (q) => q.eq("status", "active"))
                .collect();
        }

        // Sort by name
        addons.sort((a, b) => a.name.localeCompare(b.name));

        // If no orgId, return without entitlement info
        if (!args.orgId) {
            return addons.map((addon) => ({
                ...addon,
                entitlement: null,
                isEnabled: false,
            }));
        }

        // Enrich with entitlement and enablement info
        const enrichedAddons = await Promise.all(
            addons.map(async (addon) => {
                // Get entitlement
                const entitlement = await ctx.db
                    .query("org_addons")
                    .withIndex("by_org_addon", (q) =>
                        q.eq("orgId", args.orgId!).eq("addonId", addon._id)
                    )
                    .first();

                // Get enablement status
                const enablement = await ctx.db
                    .query("module_enablements")
                    .withIndex("by_org_module", (q) =>
                        q.eq("orgId", args.orgId!).eq("moduleId", addon.slug)
                    )
                    .first();

                return {
                    ...addon,
                    entitlement: entitlement
                        ? {
                            status: entitlement.status,
                            source: entitlement.source,
                            trialEnd: entitlement.trialEnd,
                            purchasedAt: entitlement.purchasedAt,
                        }
                        : null,
                    isEnabled: enablement?.enabled ?? false,
                };
            })
        );

        return enrichedAddons;
    },
});

/**
 * Get a single addon by slug
 */
export const getAddonBySlug = query({
    args: {
        slug: v.string(),
    },
    handler: async (ctx, args) => {
        const addon = await ctx.db
            .query("addons")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        return addon;
    },
});

/**
 * Get addon categories for filtering
 */
export const getCategories = query({
    args: {},
    handler: async (ctx) => {
        const addons = await ctx.db
            .query("addons")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        // Extract unique categories
        const categories = [...new Set(addons.map((a) => a.category))];

        return categories.map((cat) => ({
            slug: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
            count: addons.filter((a) => a.category === cat).length,
        }));
    },
});
