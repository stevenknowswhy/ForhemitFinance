/**
 * Module Navigation Utilities
 * Helper functions to get navigation items from enabled modules
 */

import { ModuleNavigationItem } from "../../../modules/core/types";
import { Home, Receipt, BarChart3, FileText, Settings, Store } from "lucide-react";

// Core navigation items (always shown)
export const CORE_NAV_ITEMS = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Home",
    icon: Home,
    order: 0,
  },
  {
    id: "transactions",
    href: "/transactions",
    label: "Transactions",
    icon: Receipt,
    order: 1,
  },
  {
    id: "analytics",
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    order: 2,
  },
  {
    id: "reports",
    href: "/reports",
    label: "Insights",
    icon: FileText,
    order: 3,
  },
  {
    id: "marketplace",
    href: "/add-ons",
    label: "Marketplace",
    icon: Store,
    order: 4,
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: Settings,
    order: 99, // Always last
  },
] as const;

/**
 * Get navigation items from enabled modules
 * Note: Stories is no longer a top-level nav item - it appears in Insights sidebar when enabled
 * Only modules that should appear in top-level nav should be added here
 */
export function getModuleNavigationItems(enabledModuleIds: string[]): ModuleNavigationItem[] {
  const moduleNavItems: ModuleNavigationItem[] = [];

  // Stories module is now integrated into Insights sidebar, not top-level nav
  // Reports module is already in core nav (as "Insights")
  // Add other modules here if they need top-level navigation

  return moduleNavItems;
}

/**
 * Get all navigation items (core + modules)
 * Insights is always shown, regardless of module enablement
 */
export function getAllNavigationItems(enabledModuleIds: string[]) {
  const coreItems = CORE_NAV_ITEMS.map(item => ({
    ...item,
    icon: item.icon,
  }));

  // Always show all core items (including Insights)
  // Insights is always available, even if no modules are enabled

  const moduleItems = getModuleNavigationItems(enabledModuleIds);

  // Combine and sort by order
  const allItems = [...coreItems, ...moduleItems].sort((a, b) => 
    (a.order || 50) - (b.order || 50)
  );

  return allItems;
}

