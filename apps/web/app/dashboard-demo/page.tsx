"use client";

/**
 * Dashboard Demo Page
 * Demonstrates shadcn/ui components with data visualization
 */

import { DashboardLayout } from "./components/layout/DashboardLayout";
import { KPIGrid } from "./components/kpi/KPIGrid";
import { ChartsSection } from "./components/charts/ChartsSection";
import { DataTable } from "./components/data/DataTable";
import { useDashboardData } from "./hooks/useDashboardData";

export default function DashboardDemoPage() {
  const { data, isLoading, error, refresh } = useDashboardData();

  return (
    <DashboardLayout onRefresh={refresh} data={data || undefined}>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrating shadcn/ui components with data visualization
          </p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <KPIGrid.Skeleton />
        ) : error ? (
          <div
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-destructive"
            role="alert"
            aria-live="polite"
          >
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : (
          <KPIGrid data={data?.kpis} />
        )}

        {/* Charts Section */}
        {!isLoading && !error && data && (
          <ChartsSection data={data} />
        )}

        {/* Data Table */}
        {!isLoading && !error && data && (
          <DataTable data={data.recentActivity} />
        )}
      </div>
    </DashboardLayout>
  );
}

