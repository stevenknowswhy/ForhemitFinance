"use client";

import { KPIData } from "@tests/mocks/data/dashboard-mock-data";
import { KPICard } from "./KPICard";

interface KPIGridProps {
  data?: KPIData;
}

export function KPIGrid({ data }: KPIGridProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Revenue"
        value={data.revenue.current}
        previous={data.revenue.previous}
        change={data.revenue.change}
        trend={data.revenue.trend}
        format="currency"
      />
      <KPICard
        title="Active Users"
        value={data.activeUsers.current}
        previous={data.activeUsers.previous}
        change={data.activeUsers.change}
        trend={data.activeUsers.trend}
        format="number"
      />
      <KPICard
        title="Conversion Rate"
        value={data.conversionRate.current}
        previous={data.conversionRate.previous}
        change={data.conversionRate.change}
        trend={data.conversionRate.trend}
        format="percentage"
      />
      <KPICard
        title="Avg Order Value"
        value={data.averageOrderValue.current}
        previous={data.averageOrderValue.previous}
        change={data.averageOrderValue.change}
        trend={data.averageOrderValue.trend}
        format="currency"
      />
    </div>
  );
}

// Skeleton loader
KPIGrid.Skeleton = function KPIGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i: any) => (
        <div
          key={i}
          className="h-32 bg-muted animate-pulse rounded-lg"
        />
      ))}
    </div>
  );
};

