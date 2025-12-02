"use client";

/**
 * DashboardCard Component
 * Reusable card component with optional tooltip support
 */

import { useState } from "react";
import { Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  tooltip?: string;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  icon: Icon,
  loading,
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
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
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
        {loading ? (
          <span className="text-muted-foreground">...</span>
        ) : typeof value === "number" ? (
          value.toLocaleString()
        ) : (
          value
        )}
      </div>
      {(subtitle || trend) && (
        <div
          className={cn(
            "text-xs mt-1",
            trendUp !== undefined
              ? trendUp
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          )}
        >
          {trend || subtitle}
        </div>
      )}
    </div>
  );
}

