"use client";

/**
 * Internal Executive Summary Report Modal
 * Owner view with detailed insights and strategic recommendations
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDate, formatDateTime, formatDateRange } from "@/lib/dateUtils";
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
import { useUser } from "@clerk/nextjs";

interface ExecutiveSummaryReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutiveSummaryReportModal({
  open,
  onOpenChange,
}: ExecutiveSummaryReportModalProps) {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userTimezone = currentUser?.preferences?.timezone;
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

  const reportData = useQuery(api.reports.getBankLenderReportData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  if (!reportData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Internal Executive Summary</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { businessProfile, financials, cashFlow, metrics } = reportData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Internal Executive Summary</DialogTitle>
          <DialogDescription>
            Owner view with detailed insights and strategic recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 print:hidden mb-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRangePreset} onValueChange={(v: any) => setDateRangePreset(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="12months">Last 12 months</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRangePreset === "custom" && (
              <>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="space-y-8 print:space-y-6">
          <section className="border-b border-border pb-6 print:page-break-after-always">
            <div className="text-center space-y-4">
              {businessProfile?.businessIcon && (
                <div className="flex justify-center mb-4">
                  <img
                    src={businessProfile.businessIcon}
                    alt="Business Logo"
                    className="h-32 w-32 md:h-40 md:w-40 mx-auto object-contain print:h-36 print:w-36"
                    style={{ maxWidth: '160px', maxHeight: '160px' }}
                  />
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground print:text-4xl">
                {businessProfile?.legalBusinessName || "Business Financial Summary"}
              </h1>
              <h2 className="text-xl font-semibold text-foreground">
                Internal Executive Summary
              </h2>
              <p className="text-lg text-muted-foreground">
                {formatDateRange(dateRange.start, dateRange.end, userTimezone)}
              </p>
            </div>
            <div className="mt-8 space-y-2 text-sm">
              <p>
                <strong>Prepared For:</strong> Internal Use Only
              </p>
              <p>
                <strong>Prepared By:</strong> {clerkUser?.firstName} {clerkUser?.lastName}
              </p>
              <p><strong>Generated On:</strong> {formatDateTime(new Date(), userTimezone)}</p>
            </div>
          </section>

          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${financials.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${financials.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${financials.netIncome >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                <div className="text-sm text-muted-foreground">Net Income</div>
                <div className={`text-2xl font-bold ${financials.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${financials.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Burn Rate & Runway Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Cash on Hand</div>
                <div className="text-2xl font-bold text-foreground">
                  ${cashFlow.totalCashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Monthly Burn Rate</div>
                <div className="text-2xl font-bold text-foreground">
                  ${cashFlow.averageMonthlyBurnRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </div>
              </div>
              {cashFlow.estimatedRunwayMonths !== null && (
                <div className={`p-4 rounded-lg ${cashFlow.estimatedRunwayMonths < 6 ? 'bg-red-50 dark:bg-red-950' : cashFlow.estimatedRunwayMonths < 12 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
                  <div className="text-sm text-muted-foreground">Estimated Runway</div>
                  <div className={`text-2xl font-bold ${cashFlow.estimatedRunwayMonths < 6 ? 'text-red-600 dark:text-red-400' : cashFlow.estimatedRunwayMonths < 12 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    {Math.round(cashFlow.estimatedRunwayMonths)} months
                  </div>
                </div>
              )}
            </div>
            {cashFlow.averageMonthlyBurnRate > 0 && cashFlow.estimatedRunwayMonths !== null && (
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-semibold mb-2">Runway Status:</p>
                <p>
                  At the current burn rate of ${Math.abs(cashFlow.averageMonthlyBurnRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month, 
                  the company has approximately {Math.round(cashFlow.estimatedRunwayMonths)} months of runway at its current cash balance.
                  {cashFlow.estimatedRunwayMonths < 6 && " ⚠️ Critical: Consider immediate fundraising or cost reduction."}
                  {cashFlow.estimatedRunwayMonths >= 6 && cashFlow.estimatedRunwayMonths < 12 && " ⚠️ Warning: Plan for fundraising within the next 3-6 months."}
                </p>
              </div>
            )}
          </section>

          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Key Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Net Margin</div>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.netMargin.toFixed(2)}%
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Average Monthly Revenue</div>
                <div className="text-2xl font-bold text-foreground">
                  ${metrics.averageMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Average Monthly Expenses</div>
                <div className="text-2xl font-bold text-foreground">
                  ${metrics.averageMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              {metrics.monthOverMonthGrowth !== null && (
                <div className={`p-4 rounded-lg ${metrics.monthOverMonthGrowth >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="text-sm text-muted-foreground">Month-over-Month Growth</div>
                  <div className={`text-2xl font-bold ${metrics.monthOverMonthGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metrics.monthOverMonthGrowth >= 0 ? '+' : ''}{metrics.monthOverMonthGrowth.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Top Expense Categories</h2>
            <ul className="space-y-2 text-sm">
              {financials.topExpenseCategories.length > 0 ? (
                financials.topExpenseCategories.map((item: { category: string; amount: number }, idx: number) => (
                  <li key={idx} className="flex justify-between p-2 bg-muted rounded">
                    <span>{item.category}</span>
                    <span className="font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">No expense data available</li>
              )}
            </ul>
          </section>

          <section className="pt-6">
            <div className="text-center text-xs text-muted-foreground border-t border-border pt-4 space-y-2">
              <div className="flex items-center justify-center gap-3">
                {businessProfile?.businessIcon && (
                  <img
                    src={businessProfile.businessIcon}
                    alt="Business Logo"
                    className="h-6 w-6 object-contain opacity-70"
                  />
                )}
                <p>{businessProfile?.legalBusinessName || "Business"} • Generated by EZ Financial • Confidential</p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

