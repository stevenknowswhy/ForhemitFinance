"use client";

/**
 * Year-End Accountant Pack Report Modal
 * Complete package for CPAs
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
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
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateReportPDF } from "@/lib/pdfUtils";

interface YearEndAccountantPackReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YearEndAccountantPackReportModal({
  open,
  onOpenChange,
}: YearEndAccountantPackReportModalProps) {
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());

  const reportData = useQuery(api.reports.getYearEndAccountantPackData, {
    taxYear,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportAll = async () => {
    const reportElement = document.getElementById("year-end-accountant-pack-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `year-end-accountant-pack-${new Date().getFullYear()}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Year-End Accountant Pack",
        `Fiscal Year: ${new Date().getFullYear()}`
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
            <DialogTitle>Year-End Accountant Pack</DialogTitle>
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
          <DialogTitle>Year-End Accountant Pack - {taxYear}</DialogTitle>
          <DialogDescription>
            Complete financial package for your CPA
          </DialogDescription>
        </DialogHeader>

        <div id="year-end-accountant-pack-content" className="space-y-6 print:space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-end print:hidden">
            <div className="w-48">
              <Label>Tax Year</Label>
              <Input
                type="number"
                min="2020"
                max={new Date().getFullYear()}
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>
            <Button onClick={handleExportAll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block print:mb-4">
            <h1 className="text-2xl font-bold">Year-End Accountant Pack</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fiscal Year: {taxYear}
            </p>
          </div>

          {/* Package Contents */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Complete Package:</strong> This report includes Trial Balance, General Ledger, P&L Statement, Balance Sheet, and Adjustments Log.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-5 print:hidden">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
              <TabsTrigger value="ledger">General Ledger</TabsTrigger>
              <TabsTrigger value="pnl">P&L Statement</TabsTrigger>
              <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Package Contents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Trial Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>General Ledger ({reportData.generalLedger.totalEntries} entries)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Profit & Loss Statement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Balance Sheet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Adjustments Log ({reportData.adjustmentsCount} entries)</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Net Income:</span>
                      <span className="font-semibold">
                        {formatCurrency(reportData.profitAndLoss?.netIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-semibold">
                        {formatCurrency(reportData.profitAndLoss?.revenue.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span className="font-semibold">
                        {formatCurrency(reportData.profitAndLoss?.expenses.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Assets:</span>
                      <span className="font-semibold">
                        {formatCurrency(reportData.balanceSheet?.assets.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trial Balance Status:</span>
                      <span className={`font-semibold ${
                        reportData.trialBalance?.isBalanced ? "text-green-600" : "text-red-600"
                      }`}>
                        {reportData.trialBalance?.isBalanced ? "Balanced" : "Not Balanced"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trial-balance">
              <Card>
                <CardHeader>
                  <CardTitle>Trial Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.trialBalance ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Total Debits: {formatCurrency(reportData.trialBalance.totals.debits)} | 
                        Total Credits: {formatCurrency(reportData.trialBalance.totals.credits)}
                      </div>
                      <div className="text-sm">
                        {reportData.trialBalance.entries.length} accounts
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No trial balance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ledger">
              <Card>
                <CardHeader>
                  <CardTitle>General Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {reportData.generalLedger.totalEntries} entries in the general ledger
                  </div>
                  <div className="mt-4 text-sm">
                    Use the General Ledger report for detailed line-by-line entries.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pnl">
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.profitAndLoss ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(reportData.profitAndLoss.revenue.total)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Expenses</div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(reportData.profitAndLoss.expenses.total)}
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground">Net Income</div>
                        <div className={`text-2xl font-bold ${
                          reportData.profitAndLoss.netIncome >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(reportData.profitAndLoss.netIncome)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No P&L data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adjustments">
              <Card>
                <CardHeader>
                  <CardTitle>Adjustments Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.adjustments.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.adjustments.map((adj: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="font-medium">{adj.memo}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(adj.date).toLocaleDateString()}
                          </div>
                          <div className="mt-2 text-sm">
                            {adj.lines.length} line{adj.lines.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No adjustments recorded for {taxYear}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notes for Accountant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{reportData.notes}</p>
              <div className="mt-4">
                <Label>Additional Notes (Optional)</Label>
                <textarea
                  className="w-full mt-2 p-3 border rounded-md"
                  rows={4}
                  placeholder="Add any additional notes or explanations for your accountant..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

