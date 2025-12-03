"use client";

/**
 * BottomNavigation Component
 * Mobile-first bottom navigation bar (like native mobile apps)
 * Dynamically loads navigation items from enabled modules
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEnabledModules } from "@/hooks/useEnabledModules";
import { getAllNavigationItems } from "@/lib/module-navigation";

export function BottomNavigation() {
  const pathname = usePathname();
  const { modules: enabledModules } = useEnabledModules();

  // Get enabled module IDs
  const enabledModuleIds = enabledModules
    .filter(m => m.enabled)
    .map(m => m.moduleId);

  // Get all navigation items (core + modules)
  // For mobile, we limit to 5 items max (including core items)
  const allNavItems = getAllNavigationItems(enabledModuleIds);
  const navItems = allNavItems.slice(0, 5); // Limit to 5 for mobile

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href === "/dashboard" && pathname === "/dashboard") ||
            (item.href === "/analytics" && pathname === "/analytics") ||
            (item.href === "/transactions" && pathname === "/transactions") ||
            (item.href === "/reports" && pathname?.startsWith("/reports")) ||
            (item.href === "/add-ons" && pathname === "/add-ons") ||
            (item.href === "/settings" && pathname === "/settings");
          
          return (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

