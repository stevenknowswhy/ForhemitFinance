"use client";

/**
 * Balance Sheet Report Modal
 */

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateReportPDF } from "@/lib/pdfUtils";

interface BalanceSheetReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BalanceSheetReportModal({
  open,
  onOpenChange,
}: BalanceSheetReportModalProps) {
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const dateTimestamp = useMemo(() => {
    return new Date(asOfDate).getTime();
  }, [asOfDate]);

  // Fetch report data
  const reportData = useQuery(api.reports.getBalanceSheetData, {
    asOfDate: dateTimestamp,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("balance-sheet-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    if (!reportData) return;
    const asOfDateStr = formatDate(new Date(reportData.asOfDate));
    const filename = `balance-sheet-${asOfDateStr.replace(/\//g, "-")}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Balance Sheet",
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
            <DialogTitle>Balance Sheet</DialogTitle>
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
          <DialogTitle>Balance Sheet</DialogTitle>
          <DialogDescription>
            As of {formatDate(new Date(reportData.asOfDate))}
          </DialogDescription>
        </DialogHeader>

        <div id="balance-sheet-report-content" className="space-y-6 print:space-y-4">
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

          {/* Balance Check Alert */}
          {!reportData.isBalanced && (
            <Alert variant="destructive" className="print:border print:border-red-500">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Balance Sheet is not balanced. Difference: {formatCurrency(Math.abs(reportData.assets.total - reportData.totalLiabilitiesAndEquity))}
              </AlertDescription>
            </Alert>
          )}

          {reportData.isBalanced && (
            <Alert className="print:border print:border-green-500 print:hidden">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Balance Sheet is balanced.
              </AlertDescription>
            </Alert>
          )}

          {/* Report Content */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex justify-between items-center print:block">
                <CardTitle className="print:text-2xl print:mb-2">Balance Sheet</CardTitle>
                <div className="print:hidden">
                  <Button onClick={handleExport} variant="outline" size="sm">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-6">
                {/* Assets */}
                <div className="print:page-break-inside-avoid">
                  <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-2">Assets</h3>
                  <div className="space-y-2">
                    {reportData.assets.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b">
                        <span>{item.account}</span>
                        <span className="font-medium">{formatCurrency(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-3 font-bold text-lg mt-4 border-t-2">
                      <span>Total Assets</span>
                      <span>{formatCurrency(reportData.assets.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="print:page-break-inside-avoid">
                  <div className="mb-6 print:mb-4">
                    <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-2">Liabilities</h3>
                    <div className="space-y-2">
                      {reportData.liabilities.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.account}</span>
                          <span className="font-medium">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-3 font-bold text-lg mt-4 border-t-2">
                        <span>Total Liabilities</span>
                        <span>{formatCurrency(reportData.liabilities.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-2">Equity</h3>
                    <div className="space-y-2">
                      {reportData.equity.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <span>{item.account}</span>
                          <span className="font-medium">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 border-b">
                        <span>Retained Earnings</span>
                        <span className="font-medium">{formatCurrency(reportData.equity.retainedEarnings)}</span>
                      </div>
                      <div className="flex justify-between py-3 font-bold text-lg mt-4 border-t-2">
                        <span>Total Equity</span>
                        <span>{formatCurrency(reportData.equity.total + reportData.equity.retainedEarnings)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 font-bold text-xl mt-6 border-t-2 print:text-lg print:mt-4 print:border-t">
                    <span>Total Liabilities & Equity</span>
                    <span>{formatCurrency(reportData.totalLiabilitiesAndEquity)}</span>
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

