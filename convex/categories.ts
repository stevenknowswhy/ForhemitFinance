/**
 * Category Set Queries
 * GAP-003: Replaces hardcoded DEFAULT_CATEGORIES from CategorySelector.tsx
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get default category set for a business type
 * Falls back to the default "General" set if no specific set exists
 */
export const getDefaultCategorySet = query({
    args: {
        businessType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // First try to find a set specifically for this business type
        if (args.businessType) {
            const allSets = await ctx.db.query("default_category_sets").collect();
            const specificSet = allSets.find(
                (set) => set.businessTypes?.includes(args.businessType!)
            );
            if (specificSet) {
                return specificSet.categories;
            }
        }

        // Fall back to the default set
        const defaultSet = await ctx.db
            .query("default_category_sets")
            .withIndex("by_default", (q: any) => q.eq("isDefault", true))
            .first();

        if (defaultSet) {
            return defaultSet.categories;
        }

        // Ultimate fallback: return empty array (frontend should handle this)
        return [];
    },
});
