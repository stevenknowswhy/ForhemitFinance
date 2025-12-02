/**
 * Mobile Tabs Component for Analytics
 */

"use client";

import { Briefcase, User, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabType } from "../types";

interface MobileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  classificationProgress?: number;
}

export function MobileTabs({ activeTab, onTabChange, classificationProgress = 0 }: MobileTabsProps) {
  return (
    <div className="lg:hidden w-full border-b border-border bg-background sticky top-0 z-30">
      <div className="grid grid-cols-3 h-14">
        <button
          onClick={() => onTabChange("business")}
          className={cn(
            "flex items-center justify-center gap-2 border-b-2 transition-colors",
            activeTab === "business"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Briefcase className="w-4 h-4" />
          <span>Business</span>
          {classificationProgress > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {classificationProgress}%
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange("personal")}
          className={cn(
            "flex items-center justify-center gap-2 border-b-2 transition-colors",
            activeTab === "personal"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-4 h-4" />
          <span>Personal</span>
          {classificationProgress > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {classificationProgress}%
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange("blended")}
          className={cn(
            "flex items-center justify-center gap-2 border-b-2 transition-colors",
            activeTab === "blended"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Blended</span>
        </button>
      </div>
    </div>
  );
}

