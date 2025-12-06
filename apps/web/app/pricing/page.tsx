"use client";

/**
 * Pricing Page
 * Shows subscription tiers with Clerk billing integration
 */

import { Header } from "../components/Header";
import Link from "next/link";
import { SocialProof } from "@/components/SocialProof";
import { FAQ } from "@/components/FAQ";
import { SiteFooter } from "@/components/SiteFooter";
import { useUser } from "@clerk/nextjs"; import { useState } from "react";

const PRICING_PLANS = {
  light: {
    name: "Light",
    monthlyPrice: 1999, // $19.99 in cents
    annualPrice: 15992, // $159.92 in cents (20% off $199.88)
    monthlyPriceDisplay: "$19.99",
    annualPriceDisplay: "$159.92",
    monthlyPricePerMonth: "$19.99",
    annualPricePerMonth: "$13.33",
    features: [
      "Single user",
      "Burn rate & runway tracking",
      "AI monthly narrative",
      "Investor export pack",
      "Mobile app access",
      "Basic transaction categorization",
      "Up to 5 bank accounts",
    ],
    clerkPriceId: {
      monthly: "price_light_monthly", // Will be set in Clerk dashboard
      annual: "price_light_annual",
    },
  },
  pro: {
    name: "Pro",
    monthlyPrice: 2999, // $29.99 in cents
    annualPrice: 23992, // $239.92 in cents (20% off $299.88)
    monthlyPriceDisplay: "$29.99",
    annualPriceDisplay: "$239.92",
    monthlyPricePerMonth: "$29.99",
    annualPricePerMonth: "$19.99",
    features: [
      "Everything in Light",
      "Up to 10 users",
      "Advanced forecasting",
      "Multi-goal tracking",
      "Team expense controls",
      "Priority support",
      "Unlimited bank accounts",
      "Advanced AI insights",
      "Custom KPI dashboards",
    ],
    clerkPriceId: {
      monthly: "price_pro_monthly", // Will be set in Clerk dashboard
      annual: "price_pro_annual",
    },
  },
};

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<"light" | "pro" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: "light" | "pro") => {
    if (!user) {
      // Redirect to sign up
      window.location.href = "/sign-up?redirect=/pricing";
      return;
    }

    setSelectedPlan(plan);
    setIsLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Error starting checkout:", error);
      setError(error.message || "Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Simple Pricing for Startups</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free. Upgrade as you grow. All plans include a 14-day free trial.
          </p>

          {error && (
            <div className="mb-6 max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingPeriod === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${billingPeriod === "annual" ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
            <span className={`text-sm ${billingPeriod === "annual" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Annual
              <span className="ml-1 text-green-500 dark:text-green-400">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Light Plan */}
          <div className="bg-card rounded-lg shadow-lg p-8 border-2 border-border">
            <h3 className="text-2xl font-bold mb-2 text-foreground">Light</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">
                {billingPeriod === "monthly"
                  ? PRICING_PLANS.light.monthlyPriceDisplay
                  : PRICING_PLANS.light.annualPriceDisplay}
              </span>
              <span className="text-muted-foreground">/{billingPeriod === "monthly" ? "month" : "year"}</span>
              {billingPeriod === "annual" && (
                <p className="text-sm text-muted-foreground mt-1">
                  {PRICING_PLANS.light.annualPricePerMonth} per month
                </p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {PRICING_PLANS.light.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("light")}
              disabled={isLoading && selectedPlan === "light"}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && selectedPlan === "light" ? "Processing..." : "Start 14-Day Free Trial"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              No credit card required for trial
            </p>
          </div>

          {/* Pro Plan - Most Popular */}
          <div className="bg-card rounded-lg shadow-lg p-8 border-4 border-primary relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">
                {billingPeriod === "monthly"
                  ? PRICING_PLANS.pro.monthlyPriceDisplay
                  : PRICING_PLANS.pro.annualPriceDisplay}
              </span>
              <span className="text-muted-foreground">/{billingPeriod === "monthly" ? "month" : "year"}</span>
              {billingPeriod === "annual" && (
                <p className="text-sm text-muted-foreground mt-1">
                  {PRICING_PLANS.pro.annualPricePerMonth} per month
                </p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {PRICING_PLANS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("pro")}
              disabled={isLoading && selectedPlan === "pro"}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && selectedPlan === "pro" ? "Processing..." : "Start 14-Day Free Trial"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              No credit card required for trial
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. Cancel anytime during the trial with no charges.
          </p>
          <p className="text-sm text-muted-foreground">
            Need help choosing? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
          </p>
        </div>
      </div>

      <SocialProof />
      <FAQ />
      <SiteFooter />
    </div>
  );
}

