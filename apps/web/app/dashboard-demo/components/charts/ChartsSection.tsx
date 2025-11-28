"use client";

import { DashboardData } from "../../data/mockData";
import { LineChart } from "./LineChart";
import { AreaChart } from "./AreaChart";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";

interface ChartsSectionProps {
  data: DashboardData;
}

export function ChartsSection({ data }: ChartsSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={data.timeSeries.revenue}
          dataKey="value"
          name="Revenue"
          color="#3b82f6"
          title="Revenue Over Time"
        />
        <AreaChart
          data={data.timeSeries.users}
          dataKey="value"
          name="Active Users"
          color="#10b981"
          title="User Growth"
        />
        <BarChart
          data={data.timeSeries.conversions}
          dataKey="value"
          name="Conversions"
          color="#f59e0b"
          title="Conversion Funnel"
        />
        <PieChart
          data={data.categories}
          title="Category Distribution"
        />
      </div>
    </div>
  );
}

