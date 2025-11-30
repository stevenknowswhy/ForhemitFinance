"use client";

/**
 * Onboarding Page
 * Collects business type and sets up initial accounts
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";

const BUSINESS_TYPES = [
  { value: "creator", label: "Creator (Video, Design, Writing, Coaching)" },
  { value: "tradesperson", label: "Tradesperson (Handyman, Electrician, etc.)" },
  { value: "wellness", label: "Health & Wellness (Trainer, Therapist, etc.)" },
  { value: "tutor", label: "Tutor or Educator" },
  { value: "real_estate", label: "Real Estate Agent" },
  { value: "agency", label: "Small Agency or Studio" },
  { value: "other", label: "Other" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  // Redirect if already onboarded
  if (onboardingStatus?.hasCompletedOnboarding) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType) return;

    setIsLoading(true);
    try {
      await completeOnboarding({
        businessType: businessType as any,
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (onboardingStatus === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to EZ Financial!</h1>
          <p className="text-muted-foreground mb-8">
            Let's get your bookkeeping set up. This will only take a minute.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                What type of business are you running?
              </label>
              <div className="space-y-2">
                {BUSINESS_TYPES.map((type: any) => (
                  <label
                    key={type.value}
                    className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors bg-background"
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={type.value}
                      checked={businessType === type.value}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!businessType || isLoading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Setting up..." : "Continue"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              We'll create a default chart of accounts based on your business type. 
              You can customize these later in settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

