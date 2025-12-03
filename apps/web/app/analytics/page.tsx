"use client";

/**
 * Analytics Page with Sidebar Navigation
 * Business, Personal, and Blended views
 */

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { AnalyticsSidebar } from "./components/AnalyticsSidebar";
import { AddTransactionButton } from "../dashboard/components/AddTransactionButton";
import { MobileTabs } from "./components/MobileTabs";
import { BusinessTab } from "./components/BusinessTab";
import { PersonalTab } from "./components/PersonalTab";
import { BlendedTab } from "./components/BlendedTab";
import { useTransactionFilters } from "./hooks/useTransactionFilters";
import { useBusinessAnalytics, usePersonalAnalytics, useBusinessBurnRate, useBusinessRunway } from "./hooks/useAnalyticsData";
import { getChartData } from "./utils/chartData";
import type { TabType } from "./types";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = (searchParams.get("tab") || "blended") as TabType;

  const handleTabChange = (value: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Query data for all tabs
  const mockAccounts = useQuery(api.plaid.getMockAccounts);
  const allTransactionsRaw = useQuery(api.plaid.getMockTransactions, { limit: 1000 });
  const allAnalytics = useQuery(api.plaid.getMockTransactionAnalytics, { days: 30 });
  
  // Classification stats - temporarily disabled until Convex syncs
  const classificationStats: any = undefined;
  const classificationProgress = classificationStats?.overallClassificationPercent || 0;
  
  // Filter transactions
  const { businessTransactions, personalTransactions, allTransactions } = useTransactionFilters(allTransactionsRaw);
  
  // Calculate analytics
  const businessAnalytics = useBusinessAnalytics(businessTransactions, allAnalytics);
  const personalAnalytics = usePersonalAnalytics(personalTransactions, allAnalytics);
  const blendedAnalytics = allAnalytics;
  const businessBurnRate = useBusinessBurnRate(businessAnalytics);
  const businessRunway = useBusinessRunway(businessBurnRate, mockAccounts);

  // Get transactions and accounts for current view
  const getCurrentData = () => {
    if (activeTab === "business") {
      return {
        transactions: businessTransactions || [],
        analytics: businessAnalytics,
        accounts: mockAccounts?.filter((a: any) => a.isBusiness === true) || [],
      };
    } else if (activeTab === "personal") {
      return {
        transactions: personalTransactions || [],
        analytics: personalAnalytics,
        accounts: mockAccounts?.filter((a: any) => a.isBusiness === false) || [],
      };
    } else {
      return {
        transactions: allTransactions || [],
        analytics: blendedAnalytics,
        accounts: mockAccounts || [],
      };
    }
  };

  const { transactions, analytics, accounts } = getCurrentData();

  // Generate chart data (for business and personal tabs)
  const chartData = activeTab !== "blended" ? getChartData(
    activeTab,
    transactions,
    accounts,
    analytics,
    businessTransactions,
    personalTransactions,
    true,
    true
  ) : null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop only */}
      <AnalyticsSidebar />

      {/* Mobile Tabs - shown on mobile/tablet */}
      <MobileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        classificationProgress={classificationProgress}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Financial Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "business" && "Business-only financial insights"}
              {activeTab === "personal" && "Personal spending and savings"}
              {activeTab === "blended" && "Complete financial picture"}
            </p>
          </div>

          {activeTab === "business" && (
            <BusinessTab
              analytics={businessAnalytics}
              burnRate={businessBurnRate}
              runway={businessRunway}
              chartData={chartData!}
            />
          )}
          {activeTab === "personal" && (
            <PersonalTab
              analytics={personalAnalytics}
              chartData={chartData!}
            />
          )}
          {activeTab === "blended" && (
            <BlendedTab
              blendedAnalytics={blendedAnalytics}
              businessAnalytics={businessAnalytics}
              personalAnalytics={personalAnalytics}
              businessTransactions={businessTransactions}
              personalTransactions={personalTransactions}
              accounts={accounts}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

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
    router.push("/sign-in");
    return null;
  }

  if (!onboardingStatus?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-muted-foreground">Loading...</div>
              </div>
            </div>
          }
        >
          <AnalyticsContent />
        </Suspense>
      </div>
      
      {/* Universal "+" Button */}
      <AddTransactionButton />
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}
