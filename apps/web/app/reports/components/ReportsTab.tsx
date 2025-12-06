"use client";

/**
 * Reports Tab Component
 * Landing page showing report template cards
 * Organized into categories users will intuitively understand
 */

import { useState } from "react";
import {
  FileText,
  Building2,
  Users,
  TrendingUp,
  Download,
  Eye,
  DollarSign,
  Scale,
  ArrowLeftRight,
  BookOpen,
  Calculator,
  Flame,
  Calendar,
  BarChart3,
  Receipt,
  FileCheck,
  ShoppingCart,
  ReceiptText,
  Briefcase,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useModuleStatuses } from "@/hooks/useEnabledModules";
// import { BankLenderReportModal } from "./BankLenderReportModal"; // FIXME: Schema mismatches
// import { CreditorVendorReportModal } from "./CreditorVendorReportModal"; // FIXME: Schema mismatches
// import { InvestorSummaryReportModal } from "./InvestorSummaryReportModal"; // FIXME: Schema mismatches
// import { ExecutiveSummaryReportModal } from "./ExecutiveSummaryReportModal"; // FIXME: Schema mismatches
import { ProfitLossReportModal } from "./ProfitLossReportModal";
import { BalanceSheetReportModal } from "./BalanceSheetReportModal";
import { CashFlowReportModal } from "./CashFlowReportModal";
import { GeneralLedgerReportModal } from "./GeneralLedgerReportModal";
import { TrialBalanceReportModal } from "./TrialBalanceReportModal";
import { BurnRateRunwayReportModal } from "./BurnRateRunwayReportModal";
import { FinancialSummaryReportModal } from "./FinancialSummaryReportModal";
import { KPIDashboardReportModal } from "./KPIDashboardReportModal";
import { AccountsReceivableReportModal } from "./AccountsReceivableReportModal";
import { AccountsPayableReportModal } from "./AccountsPayableReportModal";
import { VendorSpendAnalysisReportModal } from "./VendorSpendAnalysisReportModal";
import { TaxPreparationReportModal } from "./TaxPreparationReportModal";
import { YearEndAccountantPackReportModal } from "./YearEndAccountantPackReportModal";
import { TransactionExportModal } from "./TransactionExportModal";
import Link from "next/link";

// Map icon names to components
const iconMap: { [key: string]: React.ElementType } = {
  BookOpen,
  FileText,
  Sparkles,
  BarChart3,
  TrendingUp,
};

function getModuleIcon(iconName: string | undefined): React.ElementType {
  if (!iconName) return FileText;
  const Icon = iconMap[iconName];
  return Icon || FileText;
}

export function ReportsTab() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showTransactionExport, setShowTransactionExport] = useState(false);
  const { modules: moduleStatuses, isLoading: isLoadingModules } = useModuleStatuses();

  // Get enabled modules that contribute to Insights
  // A module must pass ALL three checks to appear:
  // 1. isOrgEnabled: Module is enabled at the organization level
  // 2. isUserEnabled: User hasn't hidden it via personal preference (defaults to org setting)
  // 3. hasEntitlement: User's plan includes this module (always true for free modules)
  const enabledModules = moduleStatuses.filter((moduleStatus) => {
    return (
      moduleStatus.isOrgEnabled &&
      moduleStatus.isUserEnabled &&
      moduleStatus.hasEntitlement
    );
  });

  // Check if Reports module is enabled (for showing report categories)
  const reportsModuleEnabled = enabledModules.some(
    (m) => m.manifest.id === "reports"
  );

  // Get enabled addon modules (modules other than "reports" that contribute Insights)
  const enabledAddonModules = enabledModules.filter(
    (moduleStatus) => moduleStatus.manifest.id !== "reports"
  );

  // Core Financial Reports (Business)
  const coreFinancialReports = [
    {
      id: "profit-loss",
      title: "Profit & Loss (P&L) Statement",
      description: "Selectable date range, filters for business vs personal vs blended, simple and advanced modes, breakdown by category/product/revenue stream.",
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Auto-generated from accounts & liabilities. Realistic, simplified layout for new businesses.",
      icon: Scale,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "cash-flow",
      title: "Cash Flow Statement",
      description: "Indirect method. Monthly or quarterly versions. Essential for lenders and investors.",
      icon: ArrowLeftRight,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "general-ledger",
      title: "General Ledger Report",
      description: "Complete line-by-line dataset for accountants or auditors. Exportable to CSV/XLSX.",
      icon: BookOpen,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Essential for accountants. Supports error-checking and journal entry review.",
      icon: Calculator,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  // Business Health & Operations Reports
  const businessHealthReports = [
    {
      id: "burn-rate-runway",
      title: "Burn Rate + Runway Report",
      description: "Monthly burn, average burn, estimated runway, scenario toggles for 'what if' analysis.",
      icon: Flame,
      color: "text-red-600 dark:text-red-400",
    },
    {
      id: "financial-summary",
      title: "Monthly / Quarterly Financial Summary",
      description: "Management report with revenue, expenses, profit, cash flow, top categories, and trends.",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "kpi-dashboard",
      title: "Business KPI Dashboard",
      description: "CAC, LTV, gross margin, revenue growth, ARPU, churn, owner compensation. Perfect for founders.",
      icon: BarChart3,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "accounts-receivable",
      title: "Accounts Receivable Summary",
      description: "Outstanding invoices, aging buckets (0-30, 31-60, etc.), customers who owe money.",
      icon: Receipt,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "accounts-payable",
      title: "Accounts Payable Summary",
      description: "Outstanding bills, due dates, vendors owed. Track what you need to pay.",
      icon: FileCheck,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "vendor-spend",
      title: "Vendor Spend Analysis",
      description: "Top vendors, total spent by vendor. Perfect for contract renegotiations.",
      icon: ShoppingCart,
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "tax-preparation",
      title: "Tax Preparation Packet",
      description: "Hero feature: Profit, expenses, mileage, deductible categories, home office summary. PDF + CSV.",
      icon: ReceiptText,
      color: "text-pink-600 dark:text-pink-400",
    },
    {
      id: "year-end-accountant",
      title: "Year-End Accountant Pack",
      description: "Designed for CPAs: Trial balance, ledger, P&L, balance sheet, adjustments log, notes from owner.",
      icon: Briefcase,
      color: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  // Business Snapshot Reports
  const businessSnapshotReports = [
    {
      id: "bank-lender",
      title: "Bank / Lender Application Snapshot",
      description: "Designed for bank underwriters asking for last 12 months performance, liabilities, and cash position.",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "creditor-vendor",
      title: "Creditor / Vendor Snapshot",
      description: "Quick financial overview for vendors and creditors requesting payment terms or credit applications.",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "investor-summary",
      title: "Investor Summary",
      description: "Comprehensive financial summary highlighting growth metrics, revenue trends, and business outlook.",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "executive-summary",
      title: "Internal Executive Summary",
      description: "Owner view with detailed insights, burn rate analysis, runway projections, and strategic recommendations.",
      icon: FileText,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  const renderReportCard = (template: typeof coreFinancialReports[0]) => {
    const Icon = template.icon;
    return (
      <Card key={template.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 ${template.color} mt-1 flex-shrink-0`} />
            <div className="flex-1">
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="mt-2">
                {template.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => setSelectedReport(template.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Report
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // If no modules are enabled, show empty state
  if (!isLoadingModules && enabledModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">No Insights Available</CardTitle>
            <CardDescription className="text-center mt-2">
              Enable insights modules from the marketplace to start generating reports and stories
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/add-ons">
              <Button className="w-full" size="lg">
                <Store className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {reportsModuleEnabled && (
        <>
          <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Financial Reports
              </h2>
              <p className="text-muted-foreground">
                Generate bank-ready, standardized reports that auto-fill from your business data
              </p>
            </div>
            <Button
              onClick={() => setShowTransactionExport(true)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export Transactions</span>
            </Button>
          </div>

          <Tabs defaultValue="core" className="w-full">
            <TabsList className={`grid w-full mb-6 ${enabledAddonModules.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="core">Core Financial Reports</TabsTrigger>
              <TabsTrigger value="health">Business Health & Operations</TabsTrigger>
              <TabsTrigger value="snapshots">Business Snapshots</TabsTrigger>
              {enabledAddonModules.length > 0 && (
                <TabsTrigger value="addons">Add-ons</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="core" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Core Financial Reports (Business + Personal)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These are the bread-and-butter reports banks and accountants expect.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coreFinancialReports.map(renderReportCard)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Health & Operations Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Essential reports for managing your business operations and preparing for tax season.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessHealthReports.map(renderReportCard)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Snapshot Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quick financial overviews for specific business needs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessSnapshotReports.map(renderReportCard)}
                </div>
              </div>
            </TabsContent>

            {enabledAddonModules.length > 0 && (
              <TabsContent value="addons" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Enabled Add-ons</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Additional insights and features from enabled add-on modules.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enabledAddonModules.map((moduleStatus) => {
                      const { manifest, isOrgEnabled } = moduleStatus;
                      const Icon = getModuleIcon(manifest.icon);

                      // Determine the route/link for this module
                      // Check if it has a route to the reports page, otherwise use its main route
                      const reportsRoute = manifest.routes?.find(r => r.path?.includes("/reports"));
                      const mainRoute = manifest.routes?.[0]?.path || manifest.navigation?.[0]?.href || "#";
                      // Use reports route if available (e.g., "/reports?tab=stories"), otherwise use main route
                      const moduleLink = reportsRoute?.path || mainRoute;

                      return (
                        <Card key={manifest.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{manifest.name}</CardTitle>
                                  {isOrgEnabled && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Enabled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <CardDescription className="mt-2">
                              {manifest.description}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Link href={moduleLink} className="w-full">
                              <Button className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                View {manifest.name}
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}

      {/* Show addon modules even if Reports is not enabled */}
      {!reportsModuleEnabled && enabledAddonModules.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Insights
          </h2>
          <p className="text-muted-foreground mb-6">
            Available insights from enabled modules
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledAddonModules.map((moduleStatus) => {
              const { manifest, isOrgEnabled } = moduleStatus;
              const Icon = getModuleIcon(manifest.icon);

              const reportsRoute = manifest.routes?.find(r => r.path?.includes("/reports"));
              const mainRoute = manifest.routes?.[0]?.path || manifest.navigation?.[0]?.href || "#";
              const moduleLink = reportsRoute?.path || mainRoute;

              return (
                <Card key={manifest.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{manifest.name}</CardTitle>
                          {isOrgEnabled && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Enabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {manifest.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href={moduleLink} className="w-full">
                      <Button className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View {manifest.name}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Core Financial Report Modals */}
      {selectedReport === "profit-loss" && (
        <ProfitLossReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "balance-sheet" && (
        <BalanceSheetReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "cash-flow" && (
        <CashFlowReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "general-ledger" && (
        <GeneralLedgerReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "trial-balance" && (
        <TrialBalanceReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}

      {/* Business Health & Operations Report Modals */}
      {selectedReport === "burn-rate-runway" && (
        <BurnRateRunwayReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "financial-summary" && (
        <FinancialSummaryReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "kpi-dashboard" && (
        <KPIDashboardReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "accounts-receivable" && (
        <AccountsReceivableReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "accounts-payable" && (
        <AccountsPayableReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "vendor-spend" && (
        <VendorSpendAnalysisReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "tax-preparation" && (
        <TaxPreparationReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
      {selectedReport === "year-end-accountant" && (
        <YearEndAccountantPackReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}

      {/* Business Snapshot Report Modals */}
      {/* FIXME: BankLenderReportModal disabled due to schema mismatches */}
      {/* selectedReport === "bank-lender" && (
        <BankLenderReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      ) */}
      {/* FIXME: Additional disabled modals */}
      {/* selectedReport === "creditor-vendor" && (
        <CreditorVendorReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      ) */}
      {/* selectedReport === "investor-summary" && (
        <InvestorSummaryReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      ) */}
      {/* selectedReport === "executive-summary" && (
        <ExecutiveSummaryReportModal
          open={true}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      ) */}

      {/* Transaction Export Modal */}
      <TransactionExportModal
        open={showTransactionExport}
        onOpenChange={setShowTransactionExport}
      />
    </div>
  );
}

