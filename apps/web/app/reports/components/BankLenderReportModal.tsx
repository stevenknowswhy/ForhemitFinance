"use client";

/**
 * Bank/Lender Application Snapshot Report Modal
 * Full report with all sections as specified
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
import { Download, Edit2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { generateReportPDF } from "@/lib/pdfUtils";

interface BankLenderReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankLenderReportModal({
  open,
  onOpenChange,
}: BankLenderReportModalProps) {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userTimezone = currentUser?.preferences?.timezone;
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [preparedFor, setPreparedFor] = useState<string>("");
  const [businessSummary, setBusinessSummary] = useState<string>("");
  const [notes, setNotes] = useState<{
    majorChanges: string;
    newContracts: string;
    oneTimeExpenses: string;
    futureFinancing: string;
  }>({
    majorChanges: "",
    newContracts: "",
    oneTimeExpenses: "",
    futureFinancing: "",
  });

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
  const reportData = useQuery(api.reports.getBankLenderReportData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Auto-generate business summary if not set
  const finalBusinessSummary = useMemo(() => {
    if (businessSummary) return businessSummary;
    if (!reportData?.businessProfile) return "";
    
    const profile = reportData.businessProfile;
    const parts: string[] = [];
    
    if (profile.legalBusinessName) {
      parts.push(profile.legalBusinessName);
    }
    if (profile.businessCategory) {
      parts.push(`operates in the ${profile.businessCategory} industry`);
    }
    if (profile.dateOfIncorporation) {
      const years = Math.floor((Date.now() - new Date(profile.dateOfIncorporation).getTime()) / (365 * 24 * 60 * 60 * 1000));
      if (years > 0) {
        parts.push(`with ${years} years of operation`);
      }
    }
    if (profile.businessDescription) {
      parts.push(profile.businessDescription);
    }
    
    return parts.join(". ") + ".";
  }, [businessSummary, reportData?.businessProfile]);

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("bank-lender-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const dateRangeStr = formatDateRange(dateRange.start, dateRange.end, userTimezone);
    const filename = `bank-lender-snapshot-${new Date(dateRange.start).toISOString().split("T")[0]}-to-${new Date(dateRange.end).toISOString().split("T")[0]}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Bank / Lender Application Snapshot",
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bank / Lender Application Snapshot</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { businessProfile, accounts, financials, cashFlow, metrics } = reportData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Bank / Lender Application Snapshot</DialogTitle>
          <DialogDescription>
            Configure and preview your financial report
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Section - Hidden in print */}
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
                placeholder="Bank / Lender Name"
                value={preparedFor}
                onChange={(e) => setPreparedFor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div id="bank-lender-report-content" className="space-y-8 print:space-y-6">
          {/* Cover Page */}
          <section className="border-b border-border pb-6 print:page-break-after-always">
            <div className="text-center space-y-6">
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
                {businessProfile?.legalBusinessName || "Business Financial Snapshot"}
              </h1>
              {businessProfile?.dbaTradeName && (
                <p className="text-lg text-muted-foreground">
                  DBA: {businessProfile.dbaTradeName}
                </p>
              )}
              <h2 className="text-xl font-semibold text-foreground">
                Bank / Lender Application Snapshot
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
                {businessProfile?.businessPhone && `, ${businessProfile.businessPhone}`}
              </p>
              <p><strong>Generated On:</strong> {formatDateTime(new Date(), userTimezone)}</p>
            </div>
            <div className="mt-6 p-4 bg-muted rounded text-xs text-muted-foreground">
              <p><strong>Disclaimer:</strong> This report has been prepared from internal bookkeeping data and has not been audited. The information presented is based on data available at the time of generation and may be subject to change.</p>
            </div>
          </section>

          {/* Section 1: Business Overview */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Business Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Legal Business Name:</strong> {businessProfile?.legalBusinessName || "N/A"}
              </div>
              {businessProfile?.dbaTradeName && (
                <div>
                  <strong>DBA (Trade Name):</strong> {businessProfile.dbaTradeName}
                </div>
              )}
              <div>
                <strong>Entity Type:</strong> {businessProfile?.entityType || "N/A"}
              </div>
              <div>
                <strong>Formation Date:</strong> {businessProfile?.dateOfIncorporation ? formatDate(new Date(businessProfile.dateOfIncorporation), userTimezone) : "N/A"}
              </div>
              <div>
                <strong>State of Incorporation:</strong> {businessProfile?.filingState || "N/A"}
              </div>
              <div>
                <strong>NAICS Code:</strong> {businessProfile?.naicsCode || "N/A"}
              </div>
              <div>
                <strong>Business Address:</strong> {businessProfile?.headquartersAddress || businessProfile?.registeredAddress || "N/A"}
              </div>
              <div>
                <strong>Website:</strong> {businessProfile?.businessWebsite || "N/A"}
              </div>
              <div>
                <strong>Contact Email:</strong> {businessProfile?.businessEmail || "N/A"}
              </div>
              <div>
                <strong>Contact Phone:</strong> {businessProfile?.businessPhone || "N/A"}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-start gap-2">
                <strong>Business Summary:</strong>
                <Edit2 className="w-4 h-4 text-muted-foreground print:hidden" />
              </div>
              <textarea
                className="w-full mt-2 p-2 border border-border rounded bg-background text-sm min-h-[100px]"
                value={finalBusinessSummary}
                onChange={(e) => setBusinessSummary(e.target.value)}
                placeholder="Auto-generated business summary. Click to edit."
              />
            </div>
          </section>

          {/* Section 2: Owner / Principal Information */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Owner / Principal Information</h2>
            {businessProfile?.owners && businessProfile.owners.length > 0 ? (
              <div className="space-y-4">
                {businessProfile.owners.map((owner: { name: string; role?: string; ownershipPercentage?: string; linkedIn?: string }, idx: number) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {owner.name}</div>
                      {owner.role && <div><strong>Title/Role:</strong> {owner.role}</div>}
                      {owner.ownershipPercentage && (
                        <div><strong>Ownership Percentage:</strong> {owner.ownershipPercentage}%</div>
                      )}
                      {owner.linkedIn && (
                        <div><strong>LinkedIn:</strong> {owner.linkedIn}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No owner information available. Please update your business profile.</p>
            )}
          </section>

          {/* Section 3: Banking & Accounts Snapshot */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Banking & Accounts Snapshot</h2>
            {accounts.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2">Bank/Institution</th>
                        <th className="text-left p-2">Account Type</th>
                        <th className="text-left p-2">Account Number</th>
                        <th className="text-right p-2">Current Balance</th>
                        <th className="text-right p-2">Available Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account: { _id: string; type: string; bankName?: string; accountType?: string; accountNumber?: string; balance: number; availableBalance?: number }) => (
                        <tr key={account._id} className="border-b border-border">
                          <td className="p-2">{account.bankName || "N/A"}</td>
                          <td className="p-2">{account.accountType || account.type}</td>
                          <td className="p-2">
                            {account.accountNumber ? `••••${account.accountNumber}` : "N/A"}
                          </td>
                          <td className="p-2 text-right">
                            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right">
                            {account.availableBalance ? `$${account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                  <div>
                    <strong>Total Cash on Hand:</strong>
                    <p className="text-lg font-semibold text-foreground">
                      ${cashFlow.totalCashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <strong>Total Available Credit:</strong>
                    <p className="text-lg font-semibold text-foreground">
                      ${cashFlow.totalAvailableCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <strong>Total Outstanding Balances:</strong>
                    <p className="text-lg font-semibold text-foreground">
                      ${cashFlow.totalOutstandingBalances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No accounts connected. Please connect a bank account to see account information.</p>
            )}
          </section>

          {/* Section 4: Revenue & Expense Summary */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Revenue & Expense Summary</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Top 5 Revenue Categories</h3>
                <ul className="space-y-1 text-sm">
                  {financials.topRevenueCategories.length > 0 ? (
                    financials.topRevenueCategories.map((item: { category: string; amount: number }, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.category}</span>
                        <span className="font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No revenue data available</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Top 5 Expense Categories</h3>
                <ul className="space-y-1 text-sm">
                  {financials.topExpenseCategories.length > 0 ? (
                    financials.topExpenseCategories.map((item: { category: string; amount: number }, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.category}</span>
                        <span className="font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No expense data available</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Cash Flow Snapshot */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Cash Flow Snapshot</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Average Monthly Burn Rate:</strong>
                  <p className="text-lg font-semibold text-foreground">
                    ${cashFlow.averageMonthlyBurnRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month
                  </p>
                </div>
                {cashFlow.estimatedRunwayMonths !== null && (
                  <div>
                    <strong>Estimated Runway:</strong>
                    <p className="text-lg font-semibold text-foreground">
                      {Math.round(cashFlow.estimatedRunwayMonths)} months
                    </p>
                  </div>
                )}
              </div>
              {cashFlow.averageMonthlyBurnRate > 0 && cashFlow.estimatedRunwayMonths !== null && (
                <div className="p-4 bg-muted rounded-lg text-sm">
                  <p>
                    At the current burn rate of ${Math.abs(cashFlow.averageMonthlyBurnRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month, 
                    the company has approximately {Math.round(cashFlow.estimatedRunwayMonths)} months of runway at its current cash balance.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 6: Liabilities & Obligations */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Liabilities & Obligations</h2>
            {accounts.filter((a: { type: string }) => a.type === "liability").length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2">Lender Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">Current Balance</th>
                        <th className="text-right p-2">Credit Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.filter((a: { type: string }) => a.type === "liability").map((account: { _id: string; type: string; bankName?: string; accountType?: string; balance: number; availableBalance?: number }) => (
                        <tr key={account._id} className="border-b border-border">
                          <td className="p-2">{account.bankName || "N/A"}</td>
                          <td className="p-2">{account.accountType || "Credit Line"}</td>
                          <td className="p-2 text-right">
                            ${Math.abs(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right">
                            {account.availableBalance ? `$${account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Total Liabilities:</strong>
                      <p className="text-lg font-semibold text-foreground">
                        ${cashFlow.totalOutstandingBalances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No liabilities recorded.</p>
            )}
          </section>

          {/* Section 7: Key Ratios & Metrics */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Key Ratios & Metrics</h2>
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
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Month-over-Month Revenue Growth</div>
                  <div className={`text-2xl font-bold ${metrics.monthOverMonthGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metrics.monthOverMonthGrowth >= 0 ? '+' : ''}{metrics.monthOverMonthGrowth.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 8: Notes & Explanations */}
          <section className="border-b border-border pb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Notes & Explanations</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="majorChanges">Major changes/events in this period</Label>
                <textarea
                  id="majorChanges"
                  className="w-full mt-2 p-2 border border-border rounded bg-background text-sm min-h-[80px]"
                  value={notes.majorChanges}
                  onChange={(e) => setNotes({ ...notes, majorChanges: e.target.value })}
                  placeholder="Describe any major changes or events..."
                />
              </div>
              <div>
                <Label htmlFor="newContracts">New contracts or customers</Label>
                <textarea
                  id="newContracts"
                  className="w-full mt-2 p-2 border border-border rounded bg-background text-sm min-h-[80px]"
                  value={notes.newContracts}
                  onChange={(e) => setNotes({ ...notes, newContracts: e.target.value })}
                  placeholder="Describe new contracts or customers..."
                />
              </div>
              <div>
                <Label htmlFor="oneTimeExpenses">One-time or non-recurring expenses</Label>
                <textarea
                  id="oneTimeExpenses"
                  className="w-full mt-2 p-2 border border-border rounded bg-background text-sm min-h-[80px]"
                  value={notes.oneTimeExpenses}
                  onChange={(e) => setNotes({ ...notes, oneTimeExpenses: e.target.value })}
                  placeholder="Describe one-time expenses..."
                />
              </div>
              <div>
                <Label htmlFor="futureFinancing">Planned future financing needs</Label>
                <textarea
                  id="futureFinancing"
                  className="w-full mt-2 p-2 border border-border rounded bg-background text-sm min-h-[80px]"
                  value={notes.futureFinancing}
                  onChange={(e) => setNotes({ ...notes, futureFinancing: e.target.value })}
                  placeholder="Describe future financing plans..."
                />
              </div>
            </div>
          </section>

          {/* Footer */}
          <section className="pt-6 print:page-break-before-auto">
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
              <p className="mt-2">This report is confidential and intended solely for the use of the recipient.</p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

