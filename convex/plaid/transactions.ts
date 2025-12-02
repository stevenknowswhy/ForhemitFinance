/**
 * Transaction syncing from Plaid
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { getPlaidClient } from "./sdk";

/**
 * Sync transactions from Plaid
 * Fetches new transactions and creates proposed entries
 */
export const syncTransactions = action({
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

    // Get last sync time (default to 90 days ago for first sync)
    const lastSync = institution.lastSyncAt || Date.now() - 90 * 24 * 60 * 60 * 1000;
    const startDate = new Date(lastSync);
    startDate.setDate(startDate.getDate() - 1); // Add 1 day buffer
    const endDate = new Date();

    const plaidClient = await getPlaidClient();

    if (!plaidClient) {
      throw new Error("Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.");
    }

    try {
      // Get user's accounts for this institution
      const accounts = await ctx.runQuery(api.accounts.getByInstitution, {
        institutionId: args.institutionId,
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found for institution");
      }

      // Fetch transactions from Plaid with retry logic
      let transactionsResponse;
      let retries = 3;
      let lastError: any;

      while (retries > 0) {
        try {
          transactionsResponse = await plaidClient.transactionsGet({
            access_token: institution.accessTokenEncrypted,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            account_ids: accounts.map((a: any) => a.plaidAccountId).filter((id: any): id is string => !!id),
          } as any);
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          retries--;
          if (retries > 0) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }

      if (!transactionsResponse) {
        throw lastError || new Error("Failed to fetch transactions after retries");
      }

      const plaidTransactions = transactionsResponse.data.transactions;
      let importedCount = 0;

      // Process each transaction
      for (const txn of plaidTransactions) {
        const account = accounts.find((a: any) => a.plaidAccountId === txn.account_id);
        if (!account) continue;

        // Check if transaction already exists
        const existing = await ctx.runQuery(api.transactions.getByPlaidId, {
          plaidTransactionId: txn.transaction_id,
        });

        if (existing) continue; // Skip duplicates

        // Create raw transaction
        const transactionId = await ctx.runMutation(api.transactions.createRaw, {
          accountId: account._id,
          plaidTransactionId: txn.transaction_id,
          amount: txn.amount,
          date: txn.date,
          merchant: txn.merchant_name || undefined,
          description: txn.name,
          category: txn.category || undefined,
          status: txn.pending ? "pending" : "posted",
        });

        // Process transaction to generate proposed entry
        await ctx.runMutation(api.transactions.processTransaction, {
          transactionId,
        });

        importedCount++;
      }

      // Update last sync time
      await ctx.runMutation(api.plaid.updateLastSync, {
        institutionId: args.institutionId,
      });

      return { success: true, count: importedCount, total: plaidTransactions.length };
    } catch (error: any) {
      console.error("Error syncing transactions:", error);
      const errorMessage = error.response?.data?.error_message || error.message || "Unknown error";

      // Update institution status to error
      await ctx.runMutation(api.plaid.updateInstitutionStatus, {
        institutionId: args.institutionId,
        status: "error",
      });

      throw new Error(`Failed to sync transactions: ${errorMessage}`);
    }
  },
});

