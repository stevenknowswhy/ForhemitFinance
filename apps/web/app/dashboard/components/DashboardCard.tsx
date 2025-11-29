"use client";

/**
 * DashboardCard Component
 * Reusable card component with optional tooltip support
 */

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  tooltip,
  className,
  valueClassName,
  onClick,
}: DashboardCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={cn(
        "bg-card rounded-lg shadow border border-border p-6 relative",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-muted-foreground">{title}</div>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg z-50 text-xs text-popover-foreground">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold", valueClassName)}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}

