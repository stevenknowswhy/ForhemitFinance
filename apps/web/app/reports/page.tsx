"use client";

/**
 * Insights Page
 * Sidebar navigation system: Stories, Reports, Goals
 */

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { ReportsSidebar } from "./components/ReportsSidebar";
import { BookOpen, FileText, Target, Store, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportsTab } from "./components/ReportsTab";
import { StoriesTab } from "./components/StoriesTab";
import { GoalsTab } from "./components/GoalsTab";
import { useModuleStatuses } from "@/hooks/useEnabledModules";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { modules: moduleStatuses } = useModuleStatuses();
  
  // Get enabled modules (must pass all three checks)
  const enabledModules = moduleStatuses.filter(
    (moduleStatus) =>
      moduleStatus.isOrgEnabled &&
      moduleStatus.isUserEnabled &&
      moduleStatus.hasEntitlement
  );
  
  // Check if specific modules are enabled
  const storiesEnabled = enabledModules.some((m) => m.manifest.id === "stories");
  const reportsEnabled = enabledModules.some((m) => m.manifest.id === "reports");
  
  // Determine default tab (always default to Insights)
  const getDefaultTab = () => {
    return "reports"; // Always default to Insights tab
  };
  
  const activeTab = searchParams.get("tab") || getDefaultTab();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build available tabs based on enabled modules
  // Insights tab is always shown, even if no modules are enabled
  const availableTabs = [
    ...(storiesEnabled ? [{ id: "stories", label: "Stories", icon: BookOpen }] : []),
    { id: "reports", label: "Insights", icon: FileText }, // Always show Insights tab
    { id: "goals", label: "Goals", icon: Target }, // Goals is always available (core feature)
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop only */}
      <ReportsSidebar />

      {/* Mobile Tabs - shown on mobile/tablet */}
      {availableTabs.length > 0 && (
        <div className="lg:hidden w-full border-b border-border bg-background sticky top-0 z-30">
          <div className={`grid h-14`} style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === "stories" && storiesEnabled && <StoriesTab />}
          {activeTab === "stories" && !storiesEnabled && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Stories module is not enabled. Enable it in the Marketplace.</p>
            </div>
          )}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "goals" && <GoalsTab />}
          {!availableTabs.some(t => t.id === activeTab) && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">This tab is not available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Empty state component for Insights when no modules are enabled
 */
function InsightsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">No Insights Available</CardTitle>
          <CardDescription className="text-center mt-2">
            Enable insights modules from the marketplace to start generating reports and stories
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/add-ons">
            <Button className="w-full" size="lg">
              <Store className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
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
          <h1 className="text-xl font-bold text-foreground">Insights</h1>
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
          <ReportsContent />
        </Suspense>
      </div>
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}

