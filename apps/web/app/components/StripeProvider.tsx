"use client";

/**
 * Stripe Elements Provider
 * Wraps app with Stripe context for future use
 */

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

// Get Stripe publishable key from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe only if key is available
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

export function StripeProvider({ children }: { children: ReactNode }) {
  // Only render Elements if Stripe is initialized
  if (!stripePromise) {
    console.warn("Stripe publishable key not found. Stripe features will be disabled.");
    return <>{children}</>;
  }
  
  return <Elements stripe={stripePromise}>{children}</Elements>;
}

