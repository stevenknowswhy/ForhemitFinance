"use client";

/**
 * Stories Page (AI Stories - Phase 2)
 * Placeholder for Forhemit Finance Stories feature
 */

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { BookOpen } from "lucide-react";

export default function StoriesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (!onboardingStatus?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Stories</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-card rounded-lg shadow border border-border p-8 md:p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            AI Stories Coming Soon
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Forhemit Finance Stories will automatically generate three tailored narratives:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Company Story</h3>
              <p className="text-sm text-muted-foreground">
                For internal use - burn rate, trends, cash runway, and recommendations.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Banker Story</h3>
              <p className="text-sm text-muted-foreground">
                For banks and creditors - debt ratios, cash flow reliability, and financial discipline.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Investor Story</h3>
              <p className="text-sm text-muted-foreground">
                For investors - growth indicators, revenue efficiency, and 12-24 month outlook.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}

