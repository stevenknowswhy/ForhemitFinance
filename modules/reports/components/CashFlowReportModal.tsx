"use client";

/**
 * Cash Flow Statement Report Modal (Indirect Method)
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateReportPDF } from "@/lib/pdfUtils";

interface CashFlowReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashFlowReportModal({
  open,
  onOpenChange,
}: CashFlowReportModalProps) {
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly");

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
  const reportData = useQuery(api.reports.getCashFlowStatementData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    period,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("cash-flow-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    if (!reportData) return;
    const dateRangeStr = formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end));
    const filename = `cash-flow-${new Date(reportData.dateRange.start).toISOString().split("T")[0]}-to-${new Date(reportData.dateRange.end).toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Cash Flow Statement (Indirect Method)",
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
            <DialogTitle>Cash Flow Statement</DialogTitle>
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
          <DialogTitle>Cash Flow Statement (Indirect Method)</DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
          </DialogDescription>
        </DialogHeader>

        <div id="cash-flow-report-content" className="space-y-6 print:space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
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
              <Label>Period</Label>
              <Select
                value={period}
                onValueChange={(value: any) => setPeriod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Content */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-2xl print:mb-2">Cash Flow Statement</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground print:text-xs print:mt-1">
                {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
              </div>
            </CardHeader>
            <CardContent className="print:p-4">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="print:hidden">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="periods">Period Breakdown</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6 print:space-y-4">
                  {/* Operating Activities */}
                  <div className="print:page-break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2">Operating Activities</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between py-2">
                        <span>Net Income</span>
                        <span className="font-medium">{formatCurrency(reportData.operatingActivities.netIncome)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-muted-foreground">
                        <span>Adjustments for changes in working capital:</span>
                        <span></span>
                      </div>
                      <div className="flex justify-between py-2 pl-4">
                        <span>Change in Current Assets</span>
                        <span className="font-medium">
                          {formatCurrency(reportData.operatingActivities.adjustments.changeInCurrentAssets)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 pl-4">
                        <span>Change in Current Liabilities</span>
                        <span className="font-medium">
                          {formatCurrency(reportData.operatingActivities.adjustments.changeInCurrentLiabilities)}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 font-bold text-lg mt-4 border-t-2">
                        <span>Cash from Operations</span>
                        <span className={reportData.operatingActivities.cashFromOperations >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(reportData.operatingActivities.cashFromOperations)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div className="print:page-break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2">Investing Activities</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between py-3 font-bold text-lg border-t-2">
                        <span>Cash from Investing</span>
                        <span>{formatCurrency(reportData.investingActivities.cashFromInvesting)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div className="print:page-break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2">Financing Activities</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between py-3 font-bold text-lg border-t-2">
                        <span>Cash from Financing</span>
                        <span>{formatCurrency(reportData.financingActivities.cashFromFinancing)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Change */}
                  <div className="pt-4 border-t-2 print:border-t print:pt-3 print:page-break-inside-avoid">
                    <div className="flex justify-between py-2">
                      <span>Net Change in Cash</span>
                      <span className={`font-bold text-xl print:text-lg ${reportData.netChangeInCash >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(reportData.netChangeInCash)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 mt-2">
                      <span>Beginning Cash</span>
                      <span className="font-medium">{formatCurrency(reportData.beginningCash)}</span>
                    </div>
                    <div className="flex justify-between py-3 font-bold text-xl mt-4 border-t-2 print:text-lg print:mt-3 print:border-t">
                      <span>Ending Cash</span>
                      <span>{formatCurrency(reportData.endingCash)}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="periods" className="space-y-4">
                  {reportData.periods.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.periods.map((period: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{period.period}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Net Income</span>
                              <span>{formatCurrency(period.netIncome)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cash from Operations</span>
                              <span>{formatCurrency(period.cashFromOperations)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cash from Investing</span>
                              <span>{formatCurrency(period.cashFromInvesting)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cash from Financing</span>
                              <span>{formatCurrency(period.cashFromFinancing)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2 mt-2">
                              <span>Net Change in Cash</span>
                              <span>{formatCurrency(period.netChangeInCash)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No period data available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

