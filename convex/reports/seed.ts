import { internalMutation } from "../_generated/server";

const CORE_REPORTS = [
    {
        slug: "profit-loss",
        reportType: "financial", // Using existing schema field 'reportType'
        title: "Profit & Loss (P&L) Statement",
        config: {
            description: "Selectable date range, filters for business vs personal vs blended, simple and advanced modes.",
            metrics: ["revenue", "expenses", "net_income"],
            icon: "DollarSign",
            category: "core",
            color: "text-blue-600 dark:text-blue-400",
        },
        industry: "all",
        order: 1,
    },
    {
        slug: "balance-sheet",
        reportType: "financial",
        title: "Balance Sheet",
        config: {
            description: "Auto-generated from accounts & liabilities. Realistic, simplified layout for new businesses.",
            metrics: ["assets", "liabilities", "equity"],
            icon: "Scale",
            category: "core",
            color: "text-green-600 dark:text-green-400",
        },
        industry: "all",
        order: 2,
    },
    {
        slug: "cash-flow",
        reportType: "financial",
        title: "Cash Flow Statement",
        config: {
            description: "Indirect method. Monthly or quarterly versions. Essential for lenders and investors.",
            metrics: ["operating_cash_flow", "investing_cash_flow"],
            icon: "ArrowLeftRight",
            category: "core",
            color: "text-purple-600 dark:text-purple-400",
        },
        industry: "all",
        order: 3,
    },
    {
        slug: "general-ledger",
        reportType: "accounting",
        title: "General Ledger Report",
        config: {
            description: "Complete line-by-line dataset for accountants or auditors. Exportable to CSV/XLSX.",
            metrics: ["transactions"],
            icon: "BookOpen",
            category: "core",
            color: "text-orange-600 dark:text-orange-400",
        },
        industry: "all",
        order: 4,
    },
    {
        slug: "trial-balance",
        reportType: "accounting",
        title: "Trial Balance",
        config: {
            description: "Essential for accountants. Supports error-checking and journal entry review.",
            metrics: ["debits", "credits"],
            icon: "Calculator",
            category: "core",
            color: "text-red-600 dark:text-red-400",
        },
        industry: "all",
        order: 5,
    },
    // Health & Operations
    {
        slug: "burn-rate-runway",
        reportType: "operational",
        title: "Burn Rate + Runway Report",
        config: {
            description: "Monthly burn, average burn, estimated runway, scenario toggles.",
            metrics: ["burn_rate", "runway"],
            icon: "Flame",
            category: "health",
            color: "text-red-600 dark:text-red-400",
        },
        industry: "all",
        order: 6,
    },
    {
        slug: "financial-summary",
        reportType: "management",
        title: "Monthly / Quarterly Financial Summary",
        config: {
            description: "Management report with revenue, expenses, profit, cash flow, top categories, and trends.",
            metrics: ["summary"],
            icon: "Calendar",
            category: "health",
            color: "text-blue-600 dark:text-blue-400",
        },
        industry: "all",
        order: 7,
    },
    {
        slug: "kpi-dashboard",
        reportType: "management",
        title: "Business KPI Dashboard",
        config: {
            description: "CAC, LTV, gross margin, revenue growth, ARPU, churn, owner compensation.",
            metrics: ["kpis"],
            icon: "BarChart3",
            category: "health",
            color: "text-purple-600 dark:text-purple-400",
        },
        industry: "all",
        order: 8,
    },
    {
        slug: "accounts-receivable",
        reportType: "operational",
        title: "Accounts Receivable Summary",
        config: {
            description: "Outstanding invoices, aging buckets (0-30, 31-60, etc.), customers who owe money.",
            metrics: ["ar_aging"],
            icon: "Receipt",
            category: "health",
            color: "text-green-600 dark:text-green-400",
        },
        industry: "all",
        order: 9,
    },
    {
        slug: "accounts-payable",
        reportType: "operational",
        title: "Accounts Payable Summary",
        config: {
            description: "Outstanding bills, due dates, vendors owed. Track what you need to pay.",
            metrics: ["ap_aging"],
            icon: "FileCheck",
            category: "health",
            color: "text-orange-600 dark:text-orange-400",
        },
        industry: "all",
        order: 10,
    },
    {
        slug: "vendor-spend",
        reportType: "operational",
        title: "Vendor Spend Analysis",
        config: {
            description: "Top vendors, total spent by vendor. Perfect for contract renegotiations.",
            metrics: ["vendor_totals"],
            icon: "ShoppingCart",
            category: "health",
            color: "text-indigo-600 dark:text-indigo-400",
        },
        industry: "all",
        order: 11,
    },
    {
        slug: "tax-preparation",
        reportType: "compliance",
        title: "Tax Preparation Packet",
        config: {
            description: "Hero feature: Profit, expenses, mileage, deductible categories, home office summary.",
            metrics: ["tax_summary"],
            icon: "ReceiptText",
            category: "health",
            color: "text-pink-600 dark:text-pink-400",
        },
        industry: "all",
        order: 12,
    },
    {
        slug: "year-end-accountant",
        reportType: "compliance",
        title: "Year-End Accountant Pack",
        config: {
            description: "Designed for CPAs: Trial balance, ledger, P&L, balance sheet, adjustments log.",
            metrics: ["full_pack"],
            icon: "Briefcase",
            category: "health",
            color: "text-cyan-600 dark:text-cyan-400",
        },
        industry: "all",
        order: 13,
    },
    // Snapshots
    {
        slug: "bank-lender",
        reportType: "snapshot",
        title: "Bank / Lender Application Snapshot",
        config: {
            description: "Designed for bank underwriters asking for last 12 months performance.",
            metrics: ["lender_view"],
            icon: "Building2",
            category: "snapshots",
            color: "text-blue-600 dark:text-blue-400",
        },
        industry: "all",
        order: 14,
    },
    {
        slug: "creditor-vendor",
        reportType: "snapshot",
        title: "Creditor / Vendor Snapshot",
        config: {
            description: "Quick financial overview for vendors/creditors.",
            metrics: ["creditor_view"],
            icon: "Users",
            category: "snapshots",
            color: "text-green-600 dark:text-green-400",
        },
        industry: "all",
        order: 15,
    },
    {
        slug: "investor-summary",
        reportType: "snapshot",
        title: "Investor Summary",
        config: {
            description: "Comprehensive financial summary highlighting growth metrics.",
            metrics: ["investor_view"],
            icon: "TrendingUp",
            category: "snapshots",
            color: "text-purple-600 dark:text-purple-400",
        },
        industry: "all",
        order: 16,
    },
    {
        slug: "executive-summary",
        reportType: "snapshot",
        title: "Internal Executive Summary",
        config: {
            description: "Owner view with detailed insights, burn rate, and runway.",
            metrics: ["exec_view"],
            icon: "FileText",
            category: "snapshots",
            color: "text-orange-600 dark:text-orange-400",
        },
        industry: "all",
        order: 17,
    },
];

export const seedReports = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Find or create 'reports' Addon
        let reportsAddon = await ctx.db
            .query("addons")
            .withIndex("by_slug", (q) => q.eq("slug", "reports"))
            .first();

        if (!reportsAddon) {
            // Create stub reports addon if missing (should be synced by syncAddons ideally)
            const id = await ctx.db.insert("addons", {
                slug: "reports",
                name: "Financial Reports",
                shortDescription: "Core financial reporting module",
                longDescription: "Complete suite of financial reports",
                category: "reports",
                isFree: true,
                supportsTrial: false,
                version: "1.0.0",
                status: "active",
                uiPlacement: {
                    section: "reports",
                    label: "Reports"
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            reportsAddon = await ctx.db.get(id);
        }

        if (!reportsAddon) throw new Error("Failed to get reports addon");

        let count = 0;
        for (const report of CORE_REPORTS) {
            const existing = await ctx.db
                .query("report_templates")
                .withIndex("by_report_type", (q) => q.eq("reportType", report.reportType)) // Using reportType as index is not unique enough potentially?
                // Wait, schema index is by_report_type which is non-unique.
                // We should check by slug if possible? Schema doesn't index by slug in my memory? 
                // Checking schema: by_report_type is index. slug is just a string. 
                // So I must filter.
                .filter(q => q.eq(q.field("slug"), report.slug))
                .first();

            if (!existing) {
                await ctx.db.insert("report_templates", {
                    addonId: reportsAddon._id,
                    title: report.title,
                    slug: report.slug,
                    reportType: report.reportType,
                    config: report.config,
                    industry: report.industry,
                    order: report.order,
                    isActive: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                count++;
            } else {
                // Optional: Update existing if needed
                await ctx.db.patch(existing._id, {
                    title: report.title,
                    config: report.config,
                    order: report.order,
                    updatedAt: Date.now(),
                });
            }
        }

        return `Seeded ${count} report templates.`;
    },
});
