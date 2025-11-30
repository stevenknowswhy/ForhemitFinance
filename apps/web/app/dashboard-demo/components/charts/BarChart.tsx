"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesData } from "@tests/mocks/data/dashboard-mock-data";
import { ChartContainer } from "./ChartContainer";

interface BarChartProps {
  data: TimeSeriesData[];
  dataKey: string;
  name: string;
  color?: string;
  title?: string;
}

export function BarChart({
  data,
  dataKey,
  name,
  color = "#f59e0b",
  title,
}: BarChartProps) {
  return (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs text-muted-foreground"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis className="text-xs text-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            }}
            formatter={(value: number) => [
              Math.round(value).toLocaleString(),
              name,
            ]}
          />
          <Legend />
          <Bar
            dataKey={dataKey}
            name={name}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

