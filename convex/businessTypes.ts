/**
 * Business Type Queries
 * GAP-002: Replaces hardcoded BUSINESS_TYPES from onboarding/page.tsx
 */

import { query } from "./_generated/server";

/**
 * Get all active business types for onboarding
 */
export const getActiveBusinessTypes = query({
    args: {},
    handler: async (ctx) => {
        const businessTypes = await ctx.db
            .query("business_type_configs")
            .withIndex("by_active", (q: any) => q.eq("isActive", true))
            .collect();

        // Sort by order
        businessTypes.sort((a, b) => a.order - b.order);

        return businessTypes.map((bt) => ({
            value: bt.slug,
            label: bt.displayName,
            description: bt.description,
            icon: bt.icon,
        }));
    },
});
