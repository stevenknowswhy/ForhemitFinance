"use client";

/**
 * DesktopNavigation Component
 * Clean, simple top navigation for desktop/web version
 * Dynamically loads navigation items from enabled modules
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";
import { OrgSwitcher } from "./OrgSwitcher";
import { NotificationBell } from "./NotificationBell";
import { useEnabledModules } from "@/hooks/useEnabledModules";
import { getAllNavigationItems } from "@/lib/module-navigation";

export function DesktopNavigation() {
  const pathname = usePathname();
  const { user } = useUser();
  const { modules: enabledModules } = useEnabledModules();

  // Get enabled module IDs
  const enabledModuleIds = enabledModules
    .filter(m => m.enabled)
    .map(m => m.moduleId);

  // Get all navigation items (core + modules)
  const navItems = getAllNavigationItems(enabledModuleIds);

  return (
    <nav className="hidden lg:flex items-center gap-1 bg-card border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-2 mr-6">
        <Link href="/">
          <h1 className="text-lg font-bold text-foreground hover:text-primary transition-colors cursor-pointer">EZ Financial</h1>
        </Link>
      </div>
      
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href === "/reports" && pathname?.startsWith("/reports"));
          
          return (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-lg",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {user && (
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <OrgSwitcher />
          <ThemeToggle />
          <div className="text-sm text-muted-foreground">
            {user.firstName || user.emailAddresses[0]?.emailAddress}
          </div>
        </div>
      )}
    </nav>
  );
}

