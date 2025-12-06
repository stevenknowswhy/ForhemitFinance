/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

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

      // Check if this is an add-on purchase
      if (session.metadata?.addonId) {
        const orgId = session.metadata.orgId;
        const addonId = session.metadata.addonId;
        const promotionId = session.metadata.promotionId || undefined;
        const paymentIntentId = session.payment_intent as string;

        if (orgId && addonId) {
          await convex.mutation(api.addons.activateAddonPurchase, {
            orgId: orgId as any,
            addonId: addonId as any,
            promotionId: promotionId ? (promotionId as any) : undefined,
            checkoutSessionId: session.id,
            paymentIntentId: paymentIntentId || "",
          });
        }
      } else {
        // Handle subscription checkout
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = session.metadata?.plan as "light" | "pro";
        const billingPeriod = session.metadata?.billingPeriod as "monthly" | "annual";

        if (userId && plan) {
          // TODO: Implement subscription update
          // Need to look up planId from tier name
          // await convex.mutation(api.subscriptions.updateOrgSubscriptionInternal, {
          //   orgId: ...,
          //   planId: ...,
          //   status: "trialing",
          //   trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
          // });
          console.log('Checkout completed for user:', userId, 'plan:', plan);
        }
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

        // TODO: Implement subscription update
        // Need to look up orgId and planId
        console.log('Subscription updated:', { userId, plan, isTrial, customerEmail });
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
        // TODO: Implement subscription cancellation
        console.log('Subscription cancelled for user:', userId);
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
          // TODO: Implement subscription activation
          console.log('Payment succeeded for user:', userId, 'plan:', plan);
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
          // TODO: Implement subscription past_due status
          console.log('Payment failed for user:', userId);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // For add-on purchases, metadata is on the checkout session, not payment intent
      // We need to retrieve the checkout session from the payment intent
      if (paymentIntent.metadata?.checkout_session_id) {
        try {
          const session = await stripe.checkout.sessions.retrieve(
            paymentIntent.metadata.checkout_session_id as string
          );

          if (session.metadata?.addonId) {
            const orgId = session.metadata.orgId;
            const addonId = session.metadata.addonId;
            const failureReason = paymentIntent.last_payment_error?.message;

            if (orgId && addonId) {
              await convex.mutation(api.addons.handlePaymentFailure, {
                orgId: orgId as any,
                addonId: addonId as any,
                paymentIntentId: paymentIntent.id,
                failureReason: failureReason || undefined,
              });
            }
          }
        } catch (error) {
          console.error("Error retrieving checkout session:", error);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

