"use client";

/**
 * Accounts Receivable Summary Report Modal
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
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

interface AccountsReceivableReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountsReceivableReportModal({
  open,
  onOpenChange,
}: AccountsReceivableReportModalProps) {
  const reportData = useQuery(api.reports.getAccountsReceivableData, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("accounts-receivable-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `accounts-receivable-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Accounts Receivable Summary"
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
            <DialogTitle>Accounts Receivable Summary</DialogTitle>
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
          <DialogTitle>Accounts Receivable Summary</DialogTitle>
          <DialogDescription>
            Outstanding receivables and aging analysis
          </DialogDescription>
        </DialogHeader>

        <div id="accounts-receivable-report-content" className="space-y-6 print:space-y-4">
          {reportData.note && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reportData.note}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalOutstanding)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">0-30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.agingBuckets["0-30"])}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.agingBuckets["31-60"])}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">61-90 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.agingBuckets["61-90"])}</div>
              </CardContent>
            </Card>
          </div>

          {/* Customers Table */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-xl print:mb-2">Customers with Outstanding Balances</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.customers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Owed</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Oldest Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.customers.map((customer: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{customer.customer}</TableCell>
                        <TableCell>{formatCurrency(customer.totalOwed)}</TableCell>
                        <TableCell>{customer.transactions}</TableCell>
                        <TableCell>{formatDate(new Date(customer.oldestTransaction))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No outstanding receivables found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

