"use client";

/**
 * Dashboard Page (Home)
 * Mobile-first simplified dashboard with 3 essential cards
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavigation } from "../components/DesktopNavigation";
import MockPlaidLink from "../components/MockPlaidLink";
import { DashboardCard } from "./components/DashboardCard";
import { AddTransactionButton } from "./components/AddTransactionButton";
import { BottomNavigation } from "../components/BottomNavigation";
import { ThemeToggle } from "../components/ThemeToggle";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  
  // Query analytics for dashboard cards
  const mockAnalytics = useQuery(api.plaid.getMockTransactionAnalytics, { days: 30 });

  // Calculate burn rate (average monthly net spend)
  const burnRate = useMemo(() => {
    if (!mockAnalytics) return 0;
    // Burn rate = average monthly net cash flow (negative = burning cash)
    return mockAnalytics.netCashFlow;
  }, [mockAnalytics]);

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
    return null; // Will redirect to onboarding
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header - Hidden on desktop */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-foreground">
            {user.firstName || "Dashboard"}
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MockPlaidLink />
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Simplified Dashboard - 3 Essential Cards */}
        {mockAnalytics && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Your Financial Pulse
              </h2>
              <p className="text-sm text-muted-foreground">
                A quick snapshot of your financial health
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <DashboardCard
                title="Total Income (This Month)"
                value={`$${mockAnalytics.totalIncome.toLocaleString()}`}
                valueClassName="text-green-600 dark:text-green-400"
                tooltip="Your total money earned this month. This includes all income transactions."
              />
              <DashboardCard
                title="Total Expenses (This Month)"
                value={`$${mockAnalytics.totalSpent.toLocaleString()}`}
                valueClassName="text-red-600 dark:text-red-400"
                tooltip="Everything you spent this month — business & personal, unless filtered."
              />
              <DashboardCard
                title="Burn Rate"
                value={`$${Math.abs(burnRate).toLocaleString()}`}
                subtitle={burnRate < 0 ? "Burning cash" : "Positive cash flow"}
                valueClassName={burnRate < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                tooltip="Your average monthly net spend. If it's negative, you're burning cash. If it's positive, you're generating cash flow."
              />
            </div>
          </div>
        )}

        {!mockAnalytics && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No financial data yet. Connect a bank account to get started!
            </p>
            <MockPlaidLink />
          </div>
        )}
      </div>
      
      {/* Universal "+" Button */}
      <AddTransactionButton />
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}
