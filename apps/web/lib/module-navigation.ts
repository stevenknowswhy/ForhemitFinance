/**
 * Module Navigation Utilities
 * Helper functions to get navigation items from enabled modules
 */

import { ModuleNavigationItem } from "../../../modules/core/types";
import { Home, Receipt, BarChart3, FileText, Settings, BookOpen } from "lucide-react";

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
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: Settings,
    order: 99, // Always last
  },
] as const;

/**
 * Get navigation items from enabled modules
 * For now, we hardcode known modules. In the future, this could fetch from a backend endpoint
 */
export function getModuleNavigationItems(enabledModuleIds: string[]): ModuleNavigationItem[] {
  const moduleNavItems: ModuleNavigationItem[] = [];

  // Stories module navigation
  if (enabledModuleIds.includes("stories")) {
    moduleNavItems.push({
      id: "stories",
      label: "Stories",
      href: "/stories",
      icon: BookOpen,
      order: 4,
    });
  }

  // Reports module navigation (if not already in core)
  // Reports is already in core nav, so we don't add it again
  // But if it's disabled, we could remove it (handled elsewhere)

  return moduleNavItems;
}

/**
 * Get all navigation items (core + modules)
 */
export function getAllNavigationItems(enabledModuleIds: string[]) {
  const coreItems = CORE_NAV_ITEMS.map(item => ({
    ...item,
    icon: item.icon,
  }));

  const moduleItems = getModuleNavigationItems(enabledModuleIds);

  // Combine and sort by order
  const allItems = [...coreItems, ...moduleItems].sort((a, b) => 
    (a.order || 50) - (b.order || 50)
  );

  return allItems;
}

