"use client";

/**
 * Trial Balance Report Modal
 * Essential for accountants - supports error-checking and journal entry review
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDate } from "@/lib/dateUtils";
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
import { Download, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateReportPDF } from "@/lib/pdfUtils";

interface TrialBalanceReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialBalanceReportModal({
  open,
  onOpenChange,
}: TrialBalanceReportModalProps) {
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const dateTimestamp = useMemo(() => {
    return new Date(asOfDate).getTime();
  }, [asOfDate]);

  // Fetch report data
  const reportData = useQuery(api.reports.getTrialBalanceData, {
    asOfDate: dateTimestamp,
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

    const headers = ["Account", "Account Type", "Debit", "Credit"];
    const rows = reportData.entries.map((entry: any) => [
      entry.account,
      entry.accountType,
      entry.debit > 0 ? formatCurrency(entry.debit) : "",
      entry.credit > 0 ? formatCurrency(entry.credit) : "",
    ]);

    // Add totals row
    rows.push([
      "TOTALS",
      "",
      formatCurrency(reportData.totals.debits),
      formatCurrency(reportData.totals.credits),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trial-balance-${asOfDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("trial-balance-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    if (!reportData) return;
    const asOfDateStr = formatDate(new Date(reportData.asOfDate));
    const filename = `trial-balance-${asOfDateStr.replace(/\//g, "-")}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Trial Balance",
        `As of ${asOfDateStr}`
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
            <DialogTitle>Trial Balance</DialogTitle>
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
          <DialogTitle>Trial Balance</DialogTitle>
          <DialogDescription>
            As of {formatDate(new Date(reportData.asOfDate))}
          </DialogDescription>
        </DialogHeader>

        <div id="trial-balance-report-content" className="space-y-6 print:space-y-4">
          {/* Date Selector */}
          <div className="print:hidden">
            <Label>As of Date</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Balance Check Alerts */}
          {!reportData.isBalanced && (
            <Alert variant="destructive" className="print:border print:border-red-500">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Trial Balance is NOT Balanced</div>
                <div>
                  Debits: {formatCurrency(reportData.totals.debits)} | 
                  Credits: {formatCurrency(reportData.totals.credits)} | 
                  Difference: {formatCurrency(Math.abs(reportData.difference))}
                </div>
                <div className="mt-2 text-sm">
                  This indicates there may be errors in journal entries. Please review all entries for accuracy.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {reportData.isBalanced && (
            <Alert className="print:border print:border-green-500 print:hidden">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">Trial Balance is Balanced</div>
                <div>
                  Debits: {formatCurrency(reportData.totals.debits)} = 
                  Credits: {formatCurrency(reportData.totals.credits)}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {reportData.difference !== 0 && Math.abs(reportData.difference) < 0.01 && (
            <Alert className="print:hidden">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Trial Balance is balanced within rounding tolerance.
                Small differences may be due to floating-point precision.
              </AlertDescription>
            </Alert>
          )}

          {/* Report Content */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-2xl print:mb-2">Trial Balance</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExportCSV} variant="outline" size="sm" className="mr-2">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground print:text-xs print:mt-1">
                As of {formatDate(new Date(reportData.asOfDate))}
              </div>
            </CardHeader>
            <CardContent className="print:p-4">
              <div className="overflow-x-auto print:overflow-visible">
                <Table className="print:text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.entries.map((entry: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{entry.account}</TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {entry.accountType}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 print:border-t">
                      <TableCell colSpan={2}>TOTALS</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportData.totals.debits)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportData.totals.credits)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Summary Information */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg print:bg-transparent print:border print:border-gray-300 print:rounded">
                <div>
                  <div className="text-sm text-muted-foreground">Total Debits</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(reportData.totals.debits)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Credits</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(reportData.totals.credits)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Difference</div>
                  <div className={`text-lg font-semibold ${reportData.isBalanced ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(reportData.difference)}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Total Accounts: {reportData.entries.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

