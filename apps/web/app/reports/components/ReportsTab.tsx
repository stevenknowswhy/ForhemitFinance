"use client";

/**
 * Reports Tab Component
 * Landing page showing report template cards
 * Organized into categories users will intuitively understand
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
// import { useOrgIdOptional } from "@/hooks/useOrgId"; // Deprecated
import { useOrg } from "@/app/contexts/OrgContext";
// Report Modals
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
// FIXME: Re-enable when schema mismatches are resolved
// import { BankLenderReportModal } from "./BankLenderReportModal";
// import { CreditorVendorReportModal } from "./CreditorVendorReportModal";
// import { InvestorSummaryReportModal } from "./InvestorSummaryReportModal";
// import { ExecutiveSummaryReportModal } from "./ExecutiveSummaryReportModal";

import Link from "next/link";

// Map icon names to components
const iconMap: { [key: string]: React.ElementType } = {
  BookOpen,
  FileText,
  Sparkles,
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  Download,
  Eye,
  DollarSign,
  Scale,
  ArrowLeftRight,
  Calculator,
  Flame,
  Calendar,
  Receipt,
  FileCheck,
  ShoppingCart,
  ReceiptText,
  Briefcase,
};

function getModuleIcon(iconName: string | undefined): React.ElementType {
  if (!iconName) return FileText;
  const Icon = iconMap[iconName];
  return Icon || FileText;
}

// Modal Component Mapping
const REPORT_MODALS: { [key: string]: React.ElementType } = {
  "profit-loss": ProfitLossReportModal,
  "balance-sheet": BalanceSheetReportModal,
  "cash-flow": CashFlowReportModal,
  "general-ledger": GeneralLedgerReportModal,
  "trial-balance": TrialBalanceReportModal,
  "burn-rate-runway": BurnRateRunwayReportModal,
  "financial-summary": FinancialSummaryReportModal,
  "kpi-dashboard": KPIDashboardReportModal,
  "accounts-receivable": AccountsReceivableReportModal,
  "accounts-payable": AccountsPayableReportModal,
  "vendor-spend": VendorSpendAnalysisReportModal,
  "tax-preparation": TaxPreparationReportModal,
  "year-end-accountant": YearEndAccountantPackReportModal,
  // Disabled by default
  // "bank-lender": BankLenderReportModal,
  // "creditor-vendor": CreditorVendorReportModal,
  // "investor-summary": InvestorSummaryReportModal,
  // "executive-summary": ExecutiveSummaryReportModal,
};

export function ReportsTab() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showTransactionExport, setShowTransactionExport] = useState(false);
  const { currentOrgId: orgId } = useOrg();

  // GAP-004: Fetch report templates from Convex
  const templates = useQuery(api.reports.getAvailableReports, { orgId: orgId ?? undefined });

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

  // Derive grouped reports from fetched templates
  const coreFinancialReports = templates?.filter(t => t.config?.category === "core") || [];
  const businessHealthReports = templates?.filter(t => t.config?.category === "health") || [];
  const businessSnapshotReports = templates?.filter(t => t.config?.category === "snapshots") || [];

  const renderReportCard = (template: any) => {
    const Icon = getModuleIcon(template.config?.icon);
    const color = template.config?.color || "text-blue-600";

    return (
      <Card key={template.slug} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 ${color} mt-1 flex-shrink-0`} />
            <div className="flex-1">
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="mt-2">
                {template.config?.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => setSelectedReport(template.slug)}
            className="flex-1"
            disabled={!REPORT_MODALS[template.slug]} // Disable if no modal mapped
          >
            <Eye className="w-4 h-4 mr-2" />
            {REPORT_MODALS[template.slug] ? "View Report" : "Coming Soon"}
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

  // Helper to render selected modal
  const renderSelectedModal = () => {
    if (!selectedReport) return null;
    const ModalComponent = REPORT_MODALS[selectedReport];
    if (!ModalComponent) return null;

    return (
      <ModalComponent
        open={true}
        onOpenChange={(open: boolean) => !open && setSelectedReport(null)}
      />
    );
  };

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
                  {coreFinancialReports.length > 0 ? (
                    coreFinancialReports.map(renderReportCard)
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      Loading reports...
                    </div>
                  )}
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
                  {businessHealthReports.length > 0 ? (
                    businessHealthReports.map(renderReportCard)
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      Loading reports...
                    </div>
                  )}
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
                  {businessSnapshotReports.length > 0 ? (
                    businessSnapshotReports.map(renderReportCard)
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      Loading reports...
                    </div>
                  )}
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

      {/* Dynamic Report Modal */}
      {renderSelectedModal()}

      {/* Transaction Export Modal */}
      <TransactionExportModal
        open={showTransactionExport}
        onOpenChange={setShowTransactionExport}
      />
    </div>
  );
}

