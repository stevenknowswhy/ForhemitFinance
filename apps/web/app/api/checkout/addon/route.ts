/**
 * Add-on Checkout API Route
 * Creates Stripe checkout session for add-on purchases
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

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId, addonId, addonSlug, priceId, promotionId, successUrl, cancelUrl } =
            await req.json();

        if (!orgId || !addonId || !priceId) {
            return NextResponse.json(
                { error: "Missing required fields: orgId, addonId, priceId" },
                { status: 400 }
            );
        }

        const stripe = getStripe();

        // Build checkout session params
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            client_reference_id: userId,
            mode: "payment", // One-time payment for add-ons
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url:
                successUrl ||
                `${req.nextUrl.origin}/add-ons?checkout=success&addon=${addonSlug}`,
            cancel_url:
                cancelUrl ||
                `${req.nextUrl.origin}/add-ons?checkout=cancelled&addon=${addonSlug}`,
            metadata: {
                userId,
                orgId,
                addonId,
                addonSlug: addonSlug || "",
                promotionId: promotionId || "",
                type: "addon_purchase",
            },
            allow_promotion_codes: true,
        };

        // If promotionId maps to a Stripe coupon, apply it
        // Note: This requires the campaign to have a stripeCouponId set
        // For now, we rely on allow_promotion_codes

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({
            url: session.url,
            sessionId: session.id,
        });
    } catch (error: any) {
        console.error("Error creating add-on checkout session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
