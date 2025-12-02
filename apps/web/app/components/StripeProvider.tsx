"use client";

/**
 * Stripe Elements Provider
 * Wraps app with Stripe context for future use
 */

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useState, useEffect } from "react";

// Get Stripe publishable key from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function StripeProvider({ children }: { children: ReactNode }) {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [stripeError, setStripeError] = useState(false);

  useEffect(() => {
    // Only load Stripe if key is available
    if (!stripePublishableKey) {
      console.warn("Stripe publishable key not found. Stripe features will be disabled.");
      return;
    }

    // Load Stripe with error handling
    loadStripe(stripePublishableKey)
      .then((stripe) => {
        setStripePromise(stripe);
      })
      .catch((error) => {
        console.error("Failed to load Stripe.js:", error);
        setStripeError(true);
      });
  }, []);

  // If no key or loading error, render children without Stripe
  if (!stripePublishableKey || stripeError) {
    return <>{children}</>;
  }

  // If Stripe not loaded yet, render children (Stripe will initialize asynchronously)
  if (!stripePromise) {
    return <>{children}</>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

