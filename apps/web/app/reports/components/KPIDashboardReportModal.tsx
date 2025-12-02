"use client";

/**
 * Business KPI Dashboard Report Modal
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { formatDate, formatDateRange } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportPDF } from "@/lib/pdfUtils";

interface KPIDashboardReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KPIDashboardReportModal({
  open,
  onOpenChange,
}: KPIDashboardReportModalProps) {
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    
    if (dateRangePreset === "3months") {
      start = new Date();
      start.setMonth(start.getMonth() - 3);
    } else if (dateRangePreset === "6months") {
      start = new Date();
      start.setMonth(start.getMonth() - 6);
    } else if (dateRangePreset === "12months") {
      start = new Date();
      start.setMonth(start.getMonth() - 12);
    } else {
      start = customStartDate ? new Date(customStartDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      end.setTime(customEndDate ? new Date(customEndDate).getTime() : Date.now());
    }
    
    return {
      start: start.getTime(),
      end: end.getTime(),
    };
  }, [dateRangePreset, customStartDate, customEndDate]);

  const reportData = useQuery(api.reports.getKPIDashboardData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("kpi-dashboard-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `kpi-dashboard-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Business KPI Dashboard"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!reportData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business KPI Dashboard</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Business KPI Dashboard</DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
          </DialogDescription>
        </DialogHeader>

        <div id="kpi-dashboard-report-content" className="space-y-6 print:space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-end print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <Label>Date Range</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={dateRangePreset}
                  onChange={(e) => setDateRangePreset(e.target.value as any)}
                >
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="12months">Last 12 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {dateRangePreset === "custom" && (
                <>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block print:mb-4">
            <h1 className="text-2xl font-bold">Business KPI Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.grossMargin.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Revenue: {formatCurrency(reportData.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center ${
                  (reportData.revenueGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {reportData.revenueGrowth !== null ? (
                    <>
                      {reportData.revenueGrowth >= 0 ? (
                        <TrendingUp className="w-5 h-5 mr-1" />
                      ) : (
                        <TrendingDown className="w-5 h-5 mr-1" />
                      )}
                      {formatPercent(reportData.revenueGrowth)}
                    </>
                  ) : (
                    "N/A"
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.arpu)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Average Revenue Per Transaction
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Owner Compensation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.ownerCompensation)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.expenses)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products / Revenue Streams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.topProducts.length > 0 ? (
                  reportData.topProducts.map((product: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b">
                      <span>{product.product}</span>
                      <span className="font-medium">{formatCurrency(product.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No product data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Metrics (if available) */}
          {(reportData.cac !== null || reportData.ltv !== null || reportData.churn !== null) && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.cac !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground">CAC</div>
                    <div className="text-lg font-semibold">{formatCurrency(reportData.cac)}</div>
                  </div>
                )}
                {reportData.ltv !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground">LTV</div>
                    <div className="text-lg font-semibold">{formatCurrency(reportData.ltv)}</div>
                  </div>
                )}
                {reportData.churn !== null && reportData.churn !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">Churn Rate</div>
                    <div className="text-lg font-semibold">{Number(reportData.churn).toFixed(2)}%</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

