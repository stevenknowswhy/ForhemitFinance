/**
 * Transaction action functions
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Remove Plaid transactions (action for webhooks)
 * This action can be called from webhook handlers via ConvexHttpClient
 * It wraps the internal mutation which doesn't require user authentication
 */
export const removePlaidTransactionsByItemId = action({
  args: {
    itemId: v.string(), // Plaid item_id from webhook
    plaidTransactionIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Call the internal mutation which handles authentication via itemId lookup
    await ctx.runMutation(api.transactions.removePlaidTransactions, {
      plaidTransactionIds: args.plaidTransactionIds,
    });

    return { success: true };
  },
});

