/**
 * Plaid Webhook Handler
 * Handles transaction updates and connection status changes from Plaid
 * 
 * Webhook events:
 * - TRANSACTIONS: New or updated transactions
 * - ITEM: Connection status changes (login_required, error, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import crypto from "crypto";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

/**
 * Verify Plaid webhook signature
 * Plaid uses HMAC SHA-256 for webhook verification
 */
function verifyPlaidSignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(body);
    const calculatedSignature = hmac.digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error("Error verifying Plaid webhook signature:", error);
    return false;
  }
}

interface PlaidWebhookEvent {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  environment: string;
  new_transactions?: number;
  removed_transactions?: string[];
  account_ids?: string[];
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("plaid-verification");

    // Get webhook secret from environment
    const webhookSecret = process.env.PLAID_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("PLAID_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature if provided
    if (signature) {
      const isValid = verifyPlaidSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Plaid webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else {
      // In development/sandbox, signature might not be present
      // Log a warning but continue processing
      console.warn("Plaid webhook signature not provided - proceeding without verification");
    }

    const event: PlaidWebhookEvent = JSON.parse(body);
    const convex = getConvexClient();

    // Log webhook event for debugging
    console.log("Plaid webhook received:", {
      type: event.webhook_type,
      code: event.webhook_code,
      item_id: event.item_id,
    });

    // Handle different webhook types
    switch (event.webhook_type) {
      case "TRANSACTIONS": {
        await handleTransactionsWebhook(convex, event);
        break;
      }

      case "ITEM": {
        await handleItemWebhook(convex, event);
        break;
      }

      default:
        console.log(`Unhandled Plaid webhook type: ${event.webhook_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Plaid webhook:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle TRANSACTIONS webhook events
 */
async function handleTransactionsWebhook(
  convex: ConvexHttpClient,
  event: PlaidWebhookEvent
) {
  const { webhook_code, item_id, new_transactions, removed_transactions } = event;

  switch (webhook_code) {
    case "INITIAL_UPDATE":
    case "HISTORICAL_UPDATE":
    case "DEFAULT_UPDATE": {
      // New or updated transactions
      if (new_transactions && new_transactions > 0) {
        console.log(
          `Syncing ${new_transactions} new transactions for item ${item_id}`
        );

        // Trigger transaction sync in Convex
        // This will fetch new transactions from Plaid and process them
        await convex.action(api.plaid.syncTransactionsByItemId, {
          itemId: item_id,
        });
      }
      break;
    }

    case "TRANSACTIONS_REMOVED": {
      // Transactions were removed (e.g., pending transaction was cancelled)
      if (removed_transactions && removed_transactions.length > 0) {
        console.log(
          `Removing ${removed_transactions.length} transactions for item ${item_id}`
        );

        // Mark transactions as removed in Convex using action
        // This doesn't require user authentication - it looks up the user by itemId
        await convex.action(api.transactions.removePlaidTransactionsByItemId, {
          itemId: item_id,
          plaidTransactionIds: removed_transactions,
        });
      }
      break;
    }

    default:
      console.log(`Unhandled TRANSACTIONS webhook code: ${webhook_code}`);
  }
}

/**
 * Handle ITEM webhook events (connection status changes)
 */
async function handleItemWebhook(
  convex: ConvexHttpClient,
  event: PlaidWebhookEvent
) {
  const { webhook_code, item_id, error } = event;

  switch (webhook_code) {
    case "ERROR": {
      // Item has an error (e.g., credentials invalid)
      console.error(`Plaid item ${item_id} has an error:`, error);

      await convex.mutation(api.plaid.updateItemStatus, {
        itemId: item_id,
        status: "error",
        error: error
          ? {
              type: error.error_type,
              code: error.error_code,
              message: error.error_message,
            }
          : undefined,
      });
      break;
    }

    case "PENDING_EXPIRATION": {
      // Item access token is expiring soon
      console.warn(`Plaid item ${item_id} access token expiring soon`);

      await convex.mutation(api.plaid.updateItemStatus, {
        itemId: item_id,
        status: "pending_expiration",
      });
      break;
    }

    case "USER_PERMISSION_REVOKED": {
      // User revoked access to the item
      console.log(`User revoked access to Plaid item ${item_id}`);

      await convex.mutation(api.plaid.updateItemStatus, {
        itemId: item_id,
        status: "permission_revoked",
      });
      break;
    }

    case "WEBHOOK_UPDATE_ACKNOWLEDGED": {
      // Webhook endpoint was updated
      console.log(`Webhook update acknowledged for item ${item_id}`);
      break;
    }

    default:
      console.log(`Unhandled ITEM webhook code: ${webhook_code}`);
  }
}