"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DashboardData } from "@tests/mocks/data/dashboard-mock-data";
import { MetricType } from "../filters/MetricSelector";

interface DashboardLayoutProps {
  children: ReactNode;
  onRefresh?: () => void;
  data?: DashboardData;
}

export function DashboardLayout({
  children,
  onRefresh,
  data,
}: DashboardLayoutProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    "all",
  ]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    // In production, this would filter the data
    console.log("Date range changed:", start, end);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onRefresh={onRefresh}
            data={data}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
            onDateRangeChange={handleDateRangeChange}
          />
          <main className="flex-1 overflow-y-auto" role="main">
            <div className="animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

