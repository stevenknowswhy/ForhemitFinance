"use client";

import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricType = "revenue" | "users" | "conversions" | "all";

interface MetricSelectorProps {
  selectedMetrics: MetricType[];
  onMetricsChange?: (metrics: MetricType[]) => void;
  className?: string;
}

const AVAILABLE_METRICS: { value: MetricType; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "users", label: "Active Users" },
  { value: "conversions", label: "Conversions" },
  { value: "all", label: "All Metrics" },
];

export function MetricSelector({
  selectedMetrics,
  onMetricsChange,
  className,
}: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMetric = (metric: MetricType) => {
    if (metric === "all") {
      onMetricsChange?.(["all"]);
    } else {
      const newMetrics = selectedMetrics.includes(metric)
        ? selectedMetrics.filter((m: any) => m !== metric)
        : [...selectedMetrics.filter((m: any) => m !== "all"), metric];
      onMetricsChange?.(newMetrics.length > 0 ? newMetrics : ["all"]);
    }
    setIsOpen(false);
  };

  const displayText =
    selectedMetrics.length === AVAILABLE_METRICS.length - 1 ||
    selectedMetrics.includes("all")
      ? "All Metrics"
      : `${selectedMetrics.length} selected`;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-card border border-border",
          "hover:bg-muted transition-colors",
          "text-sm font-medium"
        )}
      >
        <Filter className="w-4 h-4" />
        <span>{displayText}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 z-20 bg-card border border-border rounded-lg shadow-lg min-w-[200px]">
            {AVAILABLE_METRICS.map((metric: any) => {
              const isSelected =
                selectedMetrics.includes(metric.value) ||
                (metric.value === "all" &&
                  (selectedMetrics.length === AVAILABLE_METRICS.length - 1 ||
                    selectedMetrics.includes("all")));

              return (
                <button
                  key={metric.value}
                  onClick={() => toggleMetric(metric.value)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm",
                    "hover:bg-muted transition-colors",
                    "first:rounded-t-lg last:rounded-b-lg",
                    "flex items-center gap-2",
                    isSelected && "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                    )}
                  </div>
                  <span>{metric.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

