"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { DateRangePicker } from "../filters/DateRangePicker";
import { MetricSelector, type MetricType } from "../filters/MetricSelector";
import { ExportButton } from "../filters/ExportButton";
import { DashboardData } from "@tests/mocks/data/dashboard-mock-data";

interface HeaderProps {
  onRefresh?: () => void;
  data?: DashboardData;
  selectedMetrics?: MetricType[];
  onMetricsChange?: (metrics: MetricType[]) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
}

export function Header({
  onRefresh,
  data,
  selectedMetrics = ["all"],
  onMetricsChange,
  onDateRangeChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <ThemeToggle />
          <DateRangePicker onDateRangeChange={onDateRangeChange} />
          <MetricSelector
            selectedMetrics={selectedMetrics}
            onMetricsChange={onMetricsChange}
          />
          {data && <ExportButton data={data} />}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "active:scale-95"
              )}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

