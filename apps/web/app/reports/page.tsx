"use client";

/**
 * Reports Page
 * Sidebar navigation system: Stories, Reports, Goals
 */

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { ReportsSidebar } from "./components/ReportsSidebar";
import { BookOpen, FileText, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportsTab } from "./components/ReportsTab";
import { StoriesTab } from "./components/StoriesTab";
import { GoalsTab } from "./components/GoalsTab";

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "reports";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop only */}
      <ReportsSidebar />

      {/* Mobile Tabs - shown on mobile/tablet */}
      <div className="lg:hidden w-full border-b border-border bg-background sticky top-0 z-30">
        <div className="grid grid-cols-3 h-14">
          <button
            onClick={() => handleTabChange("stories")}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === "stories"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Stories</span>
          </button>
          <button
            onClick={() => handleTabChange("reports")}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === "reports"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => handleTabChange("goals")}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === "goals"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="w-4 h-4" />
            <span>Goals</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === "stories" && <StoriesTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "goals" && <GoalsTab />}
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

