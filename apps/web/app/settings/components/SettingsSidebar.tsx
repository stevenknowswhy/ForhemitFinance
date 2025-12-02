"use client";

/**
 * SettingsSidebar Component
 * Nested expandable sidebar navigation for Settings page categories
 */

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  CreditCard,
  Palette,
  Bell,
  Building2,
  Plug,
  Settings2,
  FileText,
  Database,
  Sparkles,
  Network,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Smartphone,
  Inbox,
  Wallet,
  Receipt,
  History,
  FileCheck,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  Layout,
  Globe,
  RefreshCw,
  Download,
  Trash2,
  Users,
  UserPlus,
  Key,
  Link2,
  Banknote,
  TrendingUp,
  Calculator,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SubSection {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subSections?: SubSection[];
  conditional?: "business" | "personal";
}

const sidebarSections: SidebarSection[] = [
  {
    id: "account",
    label: "Account",
    icon: User,
    subSections: [
      { id: "profile", label: "Profile", icon: User },
      { id: "addresses", label: "Addresses", icon: FileText },
    ],
  },
  {
    id: "business-profile",
    label: "Business Profile",
    icon: FileText,
    subSections: [
      { id: "business-profile", label: "Overview", icon: Building2 },
      { id: "business-profile-compliance", label: "Compliance", icon: FileCheck },
      { id: "business-profile-identity", label: "Business Identity", icon: Globe },
    ],
  },
  {
    id: "security-privacy",
    label: "Security & Privacy",
    icon: Shield,
    subSections: [
      { id: "security", label: "Security & Login", icon: Lock },
      { id: "privacy", label: "Privacy Controls", icon: Eye },
      { id: "two-factor", label: "Two-Factor Auth", icon: Key },
      { id: "sessions", label: "Active Sessions", icon: Monitor },
    ],
  },
  {
    id: "billing",
    label: "Billing & Subscription",
    icon: CreditCard,
    subSections: [
      { id: "billing", label: "Subscription", icon: CreditCard },
      { id: "billing-payment", label: "Payment Methods", icon: Wallet },
      { id: "billing-history", label: "Billing History", icon: History },
      { id: "billing-invoices", label: "Invoices & Receipts", icon: Receipt },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    subSections: [
      { id: "theme", label: "Theme", icon: Moon },
      { id: "display", label: "Display & Behavior", icon: Monitor },
      { id: "layout", label: "Layout Preferences", icon: Layout },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    subSections: [
      { id: "notifications", label: "Notification Preferences", icon: Bell },
      { id: "notifications-email", label: "Email Notifications", icon: Mail },
      { id: "notifications-push", label: "Push Notifications", icon: Smartphone },
      { id: "notifications-in-app", label: "In-App Notifications", icon: Inbox },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: Building2,
    conditional: "business",
    subSections: [
      { id: "business-profile-sub", label: "Business Profile", icon: FileText },
      { id: "accounting", label: "Accounting Preferences", icon: Calculator },
      { id: "team", label: "Team & Collaboration", icon: Users },
      { id: "business-metrics", label: "Business Metrics", icon: TrendingUp },
      { id: "business-compliance", label: "Compliance & Legal", icon: FileCheck },
    ],
  },
  {
    id: "accounting",
    label: "Accounting Preferences",
    icon: Building2,
    conditional: "personal",
    subSections: [
      { id: "accounting", label: "Accounting Method", icon: Calculator },
      { id: "accounting-fiscal", label: "Fiscal Year", icon: Calendar },
      { id: "accounting-categories", label: "Category Preferences", icon: FileText },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    subSections: [
      { id: "integrations", label: "All Integrations", icon: Plug },
      { id: "integrations-bank", label: "Bank Connections", icon: Banknote },
      { id: "integrations-accounting", label: "Accounting Software", icon: FileText },
      { id: "integrations-other", label: "Other Services", icon: Link2 },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Settings2,
    subSections: [
      {
        id: "data-management",
        label: "Data Management",
        icon: Database,
      },
      {
        id: "data-sync",
        label: "Data Sync & Bank Connections",
        icon: RefreshCw,
      },
      {
        id: "data-export",
        label: "Data Export & Ownership",
        icon: Download,
      },
      {
        id: "data-reset",
        label: "Data & Reset",
        icon: Trash2,
      },
      {
        id: "ai-automation",
        label: "AI & Automation",
        icon: Sparkles,
      },
      {
        id: "professional-network",
        label: "Professional Network",
        icon: Network,
      },
    ],
  },
];

interface SettingsSidebarProps {
  isBusinessPlan?: boolean;
}

export function SettingsSidebar({ isBusinessPlan = false }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Collapse state - persist in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("settings-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("settings-sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  // Filter sections based on plan type - memoize to prevent infinite loops
  const visibleSections = useMemo(() => {
    return sidebarSections.filter((section) => {
      if (section.conditional === "business" && !isBusinessPlan) return false;
      if (section.conditional === "personal" && isBusinessPlan) return false;
      return true;
    });
  }, [isBusinessPlan]);

  // Handle scroll to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = visibleSections.flatMap((section) => {
        const sectionElement = document.getElementById(section.id);
        if (!sectionElement) return [];
        return [{ id: section.id, element: sectionElement }];
      });

      if (sections.length === 0) return;

      const scrollPosition = window.scrollY + 200; // Offset for better detection

      for (let i = sections.length - 1; i >= 0; i--) {
        const { id, element } = sections[i];
        if (element.offsetTop <= scrollPosition) {
          setActiveSection((prev) => {
            // Only update if different to prevent unnecessary re-renders
            if (prev !== id) {
              // Auto-expand if section has sub-sections
              const section = visibleSections.find((s) => s.id === id);
              if (section?.subSections) {
                setExpandedSections((prev) => {
                  if (prev.has(id)) return prev;
                  return new Set(prev).add(id);
                });
              }
              return id;
            }
            return prev;
          });
          break;
        }
      }
    };

    // Throttle scroll events to prevent excessive updates
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [visibleSections]);

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Find the accordion trigger button - look for button inside AccordionTrigger
      const accordionItem = element.closest('[data-state]');
      if (accordionItem) {
        const triggerButton = accordionItem.querySelector('button') as HTMLElement;
        if (triggerButton) {
          // Check if accordion is closed by looking for the parent's data-state
          const itemState = (accordionItem as HTMLElement).getAttribute('data-state');
          if (itemState === 'closed') {
            triggerButton.click();
          }
        }
      }
      // Scroll after a brief delay to allow accordion to expand
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleSubSectionClick = (sectionId: string, subSectionId: string) => {
    // First expand parent section
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      const parentItem = sectionElement.closest('[data-state]');
      if (parentItem) {
        const parentTrigger = parentItem.querySelector('button') as HTMLElement;
        const itemState = (parentItem as HTMLElement).getAttribute('data-state');
        if (parentTrigger && itemState === 'closed') {
          parentTrigger.click();
        }
      }
    }
    
    // Then scroll to and expand sub-section
    setTimeout(() => {
      const element = document.getElementById(subSectionId);
      if (element) {
        const subItem = element.closest('[data-state]');
        if (subItem) {
          const subTrigger = subItem.querySelector('button') as HTMLElement;
          const itemState = (subItem as HTMLElement).getAttribute('data-state');
          if (subTrigger && itemState === 'closed') {
            subTrigger.click();
          }
        }
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }, 150);
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
            <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
            <p className="text-sm text-muted-foreground">Preferences & configuration</p>
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
      <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")} aria-label="Settings navigation">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const isActive = activeSection === section.id;
          const hasSubSections = section.subSections && section.subSections.length > 0;

          return (
            <div key={section.id}>
              <div className="flex items-center">
                {hasSubSections && !isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(section.id);
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
                  onClick={() => handleSectionClick(section.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-left transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isCollapsed ? "px-2 py-3 w-full justify-center" : "flex-1 px-4 py-3",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? section.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!isCollapsed && <span className="font-medium">{section.label}</span>}
                </button>
              </div>

              {/* Sub-sections */}
              {hasSubSections && isExpanded && !isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  {section.subSections!.map((subSection) => {
                    const SubIcon = subSection.icon;
                    const isSubActive = activeSection === subSection.id;

                    return (
                      <button
                        key={subSection.id}
                        onClick={() => handleSubSectionClick(section.id, subSection.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isSubActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

