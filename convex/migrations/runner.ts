import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const runBackfill = internalAction({
    args: {},
    handler: async (ctx) => {
        let isDone = false;
        let cursor: string | undefined = undefined;
        let totalUpdated = 0;
        let batch = 0;

        while (!isDone) {
            console.log(`Running batch ${batch}...`);
            const result: any = await ctx.runMutation(internal.migrations.backfill_entry_lines.backfill, {
                cursor,
                limit: 500,
            });

            const updatedCount = result.updatedCount;
            totalUpdated += updatedCount;
            cursor = result.continueCursor;
            isDone = result.isDone;

            console.log(`Batch ${batch} done. Updated: ${updatedCount}. Total: ${totalUpdated}`);
            batch++;
        }

        return { success: true, totalUpdated };
    },
});
