"use client";

/**
 * Vendor Spend Analysis Report Modal
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
import { generateReportPDF } from "@/lib/pdfUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VendorSpendAnalysisReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorSpendAnalysisReportModal({
  open,
  onOpenChange,
}: VendorSpendAnalysisReportModalProps) {
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

  const reportData = useQuery(api.reports.getVendorSpendAnalysisData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = ["Vendor", "Total Spent", "Transaction Count", "Average Transaction", "Last Transaction"];
    const rows = reportData.topVendors.map((vendor: any) => [
      vendor.vendor,
      formatCurrency(vendor.totalSpent),
      vendor.transactionCount.toString(),
      formatCurrency(vendor.averageTransaction),
      formatDate(new Date(vendor.lastTransaction)),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor-spend-analysis-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("vendor-spend-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    if (!reportData) return;
    const filename = `vendor-spend-analysis-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Vendor Spend Analysis"
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
            <DialogTitle>Vendor Spend Analysis</DialogTitle>
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
          <DialogTitle>Vendor Spend Analysis</DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
          </DialogDescription>
        </DialogHeader>

        <div id="vendor-spend-report-content" className="space-y-6 print:space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
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

            <div className="flex items-end gap-2">
              <Button onClick={handleExportCSV} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block print:mb-4">
            <h1 className="text-2xl font-bold">Vendor Spend Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
            </p>
          </div>

          {/* Summary */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="print:text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.totalSpend)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vendor Count</div>
                  <div className="text-2xl font-bold">{reportData.vendorCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average per Vendor</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportData.totalSpend / reportData.vendorCount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors Table */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="print:text-xl">Top Vendors by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.topVendors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead>Last Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topVendors.map((vendor: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{vendor.vendor}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(vendor.totalSpent)}
                        </TableCell>
                        <TableCell className="text-right">{vendor.transactionCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(vendor.averageTransaction)}
                        </TableCell>
                        <TableCell>{formatDate(new Date(vendor.lastTransaction))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No vendor spend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

