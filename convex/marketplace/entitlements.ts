/**
 * Marketplace Entitlements
 * Check and enforce add-on access for organizations
 */

import { v } from "convex/values";
import { query, QueryCtx, MutationCtx, ActionCtx } from "./../_generated/server";
import { Id } from "./../_generated/dataModel";

/**
 * Check if an organization has access to a specific module/addon
 */
export const checkAccess = query({
    args: {
        orgId: v.id("organizations"),
        moduleSlug: v.string(),
    },
    handler: async (ctx, args): Promise<{ hasAccess: boolean; reason: string }> => {
        // 1. Check module_enablements (Is it turned on?)
        const enablement = await ctx.db
            .query("module_enablements")
            .withIndex("by_org_module", (q) =>
                q.eq("orgId", args.orgId).eq("moduleId", args.moduleSlug)
            )
            .first();

        if (!enablement || !enablement.enabled) {
            return { hasAccess: false, reason: "Module is not enabled for this organization" };
        }

        // 2. Check org_addons (Is it purchased/trialing?)
        // First, find the addon by slug
        const addon = await ctx.db
            .query("addons")
            .withIndex("by_slug", (q) => q.eq("slug", args.moduleSlug))
            .first();

        if (!addon) {
            // If addon doesn't exist in registry, check if it's a free core module
            // For now, assume if no addon record, it's a core module (free access)
            return { hasAccess: true, reason: "Core module" };
        }

        if (addon.isFree) {
            return { hasAccess: true, reason: "Free module" };
        }

        // Check entitlement for paid modules
        const entitlement = await ctx.db
            .query("org_addons")
            .withIndex("by_org_addon", (q) =>
                q.eq("orgId", args.orgId).eq("addonId", addon._id)
            )
            .first();

        if (!entitlement) {
            return { hasAccess: false, reason: "No entitlement found" };
        }

        // Check status
        if (entitlement.status === "active") {
            return { hasAccess: true, reason: "Active subscription" };
        }

        if (entitlement.status === "trialing") {
            // Check if trial is still valid
            if (entitlement.trialEnd && entitlement.trialEnd > Date.now()) {
                return { hasAccess: true, reason: "Active trial" };
            }
            return { hasAccess: false, reason: "Trial expired" };
        }

        return { hasAccess: false, reason: `Entitlement status: ${entitlement.status}` };
    },
});

/**
 * Get all entitlements for an organization
 * Used by FeatureProvider to bulk-load enabled features
 */
export const getOrgEntitlements = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // Get all enabled modules
        const enablements = await ctx.db
            .query("module_enablements")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.eq(q.field("enabled"), true))
            .collect();

        // Get all org_addons
        const orgAddons = await ctx.db
            .query("org_addons")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        // Get all addons for enrichment
        const addonIds = orgAddons.map((oa) => oa.addonId);
        const addons = await Promise.all(addonIds.map((id) => ctx.db.get(id)));
        const addonMap = new Map(addons.filter(Boolean).map((a) => [a!._id, a!]));

        // Combine into a unified view
        const entitlements = enablements.map((e) => {
            const addon = [...addonMap.values()].find((a) => a.slug === e.moduleId);
            const orgAddon = addon ? orgAddons.find((oa) => oa.addonId === addon._id) : null;

            return {
                moduleSlug: e.moduleId,
                enabled: e.enabled,
                status: orgAddon?.status || "free",
                trialEnd: orgAddon?.trialEnd,
                isFree: addon?.isFree ?? true,
            };
        });

        return entitlements;
    },
});

/**
 * Internal helper: Require addon access or throw error
 * Use this in mutations/queries that require a specific addon
 * 
 * Usage:
 *   await requireAddon(ctx, orgId, "project_profitability");
 */
export async function requireAddon(
    ctx: QueryCtx | MutationCtx,
    orgId: Id<"organizations">,
    moduleSlug: string
): Promise<void> {
    // 1. Check module_enablements
    const enablement = await ctx.db
        .query("module_enablements")
        .withIndex("by_org_module", (q) =>
            q.eq("orgId", orgId).eq("moduleId", moduleSlug)
        )
        .first();

    if (!enablement || !enablement.enabled) {
        throw new Error(`Access denied: Module "${moduleSlug}" is not enabled for this organization`);
    }

    // 2. Find addon
    const addon = await ctx.db
        .query("addons")
        .withIndex("by_slug", (q) => q.eq("slug", moduleSlug))
        .first();

    // If no addon record, assume core module
    if (!addon) {
        return; // Core module, access granted
    }

    // Free modules always accessible if enabled
    if (addon.isFree) {
        return;
    }

    // 3. Check entitlement for paid modules
    const entitlement = await ctx.db
        .query("org_addons")
        .withIndex("by_org_addon", (q) =>
            q.eq("orgId", orgId).eq("addonId", addon._id)
        )
        .first();

    if (!entitlement) {
        throw new Error(`Access denied: No entitlement for addon "${moduleSlug}"`);
    }

    if (entitlement.status === "active") {
        return; // Active subscription
    }

    if (entitlement.status === "trialing") {
        if (entitlement.trialEnd && entitlement.trialEnd > Date.now()) {
            return; // Trial still valid
        }
        throw new Error(`Access denied: Trial for "${moduleSlug}" has expired`);
    }

    throw new Error(`Access denied: Entitlement status is "${entitlement.status}"`);
}
