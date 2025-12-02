"use client";

/**
 * AnalyticsSidebar Component
 * Sidebar navigation for Analytics page sections (Business, Personal, Blended)
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Briefcase, User, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    value: "business",
    label: "Business",
    icon: Briefcase,
  },
  {
    value: "personal",
    label: "Personal",
    icon: User,
  },
  {
    value: "blended",
    label: "Blended",
    icon: Layers,
  },
];

export function AnalyticsSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "blended";

  // Collapse state - persist in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("analytics-sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <aside
      className={cn(
        "bg-card border-r border-border pt-4 pb-8 overflow-y-auto sticky top-[65px] h-[calc(100vh-65px)] hidden lg:block transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("px-4 mb-4 flex items-center justify-between", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Analytics</h2>
            <p className="text-sm text-muted-foreground">Financial insights</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8 shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")} aria-label="Analytics navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;

          return (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

