"use client";

/**
 * Reports Page
 * Sidebar navigation system: Stories, Reports, Goals
 */

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { ReportsSidebar } from "./components/ReportsSidebar";
import { BookOpen, FileText, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportsTab } from "./components/ReportsTab";
import { StoriesTab } from "./components/StoriesTab";
import { GoalsTab } from "./components/GoalsTab";
import { useEnabledModules } from "@/hooks/useEnabledModules";
import { useModuleAccess } from "@/hooks/useModule";

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { modules: enabledModules } = useEnabledModules();
  
  // Check which modules are enabled
  const storiesAccess = useModuleAccess("stories");
  const reportsAccess = useModuleAccess("reports");
  
  // Determine default tab (first available enabled module)
  const getDefaultTab = () => {
    if (reportsAccess.hasAccess) return "reports";
    if (storiesAccess.hasAccess) return "stories";
    return "goals"; // Fallback to goals if nothing else
  };
  
  const activeTab = searchParams.get("tab") || getDefaultTab();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build available tabs based on enabled modules
  const availableTabs = [
    ...(storiesAccess.hasAccess ? [{ id: "stories", label: "Stories", icon: BookOpen }] : []),
    ...(reportsAccess.hasAccess ? [{ id: "reports", label: "Reports", icon: FileText }] : []),
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
          {activeTab === "stories" && storiesAccess.hasAccess && <StoriesTab />}
          {activeTab === "reports" && reportsAccess.hasAccess && <ReportsTab />}
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
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
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

