"use client";

/**
 * General Ledger Report Modal
 * Complete line-by-line dataset for accountants or auditors
 * Exportable to CSV/XLSX
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
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateReportPDF } from "@/lib/pdfUtils";

interface GeneralLedgerReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralLedgerReportModal({
  open,
  onOpenChange,
}: GeneralLedgerReportModalProps) {
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

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
  const reportData = useQuery(api.reports.getGeneralLedgerData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    accountId: selectedAccountId === "all" ? undefined : selectedAccountId as any,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = ["Date", "Entry ID", "Account", "Memo", "Debit", "Credit", "Balance"];
    const rows = reportData.entries.map((entry: any) => [
      formatDate(new Date(entry.date)),
      entry.entryId,
      entry.account,
      entry.memo,
      entry.debit > 0 ? formatCurrency(entry.debit) : "",
      entry.credit > 0 ? formatCurrency(entry.credit) : "",
      formatCurrency(entry.balance),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `general-ledger-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = async () => {
    // For XLSX export, we'd need a library like xlsx
    // For now, we'll show an alert
    alert("XLSX export requires additional library. CSV export is available.");
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("general-ledger-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    if (!reportData) return;
    const dateRangeStr = formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end));
    const accountFilter = reportData.accountId ? "-filtered" : "";
    const filename = `general-ledger${accountFilter}-${new Date(reportData.dateRange.start).toISOString().split("T")[0]}-to-${new Date(reportData.dateRange.end).toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "General Ledger",
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>General Ledger</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>General Ledger</DialogTitle>
          <DialogDescription>
            {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
            {reportData.accountId && ` - Filtered by Account`}
          </DialogDescription>
        </DialogHeader>

        <div id="general-ledger-report-content" className="space-y-6 print:space-y-4">
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
              <Label>Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={(value) => setSelectedAccountId(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {reportData.accounts.map((account: any) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Content */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-2xl print:mb-2">General Ledger</CardTitle>
                <div className="flex gap-2 print:hidden">
                  <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportXLSX} variant="outline" size="sm">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export XLSX
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground print:text-xs print:mt-1">
                {formatDateRange(new Date(reportData.dateRange.start), new Date(reportData.dateRange.end))}
                {reportData.accountId && ` • Filtered by Account`}
              </div>
            </CardHeader>
            <CardContent className="print:p-4">
              {reportData.entries.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No entries found for the selected date range and account.
                </div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <Table className="print:text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Entry ID</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Memo</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        {reportData.accountId && (
                          <TableHead className="text-right">Balance</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.entries.map((entry: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(new Date(entry.date))}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.entryId.slice(-8)}
                          </TableCell>
                          <TableCell>{entry.account}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.memo}</TableCell>
                          <TableCell className="text-right">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                          </TableCell>
                          {reportData.accountId && (
                            <TableCell className="text-right font-medium">
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                Total Entries: {reportData.entries.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

