/**
 * Checkout API Route
 * Creates Stripe checkout session for subscriptions
 * Note: Clerk doesn't have built-in billing, so we use Stripe directly
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    apiVersion: "2025-11-17.clover",
  });
}

// Validate Stripe key is set
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set in environment variables");
}

// Price IDs from Stripe (set these after creating products in Stripe)
const PRICE_IDS = {
  light: {
    monthly: process.env.STRIPE_PRICE_LIGHT_MONTHLY || "price_xxxxx",
    annual: process.env.STRIPE_PRICE_LIGHT_ANNUAL || "price_xxxxx",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_xxxxx",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_xxxxx",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billingPeriod } = await req.json();

    if (!plan || !billingPeriod || !["light", "pro"].includes(plan) || !["monthly", "annual"].includes(billingPeriod)) {
      return NextResponse.json({ error: "Invalid plan or billing period" }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan as "light" | "pro"][billingPeriod as "monthly" | "annual"];

    // Create Stripe checkout session
    const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
      client_reference_id: userId, // Store Clerk user ID for webhook
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId,
          plan,
          billingPeriod,
        },
      },
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/pricing?checkout=cancelled`,
      metadata: {
        userId,
        plan,
        billingPeriod,
      },
      allow_promotion_codes: true, // Allow discount codes
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

