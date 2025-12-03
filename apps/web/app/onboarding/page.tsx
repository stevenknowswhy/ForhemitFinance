"use client";

/**
 * Onboarding Page
 * Collects business type and sets up initial accounts
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { useOrgIdOptional } from "../hooks/useOrgId";
import { useOrg } from "../contexts/OrgContext";

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
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedOrgId, setCompletedOrgId] = useState<string | null>(null);
  const { orgId } = useOrgIdOptional(); // Check if org exists (source of truth)
  const { setCurrentOrg } = useOrg(); // To manually set org after creation

  // Redirect if already onboarded (use useEffect to avoid render-time navigation)
  // Check orgId first (source of truth), then onboarding status
  // But skip redirect if we just completed onboarding (to avoid race condition)
  useEffect(() => {
    // If orgId exists, user is definitely onboarded - redirect immediately
    if (orgId && !justCompleted) {
      const timeoutId = setTimeout(() => {
        router.push("/dashboard");
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    
    // Otherwise check onboarding status
    if (onboardingStatus?.hasCompletedOnboarding && !justCompleted) {
      // Add a delay to allow queries to update
      const timeoutId = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [orgId, onboardingStatus?.hasCompletedOnboarding, justCompleted, router]);

  // After completing onboarding, redirect when:
  // 1. We have the orgId from mutation result AND it's set in context, OR
  // 2. OrgId from context becomes available, OR
  // 3. Status query updates to show complete, OR
  // 4. After a timeout (fallback)
  useEffect(() => {
    if (justCompleted) {
      // Priority 1: Use orgId from mutation result (fastest)
      // Wait a moment to ensure context has updated
      if (completedOrgId) {
        // Give context a moment to update, then redirect
        const timeoutId = setTimeout(() => {
          // Clear the sessionStorage flag before redirecting
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('justCompletedOnboarding');
          }
          router.push("/dashboard");
        }, 800); // Small delay to ensure context state is updated
        return () => clearTimeout(timeoutId);
      }
      
      // Priority 2: If orgId from context exists, redirect immediately
      if (orgId) {
        const timeoutId = setTimeout(() => {
          // Clear the sessionStorage flag before redirecting
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('justCompletedOnboarding');
          }
          router.push("/dashboard");
        }, 500);
        return () => clearTimeout(timeoutId);
      }
      
      // Priority 3: If status query has updated, redirect
      if (onboardingStatus?.hasCompletedOnboarding) {
        const timeoutId = setTimeout(() => {
          // Clear the sessionStorage flag before redirecting
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('justCompletedOnboarding');
          }
          router.push("/dashboard");
        }, 500);
        return () => clearTimeout(timeoutId);
      }
      
      // Fallback: After 2 seconds, redirect anyway (mutation completed successfully)
      const fallbackTimeout = setTimeout(() => {
        // Clear the sessionStorage flag before redirecting
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('justCompletedOnboarding');
        }
        router.push("/dashboard");
      }, 2000);
      
      return () => clearTimeout(fallbackTimeout);
    }
  }, [justCompleted, completedOrgId, onboardingStatus?.hasCompletedOnboarding, orgId, router]);

  // Show loading while checking onboarding status
  if (onboardingStatus === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render form if already onboarded (redirect will happen via useEffect)
  // Also check orgId as source of truth (from context or mutation result)
  // But if we just completed, show a success message
  // IMPORTANT: If user has orgId, they're already onboarded - redirect immediately
  if (orgId || onboardingStatus?.hasCompletedOnboarding || completedOrgId || justCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">
            {justCompleted ? "Setting up your account..." : "Redirecting..."}
          </div>
          {justCompleted && (
            <div className="text-sm text-muted-foreground">
              This will just take a moment...
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType) return;

    setIsLoading(true);
    try {
      const result = await completeOnboarding({
        businessType: businessType as any,
      });
      
      // Store the orgId from the mutation result for immediate use
      if (result?.orgId) {
        setCompletedOrgId(result.orgId);
        
        // Immediately set orgId in context and localStorage
        // This bypasses the query dependency and prevents redirect loop
        await setCurrentOrg(result.orgId);
        
        // Set sessionStorage flag to indicate onboarding just completed
        // This gives OrgRouteGuard more time before redirecting
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('justCompletedOnboarding', 'true');
        }
      }
      
      // Mark as just completed - the query will automatically update
      // and the useEffect will handle the redirect once status updates
      setJustCompleted(true);
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

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

