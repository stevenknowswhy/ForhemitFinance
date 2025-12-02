"use client";

/**
 * Profit & Loss (P&L) Statement Report Modal
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportPDF } from "@/lib/pdfUtils";

interface ProfitLossReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfitLossReportModal({
  open,
  onOpenChange,
}: ProfitLossReportModalProps) {
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [filterType, setFilterType] = useState<"business" | "personal" | "blended">("blended");
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [breakdownBy, setBreakdownBy] = useState<"category" | "product" | "revenue_stream">("category");

  // Calculate date range
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

  // Fetch report data
  const reportData = useQuery(api.reports.getProfitAndLossData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    filterType,
    mode,
    breakdownBy,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("profit-loss-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const dateRangeStr = formatDateRange(new Date(dateRange.start), new Date(dateRange.end));
    const filename = `profit-loss-${new Date(dateRange.start).toISOString().split("T")[0]}-to-${new Date(dateRange.end).toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Profit & Loss Statement",
        dateRangeStr
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
            <DialogTitle>Profit & Loss Statement</DialogTitle>
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
          <DialogTitle>Profit & Loss Statement</DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(dateRange.start), new Date(dateRange.end))}
          </DialogDescription>
        </DialogHeader>

        <div id="profit-loss-report-content" className="space-y-6 print:space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <div>
              <Label>Date Range</Label>
              <Select
                value={dateRangePreset}
                onValueChange={(value: any) => setDateRangePreset(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
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

            <div>
              <Label>Filter Type</Label>
              <Select
                value={filterType}
                onValueChange={(value: any) => setFilterType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Only</SelectItem>
                  <SelectItem value="personal">Personal Only</SelectItem>
                  <SelectItem value="blended">Blended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mode</Label>
              <Select
                value={mode}
                onValueChange={(value: any) => setMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "advanced" && (
              <div>
                <Label>Breakdown By</Label>
                <Select
                  value={breakdownBy}
                  onValueChange={(value: any) => setBreakdownBy(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="revenue_stream">Revenue Stream</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Report Content */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-2xl print:mb-2">Profit & Loss Statement</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground print:text-xs print:mt-1">
                {formatDateRange(new Date(dateRange.start), new Date(dateRange.end))}
                {filterType !== "blended" && ` • ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Only`}
              </div>
            </CardHeader>
            <CardContent className="print:p-4">
              <div className="space-y-6 print:space-y-4">
                {/* Revenue Section */}
                <div className="print:page-break-inside-avoid">
                  <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2">Revenue</h3>
                  {mode === "simple" ? (
                    <div className="space-y-2">
                      {reportData.revenue.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.account}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold text-lg mt-4">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(reportData.revenue.total)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reportData.revenue.byCategory.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold text-lg mt-4">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(reportData.revenue.total)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expenses Section */}
                <div className="print:page-break-inside-avoid">
                  <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2">Expenses</h3>
                  {mode === "simple" ? (
                    <div className="space-y-2">
                      {reportData.expenses.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.account}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold text-lg mt-4">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(reportData.expenses.total)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reportData.expenses.byCategory.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold text-lg mt-4">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(reportData.expenses.total)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Income */}
                <div className="pt-4 border-t-2 print:border-t print:pt-3 print:page-break-inside-avoid">
                  <div className="flex justify-between py-2 font-bold text-xl print:text-lg">
                    <span>Net Income</span>
                    <span className={reportData.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(reportData.netIncome)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 print:text-xs">
                    Gross Margin: {reportData.grossMargin.toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

