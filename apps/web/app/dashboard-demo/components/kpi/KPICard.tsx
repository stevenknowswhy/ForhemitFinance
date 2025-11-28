"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  previous: number;
  change: number;
  trend: "up" | "down";
  format?: "currency" | "number" | "percentage";
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

export function KPICard({
  title,
  value,
  previous,
  change,
  trend,
  format = "number",
}: KPICardProps) {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6",
        "transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        "cursor-pointer"
      )}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${formatValue(value, format)}, ${isPositive ? "up" : "down"} ${Math.abs(change).toFixed(1)}%`}
    >
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="text-3xl font-bold mb-4">
        {formatValue(value, format)}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div
          className={cn(
            "flex items-center gap-1 transition-colors",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}
          aria-label={`${isPositive ? "Increase" : "Decrease"} of ${Math.abs(change).toFixed(1)}%`}
        >
          <TrendIcon className="w-4 h-4" aria-hidden="true" />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
        <span className="text-muted-foreground">
          vs previous period
        </span>
      </div>
    </div>
  );
}

