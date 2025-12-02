/**
 * Account syncing and management
 */

import { v } from "convex/values";
import { mutation, action } from "../_generated/server";
import { api } from "../_generated/api";
import { getPlaidClient } from "./sdk";

/**
 * Sync accounts from Plaid
 * Creates/updates account records
 */
export const syncAccounts = action({
  args: {
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const institution = await ctx.runQuery(api.plaid.getInstitution, {
      institutionId: args.institutionId,
    });

    if (!institution) {
      throw new Error("Institution not found");
    }

    const plaidClient = await getPlaidClient();

    if (!plaidClient) {
      throw new Error("Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.");
    }

    try {
      // Get accounts from Plaid
      const accountsResponse = await plaidClient.accountsGet({
        access_token: institution.accessTokenEncrypted,
      });

      const plaidAccounts = accountsResponse.data.accounts;

      // Create/update accounts
      for (const account of plaidAccounts) {
        // Map Plaid account type to our account type
        let accountType: "asset" | "liability" = "asset";
        if (account.type === "credit" || account.type === "loan") {
          accountType = "liability";
        }

        await ctx.runMutation(api.plaid.upsertAccount, {
          institutionId: args.institutionId,
          plaidAccountId: account.account_id,
          name: account.name,
          type: accountType,
          balance: account.balances.current || 0,
          mask: account.mask || undefined,
          subtype: account.subtype || undefined,
        });
      }

      // Trigger transaction sync
      await ctx.scheduler.runAfter(0, api.plaid.syncTransactions, {
        institutionId: args.institutionId,
      });

      return { success: true, accountCount: plaidAccounts.length };
    } catch (error: any) {
      console.error("Error syncing accounts:", error);
      const errorMessage = error.response?.data?.error_message || error.message || "Unknown error";

      // Update institution status to error
      await ctx.runMutation(api.plaid.updateInstitutionStatus, {
        institutionId: args.institutionId,
        status: "error",
      });

      throw new Error(`Failed to sync accounts: ${errorMessage}`);
    }
  },
});

/**
 * Upsert account record
 */
export const upsertAccount = mutation({
  args: {
    institutionId: v.id("institutions"),
    plaidAccountId: v.string(),
    name: v.string(),
    type: v.union(v.literal("asset"), v.literal("liability")),
    balance: v.number(),
    mask: v.optional(v.string()),
    subtype: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const institution = await ctx.db.get(args.institutionId);
    if (!institution) {
      throw new Error("Institution not found");
    }

    // Check if account already exists
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", institution.userId))
      .filter((q: any) => q.eq(q.field("plaidAccountId"), args.plaidAccountId))
      .first();

    if (existing) {
      // Update existing account
      await ctx.db.patch(existing._id, {
        name: args.name,
        balance: args.balance,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new account
      const accountId = await ctx.db.insert("accounts", {
        userId: institution.userId,
        name: args.name,
        type: args.type,
        isBusiness: true,
        plaidAccountId: args.plaidAccountId,
        institutionId: args.institutionId,
        balance: args.balance,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return accountId;
    }
  },
});

