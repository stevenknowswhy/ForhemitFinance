/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    apiVersion: "2025-11-17.clover",
  });
}

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  const stripe = getStripe();
  const convex = getConvexClient();
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan as "light" | "pro";
      const billingPeriod = session.metadata?.billingPeriod as "monthly" | "annual";

      if (userId && plan) {
        // Update user subscription in Convex
        await convex.mutation(api.subscriptions.updateSubscription, {
          tier: plan,
          billingPeriod,
          subscriptionStatus: "trial", // Starts as trial
          trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const plan = subscription.metadata?.plan as "light" | "pro";
      const billingPeriod = subscription.metadata?.billingPeriod as "monthly" | "annual";

      if (userId && plan) {
        const isTrial = subscription.status === "trialing";
        const trialEndsAt = subscription.trial_end
          ? subscription.trial_end * 1000
          : undefined;

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = customer.deleted ? undefined : customer.email;

        await convex.mutation(api.subscriptions.updateSubscription, {
          email: customerEmail || undefined,
          tier: plan,
          billingPeriod,
          subscriptionStatus: isTrial ? "trial" : "active",
          trialEndsAt,
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = customer.deleted ? undefined : customer.email;

        // Downgrade to free tier
        await convex.mutation(api.subscriptions.updateSubscription, {
          email: customerEmail || undefined,
          tier: "solo",
          subscriptionStatus: "cancelled",
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | null;
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan as "light" | "pro";

        if (userId && plan) {
          // Get customer email from Stripe
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          const customerEmail = customer.deleted ? undefined : customer.email;

          // Payment succeeded - activate subscription
          await convex.mutation(api.subscriptions.updateSubscription, {
            email: customerEmail || undefined,
            tier: plan,
            subscriptionStatus: "active",
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | null;
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Get customer email from Stripe
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          const customerEmail = customer.deleted ? undefined : customer.email;

          // Payment failed - mark as past_due
          await convex.mutation(api.subscriptions.updateSubscription, {
            email: customerEmail || undefined,
            tier: subscription.metadata?.plan as "light" | "pro",
            subscriptionStatus: "past_due",
          });
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

