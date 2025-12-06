/**
 * Plaid Link token creation and public token exchange
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { getPlaidClient, loadPlaidSDK } from "./sdk";

/**
 * Create a Plaid Link token for the frontend
 * This token is used to initialize Plaid Link
 */
export const createLinkToken = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const plaidClient = await getPlaidClient();

    if (!plaidClient) {
      throw new Error("Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.");
    }

    const plaidSDK = await loadPlaidSDK();
    if (!plaidSDK) {
      throw new Error("Plaid SDK not available");
    }

    try {
      const { Products, CountryCode } = plaidSDK;
      const request = {
        user: {
          client_user_id: user._id,
        },
        client_name: "EZ Financial",
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us],
        language: "en",
      };

      const response = await plaidClient.linkTokenCreate(request);
      return { linkToken: response.data.link_token };
    } catch (error: any) {
      console.error("Error creating Plaid link token:", error);
      const errorMessage = error.response?.data?.error_message || error.message || "Unknown error";
      throw new Error(`Failed to create link token: ${errorMessage}`);
    }
  },
});

/**
 * Exchange Plaid public token for access token
 * Called after user completes Plaid Link flow
 * Phase 1: Updated to use org context
 */
export const exchangePublicToken = action({
  args: {
    publicToken: v.string(),
    institutionId: v.string(),
    institutionName: v.string(),
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId parameter
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Phase 1: Get org context
    const orgContext = await ctx.runQuery(api.helpers.index.getOrgContextQuery, {
      orgId: args.orgId,
    });
    if (!orgContext) {
      throw new Error("Organization context required");
    }

    const plaidClient = await getPlaidClient();

    if (!plaidClient) {
      throw new Error("Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.");
    }

    try {
      // Exchange public token for access token
      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token: args.publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Store institution connection
      const institutionId = await ctx.runMutation(api.plaid.storeInstitution, {
        plaidItemId: itemId,
        plaidInstitutionId: args.institutionId,
        name: args.institutionName,
        accessTokenEncrypted: accessToken, // TODO: Encrypt this in production
        orgId: orgContext.orgId, // Phase 1: Pass orgId
      });

      // Trigger initial account and transaction sync
      await ctx.scheduler.runAfter(0, api.plaid.syncAccounts, {
        institutionId,
      });

      return { institutionId, success: true };
    } catch (error: any) {
      console.error("Error exchanging public token:", error);
      const errorMessage = error.response?.data?.error_message || error.message || "Unknown error";
      throw new Error(`Failed to connect bank: ${errorMessage}`);
    }
  },
});

