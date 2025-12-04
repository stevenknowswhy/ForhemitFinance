/**
 * Reports Module Manifest
 * Financial reports and analytics
 */

import { ModuleManifest } from "../core/types";

export const reportsManifest: ModuleManifest = {
  id: "reports",
  version: "1.0.0",
  name: "Financial Reports",
  description: "Generate comprehensive financial reports including Profit & Loss, Balance Sheet, Cash Flow, and specialized business reports.",
  icon: "FileText",
  category: "analytics",

  // No dependencies
  dependencies: [],

  // Permissions required for this module
  permissions: [
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
  ],

  // Routes provided by this module
  routes: [
    {
      path: "/reports",
      label: "Reports",
      requiresAuth: true,
      requiresPermission: "VIEW_REPORTS",
    },
    {
      path: "/reports?tab=reports",
      label: "Reports Tab",
      requiresAuth: true,
      requiresPermission: "VIEW_REPORTS",
    },
  ],

  // Navigation items
  navigation: [
    {
      id: "reports",
      label: "Reports",
      href: "/reports",
      icon: "FileText",
      order: 3,
      requiresPermission: "VIEW_REPORTS",
    },
  ],

  // Insights Sidebar Navigation
  insightsNavigation: {
    sidebarItems: [
      {
        id: "reports",
        label: "Reports",
        icon: "FileText",
        subSections: [
          { id: "reports-pl", label: "Profit & Loss", icon: "BarChart3" },
          { id: "reports-bs", label: "Balance Sheet", icon: "FileSpreadsheet" },
          { id: "reports-cf", label: "Cash Flow", icon: "ArrowLeftRight" },
          { id: "reports-advanced", label: "Advanced Reports", icon: "FileCheck" },
        ],
      },
    ],
  },

  // Billing: Free core reports, paid advanced reports (future)
  billing: {
    type: "free",
  },

  // Database tables used by this module (reports use existing accounting data)
  dataTables: [],

  // Feature flags
  featureFlags: {
    enablePDFExport: true,
    enableCSVExport: true,
    enableAdvancedReports: false, // Future paid feature
  },

  // Module metadata
  metadata: {
    reportTypes: [
      "profit-loss",
      "balance-sheet",
      "cash-flow",
      "general-ledger",
      "trial-balance",
      "burn-rate-runway",
      "financial-summary",
      "kpi-dashboard",
      "accounts-receivable",
      "accounts-payable",
      "vendor-spend-analysis",
      "tax-preparation",
      "year-end-accountant-pack",
      "bank-lender",
    ],
  },
};

