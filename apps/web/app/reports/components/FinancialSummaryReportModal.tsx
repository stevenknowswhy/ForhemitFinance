"use client";

/**
 * Monthly / Quarterly Financial Summary Report Modal
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatDate, formatDateRange } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportPDF } from "@/lib/pdfUtils";

interface FinancialSummaryReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialSummaryReportModal({
  open,
  onOpenChange,
}: FinancialSummaryReportModalProps) {
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly");

  // Fetch report data
  const reportData = useQuery(api.reports.getFinancialSummaryData, {
    period,
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
    const reportElement = document.getElementById("financial-summary-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const periodStr = period === "monthly" ? "Monthly" : "Quarterly";
    const filename = `financial-summary-${periodStr}-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        `${periodStr} Financial Summary`
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
            <DialogTitle>Financial Summary</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>
            {period === "monthly" ? "Monthly" : "Quarterly"} Financial Summary
          </DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
          </DialogDescription>
        </DialogHeader>

        <div id="financial-summary-report-content" className="space-y-6 print:space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-end print:hidden">
            <div className="w-48">
              <Label>Period</Label>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block print:mb-4">
            <h1 className="text-2xl font-bold">{period === "monthly" ? "Monthly" : "Quarterly"} Financial Summary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.revenue)}</div>
                {reportData.trends.revenue !== null && (
                  <div className={`text-sm mt-1 flex items-center ${
                    reportData.trends.revenue >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {reportData.trends.revenue >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {formatPercent(reportData.trends.revenue)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.expenses)}</div>
                {reportData.trends.expenses !== null && (
                  <div className={`text-sm mt-1 flex items-center ${
                    reportData.trends.expenses <= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {reportData.trends.expenses <= 0 ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    )}
                    {formatPercent(reportData.trends.expenses)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  reportData.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(reportData.profit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  reportData.cashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(reportData.cashFlow)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topRevenueCategories.length > 0 ? (
                    reportData.topRevenueCategories.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topExpenseCategories.length > 0 ? (
                    reportData.topExpenseCategories.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No expense data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

