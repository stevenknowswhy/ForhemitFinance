"use client";

/**
 * Reports Page
 * Three-tab system: Stories, Reports, Goals
 */

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, FileText, Target } from "lucide-react";
import { ReportsTab } from "./components/ReportsTab";
import { StoriesTab } from "./components/StoriesTab";
import { GoalsTab } from "./components/GoalsTab";

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
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Stories</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            <StoriesTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsTab />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}

