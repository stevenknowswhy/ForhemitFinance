"use client";

/**
 * BottomNavigation Component
 * Mobile-first bottom navigation bar (like native mobile apps)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, FileText, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Home",
      icon: Home,
    },
    {
      href: "/transactions",
      label: "Transactions",
      icon: Receipt,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href === "/dashboard" && pathname === "/dashboard") ||
            (item.href === "/analytics" && pathname === "/analytics") ||
            (item.href === "/transactions" && pathname === "/transactions") ||
            (item.href === "/reports" && pathname?.startsWith("/reports")) ||
            (item.href === "/settings" && pathname === "/settings");
          
          return (
            <Link
              key={item.href}
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

