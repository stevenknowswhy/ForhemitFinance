"use client";

/**
 * Accounts Payable Summary Report Modal
 */

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { formatDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateReportPDF } from "@/lib/pdfUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AccountsPayableReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountsPayableReportModal({
  open,
  onOpenChange,
}: AccountsPayableReportModalProps) {
  const reportData = useQuery(api.reports.getAccountsPayableData, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("accounts-payable-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `accounts-payable-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Accounts Payable Summary"
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
            <DialogTitle>Accounts Payable Summary</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const overdueBills = reportData.outstandingBills.filter((bill: any) => bill.isOverdue);
  const upcomingBills = reportData.outstandingBills.filter((bill: any) => !bill.isOverdue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Accounts Payable Summary</DialogTitle>
          <DialogDescription>
            Outstanding bills and payment due dates
          </DialogDescription>
        </DialogHeader>

        <div id="accounts-payable-report-content" className="space-y-6 print:space-y-4">
          {reportData.note && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reportData.note}</AlertDescription>
            </Alert>
          )}

          {/* Report Header for Print */}
          <div className="hidden print:block print:mb-4">
            <h1 className="text-2xl font-bold">Accounts Payable Summary</h1>
          </div>

          {/* Summary */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="print:text-xl">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(reportData.totalOutstanding)}</div>
              {overdueBills.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {overdueBills.length} overdue bill{overdueBills.length !== 1 ? "s" : ""} totaling {formatCurrency(overdueBills.reduce((sum: number, b: any) => sum + b.amount, 0))}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Bills */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-xl print:mb-2">Outstanding Bills</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.outstandingBills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.outstandingBills.map((bill: any, idx: number) => (
                      <TableRow key={idx} className={bill.isOverdue ? "bg-red-50 dark:bg-red-950" : ""}>
                        <TableCell className="font-medium">{bill.vendor}</TableCell>
                        <TableCell>{formatCurrency(bill.amount)}</TableCell>
                        <TableCell>{formatDate(new Date(bill.date))}</TableCell>
                        <TableCell>{formatDate(new Date(bill.dueDate))}</TableCell>
                        <TableCell>
                          {bill.isOverdue ? (
                            <span className="text-red-600 font-semibold">Overdue</span>
                          ) : (
                            <span className="text-green-600">Upcoming</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No outstanding bills found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendors Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Vendors Owed</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.vendors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Total Owed</TableHead>
                      <TableHead>Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.vendors.map((vendor: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{vendor.vendor}</TableCell>
                        <TableCell>{formatCurrency(vendor.totalOwed)}</TableCell>
                        <TableCell>{vendor.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No vendor data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

