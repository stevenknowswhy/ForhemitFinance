"use client";

import { Download } from "lucide-react";
import { DashboardData } from "../../data/mockData";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  data: DashboardData;
  className?: string;
}

export function ExportButton({ data, className }: ExportButtonProps) {
  const handleExport = (format: "csv" | "json") => {
    if (format === "csv") {
      // Convert to CSV
      const csvRows: string[] = [];
      
      // KPI data
      csvRows.push("Metric,Current,Previous,Change,Trend");
      csvRows.push(
        `Revenue,${data.kpis.revenue.current},${data.kpis.revenue.previous},${data.kpis.revenue.change},${data.kpis.revenue.trend}`
      );
      csvRows.push(
        `Active Users,${data.kpis.activeUsers.current},${data.kpis.activeUsers.previous},${data.kpis.activeUsers.change},${data.kpis.activeUsers.trend}`
      );
      csvRows.push(
        `Conversion Rate,${data.kpis.conversionRate.current},${data.kpis.conversionRate.previous},${data.kpis.conversionRate.change},${data.kpis.conversionRate.trend}`
      );
      csvRows.push(
        `Avg Order Value,${data.kpis.averageOrderValue.current},${data.kpis.averageOrderValue.previous},${data.kpis.averageOrderValue.change},${data.kpis.averageOrderValue.trend}`
      );
      
      csvRows.push("");
      csvRows.push("Date,Revenue,Users,Conversions");
      data.timeSeries.revenue.forEach((item, index) => {
        csvRows.push(
          `${item.date},${item.value},${data.timeSeries.users[index]?.value || 0},${data.timeSeries.conversions[index]?.value || 0}`
        );
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => {
          // Simple dropdown - in production, use a proper dropdown component
          const format = window.confirm(
            "Export as CSV? (Cancel for JSON)"
          )
            ? "csv"
            : "json";
          handleExport(format);
        }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-card border border-border",
          "hover:bg-muted transition-colors",
          "text-sm font-medium"
        )}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>
    </div>
  );
}

