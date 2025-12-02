"use client";

/**
 * Burn Rate + Runway Report Modal
 */

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateReportPDF } from "@/lib/pdfUtils";

interface BurnRateRunwayReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BurnRateRunwayReportModal({
  open,
  onOpenChange,
}: BurnRateRunwayReportModalProps) {
  const [months, setMonths] = useState<number>(3);
  const [scenarioRevenueIncrease, setScenarioRevenueIncrease] = useState<number>(0);

  // Fetch report data
  const reportData = useQuery(api.reports.getBurnRateRunwayData, {
    months,
    scenarioRevenueIncrease: scenarioRevenueIncrease > 0 ? scenarioRevenueIncrease : undefined,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    const reportElement = document.getElementById("burn-rate-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `burn-rate-runway-${new Date().toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Burn Rate + Runway Report"
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
            <DialogTitle>Burn Rate + Runway Report</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const runwayStatus = reportData.runwayMonths
    ? reportData.runwayMonths < 3
      ? "critical"
      : reportData.runwayMonths < 6
      ? "warning"
      : "healthy"
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Burn Rate + Runway Report</DialogTitle>
          <DialogDescription>
            Track your monthly burn rate and cash runway
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Analysis Period (Months)</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 3)}
              />
            </div>
            <div>
              <Label>Scenario: Revenue Increase (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={scenarioRevenueIncrease}
                onChange={(e) => setScenarioRevenueIncrease(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 20 for 20%"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Current Monthly Burn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.currentMonthlyBurn)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Average: {formatCurrency(reportData.averageMonthlyBurn)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  runwayStatus === "critical" ? "text-red-600" :
                  runwayStatus === "warning" ? "text-orange-600" :
                  "text-green-600"
                }`}>
                  {reportData.runwayMonths ? `${reportData.runwayMonths.toFixed(1)} months` : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current Balance: {formatCurrency(reportData.endingBalance)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Burn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.totalBurn)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Over {months} months
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Runway Alert */}
          {runwayStatus === "critical" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical:</strong> You have less than 3 months of runway remaining. Consider raising capital or reducing expenses immediately.
              </AlertDescription>
            </Alert>
          )}

          {runwayStatus === "warning" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You have less than 6 months of runway. Start planning for fundraising or cost reduction.
              </AlertDescription>
            </Alert>
          )}

          {/* Scenario Analysis */}
          {reportData.scenario && reportData.scenario.scenarioRunway && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>If revenue increases by {reportData.scenario.revenueIncrease}%:</span>
                    <span className="font-semibold">
                      Runway: {reportData.scenario.scenarioRunway.toFixed(1)} months
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reportData.scenario.scenarioRunway > (reportData.runwayMonths || 0) ? (
                      <span className="text-green-600">
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Improvement of {(reportData.scenario.scenarioRunway - (reportData.runwayMonths || 0)).toFixed(1)} months
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        Decrease of {((reportData.runwayMonths || 0) - reportData.scenario.scenarioRunway).toFixed(1)} months
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.monthlyBurns.map((month: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{month.month}</div>
                      <div className="text-sm text-muted-foreground">
                        Revenue: {formatCurrency(month.revenue)} | Expenses: {formatCurrency(month.expenses)}
                      </div>
                    </div>
                    <div className={`font-semibold ${month.burn > 0 ? "text-red-600" : "text-green-600"}`}>
                      {month.burn > 0 ? "-" : "+"}{formatCurrency(Math.abs(month.burn))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

