"use client";

/**
 * DesktopNavigation Component
 * Clean, simple top navigation for desktop/web version
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, BarChart3, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";

export function DesktopNavigation() {
  const pathname = usePathname();
  const { user } = useUser();

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
    <nav className="hidden lg:flex items-center gap-1 bg-card border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-2 mr-6">
        <h1 className="text-lg font-bold text-foreground">EZ Financial</h1>
      </div>
      
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
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
          <ThemeToggle />
          <div className="text-sm text-muted-foreground">
            {user.firstName || user.emailAddresses[0]?.emailAddress}
          </div>
        </div>
      )}
    </nav>
  );
}

