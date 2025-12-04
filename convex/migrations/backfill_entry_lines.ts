import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const backfill = internalMutation({
    args: {
        cursor: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;

        // Get a batch of entries
        const entries = await ctx.db
            .query("entries_final")
            .paginate({ cursor: args.cursor || null, numItems: limit });

        let updatedCount = 0;

        for (const entry of entries.page) {
            // Get lines for this entry
            const lines = await ctx.db
                .query("entry_lines")
                .withIndex("by_entry", (q) => q.eq("entryId", entry._id))
                .collect();

            for (const line of lines) {
                if (!line.userId || !line.date) {
                    await ctx.db.patch(line._id, {
                        userId: entry.userId,
                        date: entry.date,
                    });
                    updatedCount++;
                }
            }
        }

        return {
            success: true,
            updatedCount,
            continueCursor: entries.continueCursor,
            isDone: entries.isDone
        };
    },
});
