/**
 * Marketplace Checkout
 * Convex action to initiate Stripe checkout for add-ons
 */

import { v } from "convex/values";
import { action } from "./../_generated/server";

/**
 * Create a checkout session for an add-on purchase
 * Returns the URL to redirect the user to Stripe
 */
export const createCheckoutSession = action({
    args: {
        orgId: v.id("organizations"),
        addonId: v.id("addons"),
        successUrl: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ sessionUrl: string }> => {
        // Get addon details
        const addon = await ctx.runQuery(
            // @ts-ignore - internal reference
            "addons:getAddonById" as any,
            { id: args.addonId }
        );

        if (!addon) {
            throw new Error("Addon not found");
        }

        if (addon.isFree) {
            throw new Error("Cannot checkout a free addon. Use enableFreeAddon instead.");
        }

        if (!addon.stripePriceId) {
            throw new Error("Addon does not have a Stripe price configured");
        }

        // For now, return a placeholder that the frontend will use to call the API route
        // The actual Stripe session is created in the Next.js API route for security
        return {
            sessionUrl: `/api/checkout/addon?orgId=${args.orgId}&addonId=${args.addonId}&priceId=${addon.stripePriceId}&slug=${addon.slug}`,
        };
    },
});

/**
 * Start a trial for an add-on
 */
export const startTrial = action({
    args: {
        orgId: v.id("organizations"),
        addonId: v.id("addons"),
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        await ctx.runMutation(
            // @ts-ignore - using internal API
            "addons:startAddonTrial" as any,
            { orgId: args.orgId.toString(), addonId: args.addonId }
        );

        return { success: true };
    },
});
