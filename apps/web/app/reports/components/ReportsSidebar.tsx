"use client";

/**
 * ReportsSidebar Component
 * Sidebar navigation for Reports page sections (Stories, Reports, Goals)
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  BookOpen, 
  FileText, 
  Target, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Scale,
  ArrowLeftRight,
  Calculator,
  Flame,
  BarChart3,
  Receipt,
  FileCheck,
  ShoppingCart,
  Briefcase,
  FileSpreadsheet,
  Banknote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useModuleAccess } from "@/hooks/useModule";

interface SubSection {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subSections?: SubSection[];
}

const allSidebarItems: SidebarItem[] = [
  {
    value: "stories",
    label: "Stories",
    icon: BookOpen,
    subSections: [
      { id: "stories-company", label: "Company Story", icon: Building2 },
      { id: "stories-banker", label: "Banker Story", icon: Banknote },
      { id: "stories-investor", label: "Investor Story", icon: TrendingUp },
      { id: "stories-generate", label: "Generate New Story", icon: Sparkles },
    ],
  },
  {
    value: "reports",
    label: "Reports",
    icon: FileText,
    subSections: [
      { id: "reports-core", label: "Core Financial Reports", icon: DollarSign },
      { id: "reports-health", label: "Business Health", icon: BarChart3 },
      { id: "reports-stakeholder", label: "Stakeholder Reports", icon: Users },
      { id: "reports-operational", label: "Operational Reports", icon: ShoppingCart },
      { id: "reports-accounting", label: "Accounting Reports", icon: FileCheck },
      { id: "reports-tax", label: "Tax & Compliance", icon: Receipt },
      { id: "reports-export", label: "Transaction Export", icon: FileSpreadsheet },
    ],
  },
  {
    value: "goals",
    label: "Goals",
    icon: Target,
    subSections: [
      { id: "goals-revenue", label: "Revenue Goals", icon: TrendingUp },
      { id: "goals-expense", label: "Expense Reduction", icon: ArrowLeftRight },
      { id: "goals-cashflow", label: "Cash Flow Goals", icon: DollarSign },
      { id: "goals-custom", label: "Custom Goals", icon: Target },
    ],
  },
];

export function ReportsSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "reports";
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Check module access
  const storiesAccess = useModuleAccess("stories");
  const reportsAccess = useModuleAccess("reports");
  
  // Filter sidebar items based on module access
  const sidebarItems = allSidebarItems.filter(item => {
    if (item.value === "stories") return storiesAccess.hasAccess;
    if (item.value === "reports") return reportsAccess.hasAccess;
    return true; // Goals is always available
  });

  // Collapse state - persist in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reports-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("reports-sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  // Auto-expand active tab section
  useEffect(() => {
    if (activeTab) {
      setExpandedSections((prev) => new Set(prev).add(activeTab));
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleExpand = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    // Collapse all sections when sidebar is collapsed
    if (!isCollapsed) {
      setExpandedSections(new Set());
    }
  };

  const handleSubSectionClick = (sectionValue: string, subSectionId: string) => {
    // First switch to the main tab if not already active
    if (activeTab !== sectionValue) {
      handleTabChange(sectionValue);
    }
    // Then scroll to the subsection (if it exists in the DOM)
    setTimeout(() => {
      const element = document.getElementById(subSectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
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
            <h2 className="text-lg font-semibold text-foreground mb-1">Reports</h2>
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
      <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")} aria-label="Reports navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          const isExpanded = expandedSections.has(item.value);
          const hasSubSections = item.subSections && item.subSections.length > 0;

          return (
            <div key={item.value}>
              <div className="flex items-center">
                {hasSubSections && !isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.value);
                    }}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleTabChange(item.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-left transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isCollapsed ? "px-2 py-3 w-full justify-center" : "flex-1 px-4 py-3",
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
              </div>

              {/* Sub-sections */}
              {hasSubSections && isExpanded && !isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subSections!.map((subSection) => {
                    const SubIcon = subSection.icon;

                    return (
                      <button
                        key={subSection.id}
                        onClick={() => handleSubSectionClick(item.value, subSection.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
                        <span>{subSection.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

