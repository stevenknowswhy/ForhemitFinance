import { v } from "convex/values";
import { query } from "../_generated/server";

export const getAvailableReports = query({
    args: {
        orgId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. Fetch available reports from templates
        const templates = await ctx.db
            .query("report_templates")
            .withIndex("by_report_type") // Allows filtering if needed, or just collect all
            .collect();

        // 2. Filter by Active
        const activeTemplates = templates.filter((t) => t.isActive !== false);

        // 3. Sort by order
        activeTemplates.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // 4. Enrich with Addon Info (if needed) or Check Entitlement
        // For now, we return all templates. Phase 2 can add entitlement checks based on `addonId`.

        return activeTemplates;
    },
});
