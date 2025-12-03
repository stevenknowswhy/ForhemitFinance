"use client";

/**
 * Creditor / Vendor Snapshot Report Modal
 * Quick financial overview for vendors and creditors
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
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

interface CreditorVendorReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditorVendorReportModal({
  open,
  onOpenChange,
}: CreditorVendorReportModalProps) {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userTimezone = currentUser?.preferences?.timezone;
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [preparedFor, setPreparedFor] = useState<string>("");

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
            <DialogTitle>Creditor / Vendor Snapshot</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { businessProfile, accounts, financials, cashFlow } = reportData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Creditor / Vendor Snapshot</DialogTitle>
          <DialogDescription>
            Quick financial overview for vendors and creditors
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
            <div>
              <Label htmlFor="preparedFor">Prepared For</Label>
              <Input
                id="preparedFor"
                placeholder="Vendor / Creditor Name"
                value={preparedFor}
                onChange={(e) => setPreparedFor(e.target.value)}
              />
            </div>
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
                {businessProfile?.legalBusinessName || "Business Financial Overview"}
              </h1>
              <h2 className="text-xl font-semibold text-foreground">
                Creditor / Vendor Snapshot
              </h2>
              <p className="text-lg text-muted-foreground">
                {formatDateRange(dateRange.start, dateRange.end, userTimezone)}
              </p>
            </div>
            <div className="mt-8 space-y-2 text-sm">
              {preparedFor && (
                <p><strong>Prepared For:</strong> {preparedFor}</p>
              )}
              <p>
                <strong>Prepared By:</strong> {clerkUser?.firstName} {clerkUser?.lastName}
                {businessProfile?.businessEmail && `, ${businessProfile.businessEmail}`}
              </p>
              <p><strong>Generated On:</strong> {formatDateTime(new Date(), userTimezone)}</p>
            </div>
          </section>

          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Cash Position</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Total Cash on Hand</div>
                <div className="text-2xl font-bold text-foreground">
                  ${cashFlow.totalCashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Average Monthly Revenue</div>
                <div className="text-2xl font-bold text-foreground">
                  ${(financials.revenue / Math.max(1, Math.ceil((dateRange.end - dateRange.start) / (30 * 24 * 60 * 60 * 1000)))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
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
                <p>{businessProfile?.legalBusinessName || "Business"} • Generated by EZ Financial</p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

