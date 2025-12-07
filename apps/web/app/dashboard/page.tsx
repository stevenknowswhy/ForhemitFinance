"use client";

/**
 * Dashboard Page (Home)
 * Overview of financial health and pending actions
 */

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { OrgRouteGuard } from "../components/OrgRouteGuard";
import { useOrg } from "../contexts/OrgContext";
import MockPlaidLink from "@tests/mocks/components/MockPlaidLink";
import { DashboardCard } from "./components/DashboardCard";
import { AddTransactionButton } from "./components/AddTransactionButton";
import { BottomNavigation } from "../components/BottomNavigation";
import { ThemeToggle } from "../components/ThemeToggle";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { FilterPills, FilterType } from "../components/FilterPills";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Store
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { currentOrgId: orgId, isLoading: isOrgLoading } = useOrg();

  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // Redirect to sign-in if not authenticated (use useEffect to avoid render-time navigation)
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Redirect to onboarding if not completed (use useEffect to avoid render-time navigation)
  // BUT: If orgId exists OR onboarding just completed, onboarding is complete
  // The getOnboardingStatus query might be stale, so trust orgId if it exists
  useEffect(() => {
    // Check if onboarding just completed (sessionStorage flag)
    const justCompletedOnboarding = typeof window !== 'undefined' && sessionStorage.getItem('justCompletedOnboarding') === 'true';

    // Only redirect if we have no org AND onboarding status says not complete
    // AND onboarding didn't just complete (give it time to update)
    // If orgId exists, onboarding is definitely complete (even if query is stale)
    if (onboardingStatus !== undefined && !onboardingStatus.hasCompletedOnboarding && !orgId && !isOrgLoading && !justCompletedOnboarding) {
      // No org and not loading and didn't just complete - definitely need onboarding
      const timeoutId = setTimeout(() => {
        router.push("/onboarding");
      }, 2000); // Increased delay
      return () => clearTimeout(timeoutId);
    }
  }, [onboardingStatus, orgId, isOrgLoading, router]);

  // Get analytics data with filter (Phase 1: Add orgId)
  // Skip query if org is still loading or not available
  const analytics = useQuery(
    api.plaid.getFilteredTransactionAnalytics,
    orgId && !isOrgLoading
      ? {
        days: 30,
        filterType,
        orgId, // Phase 1: Pass orgId
      }
      : "skip"
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  // Check if onboarding just completed (sessionStorage flag)
  const justCompletedOnboarding = typeof window !== 'undefined' && sessionStorage.getItem('justCompletedOnboarding') === 'true';

  // Show loading/redirecting if onboarding not completed
  // BUT: If orgId exists OR onboarding just completed, onboarding IS complete (orgId is source of truth)
  // Only show redirect if we truly have no org AND didn't just complete onboarding
  if (onboardingStatus !== undefined && !onboardingStatus.hasCompletedOnboarding && !orgId && !isOrgLoading && !justCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Redirecting to onboarding...</div>
      </div>
    );
  }

  // If onboarding just completed but orgId not yet available, show loading
  if (justCompletedOnboarding && !orgId && !isOrgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Setting up your account...</div>
      </div>
    );
  }

  // If org is loading or onboarding status is checking, show loading
  if (isOrgLoading || (onboardingStatus === undefined)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">
          {isOrgLoading ? "Loading organization..." : "Checking status..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground hidden lg:block">Financial Pulse</h1>
            <p className="text-muted-foreground">Overview of your last 30 days</p>
          </div>

          <div className="flex items-center gap-4">
            <FilterPills
              value={filterType}
              onChange={setFilterType}
            />
            <div className="hidden lg:block">
              <MockPlaidLink />
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard
            title="Total Spent"
            value={analytics ? `$${analytics.totalSpent.toLocaleString()}` : "..."}
            trend={analytics ? `Avg $${analytics.averageDailySpending}/day` : "Loading..."}
            trendUp={false}
            icon={TrendingDown}
            loading={!analytics}
          />
          <DashboardCard
            title="Total Income"
            value={analytics ? `$${analytics.totalIncome.toLocaleString()}` : "..."}
            trend="Last 30 days"
            trendUp={true}
            icon={TrendingUp}
            loading={!analytics}
          />
          <DashboardCard
            title="Net Cash Flow"
            value={analytics ? `$${analytics.netCashFlow.toLocaleString()}` : "..."}
            trend={analytics && analytics.netCashFlow > 0 ? "Positive" : "Negative"}
            trendUp={analytics ? analytics.netCashFlow > 0 : true}
            icon={DollarSign}
            loading={!analytics}
          />
        </div>

        {/* Marketplace Card */}
        <Link href="/add-ons" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20 hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Marketplace</CardTitle>
                  <CardDescription>
                    Discover and enable add-ons to enhance your financial management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Pending Approvals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Pending Approvals
            </h2>
          </div>

          <ErrorBoundary>
            <ApprovalQueue filterType={filterType} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Universal "+" Button */}
      <AddTransactionButton />

      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <OrgRouteGuard>
      <DashboardContent />
    </OrgRouteGuard>
  );
}
