import { v } from "convex/values";
import { query } from "../_generated/server";
import { api } from "../_generated/api";

export const generateInvestorReport = query({
    args: {
        companyName: v.string(),
        reportType: v.union(
            v.literal("Income Statement (P&L)"),
            v.literal("Balance Sheet"),
            v.literal("Cash Flow Statement"),
            v.literal("General Ledger"),
            v.literal("Trial Balance")
        ),
        periodType: v.optional(v.union(v.literal("yearly"), v.literal("quarterly"))),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        // P&L specific filters
        filterType: v.optional(v.union(v.literal("business"), v.literal("personal"), v.literal("blended"))),
        mode: v.optional(v.union(v.literal("simple"), v.literal("advanced"))),
        breakdownBy: v.optional(v.union(v.literal("category"), v.literal("product"), v.literal("revenue_stream"))),
    },
    handler: async (ctx, args) => {
        const {
            companyName,
            reportType,
            periodType = "yearly",
            endDate = Date.now(),
            startDate,
            filterType,
            mode,
            breakdownBy
        } = args;

        const response = {
            header: {
                title: `FINANCIAL INFORMATION — ${reportType}`,
                date: `As of ${new Date(endDate).toLocaleDateString()}`,
                company: companyName,
            },
            chart: {
                metric: "",
                units: "USD",
                data: [] as any[],
            },
            table: {
                columns: [] as string[],
                sections: [] as any[],
            },
        };

        // --- Comparison Reports (P&L, BS, CF) ---
        if (
            reportType === "Income Statement (P&L)" ||
            reportType === "Balance Sheet" ||
            reportType === "Cash Flow Statement"
        ) {
            // 1. Define Periods (Last 3)
            const periods: Array<{ label: string; start: number; end: number; isCurrent: boolean }> = [];
            const currentEnd = new Date(endDate);

            for (let i = 0; i < 3; i++) {
                let start: number, end: number, label: string;

                if (periodType === "yearly") {
                    const year = currentEnd.getFullYear() - i;
                    start = new Date(year, 0, 1).getTime();
                    end = new Date(year, 11, 31, 23, 59, 59).getTime();
                    label = year.toString();
                } else {
                    // Quarterly
                    const date = new Date(currentEnd);
                    date.setMonth(date.getMonth() - (i * 3));
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    const year = date.getFullYear();

                    const quarterStartMonth = (quarter - 1) * 3;
                    start = new Date(year, quarterStartMonth, 1).getTime();
                    const quarterEndMonth = quarterStartMonth + 3;
                    end = new Date(year, quarterEndMonth, 0, 23, 59, 59).getTime();

                    label = `Q${quarter} ${year}`;
                }

                periods.unshift({ label, start, end, isCurrent: i === 0 });
            }

            response.table.columns = periods.map(p => p.label);

            if (reportType === "Income Statement (P&L)") {
                response.chart.metric = "Net Income";

                const revenueRow = { label: "Revenue", values: [] as number[] };
                const expensesRow = { label: "Operating Expenses", values: [] as number[] };
                const netIncomeRow = { label: "Net Income", values: [] as number[] };

                for (const period of periods) {
                    const data = await ctx.runQuery(api.reports.profitLoss.getProfitAndLossData, {
                        startDate: period.start,
                        endDate: period.end,
                        filterType,
                        mode,
                        breakdownBy
                    });

                    const netIncome = data?.netIncome || 0;
                    const revenue = data?.revenue?.total || 0;
                    const expenses = data?.expenses?.total || 0;

                    response.chart.data.push({
                        period: period.label,
                        value: netIncome,
                        isCurrent: period.isCurrent,
                        color: period.isCurrent ? "highlight" : "neutral"
                    });

                    revenueRow.values.push(revenue);
                    expensesRow.values.push(expenses);
                    netIncomeRow.values.push(netIncome);
                }

                response.table.sections.push({
                    title: "Income Statement",
                    rows: [revenueRow, expensesRow, netIncomeRow],
                    subtotal: { label: "Net Income", values: netIncomeRow.values }
                });

            } else if (reportType === "Balance Sheet") {
                response.chart.metric = "Total Assets";

                const assetsRow = { label: "Total Assets", values: [] as number[] };
                const liabilitiesRow = { label: "Total Liabilities", values: [] as number[] };
                const equityRow = { label: "Total Equity", values: [] as number[] };

                for (const period of periods) {
                    const data = await ctx.runQuery(api.reports.balanceSheet.getBalanceSheetData, {
                        asOfDate: period.end
                    });

                    const totalAssets = data?.assets?.total || 0;
                    const totalLiabilities = data?.liabilities?.total || 0;
                    const totalEquity = data?.equity?.total || 0;

                    response.chart.data.push({
                        period: period.label,
                        value: totalAssets,
                        isCurrent: period.isCurrent,
                        color: period.isCurrent ? "highlight" : "neutral"
                    });

                    assetsRow.values.push(totalAssets);
                    liabilitiesRow.values.push(totalLiabilities);
                    equityRow.values.push(totalEquity);
                }

                response.table.sections.push({
                    title: "Assets",
                    rows: [],
                    subtotal: { label: "Total Assets", values: assetsRow.values }
                });
                response.table.sections.push({
                    title: "Liabilities",
                    rows: [],
                    subtotal: { label: "Total Liabilities", values: liabilitiesRow.values }
                });
                response.table.sections.push({
                    title: "Equity",
                    rows: [],
                    subtotal: { label: "Total Equity", values: equityRow.values }
                });

            } else if (reportType === "Cash Flow Statement") {
                response.chart.metric = "Net Cash Flow";

                const operatingRow = { label: "Net Cash from Operations", values: [] as number[] };
                const investingRow = { label: "Net Cash from Investing", values: [] as number[] };
                const financingRow = { label: "Net Cash from Financing", values: [] as number[] };
                const netChangeRow = { label: "Net Change in Cash", values: [] as number[] };

                for (const period of periods) {
                    const data = await ctx.runQuery(api.reports.cashFlow.getCashFlowStatementData, {
                        startDate: period.start,
                        endDate: period.end,
                        period: "monthly"
                    });

                    const operating = data?.operatingActivities?.cashFromOperations || 0;
                    const investing = data?.investingActivities?.cashFromInvesting || 0;
                    const financing = data?.financingActivities?.cashFromFinancing || 0;
                    const netChange = data?.netChangeInCash || 0;

                    response.chart.data.push({
                        period: period.label,
                        value: netChange,
                        isCurrent: period.isCurrent,
                        color: period.isCurrent ? "highlight" : "neutral"
                    });

                    operatingRow.values.push(operating);
                    investingRow.values.push(investing);
                    financingRow.values.push(financing);
                    netChangeRow.values.push(netChange);
                }

                response.table.sections.push({
                    title: "Operating Activities",
                    rows: [operatingRow],
                    subtotal: { label: "Net Cash from Operations", values: operatingRow.values }
                });
                response.table.sections.push({
                    title: "Investing Activities",
                    rows: [investingRow],
                    subtotal: { label: "Net Cash from Investing", values: investingRow.values }
                });
                response.table.sections.push({
                    title: "Financing Activities",
                    rows: [financingRow],
                    subtotal: { label: "Net Cash from Financing", values: financingRow.values }
                });
                response.table.sections.push({
                    title: "Summary",
                    rows: [netChangeRow],
                    subtotal: { label: "Net Change in Cash", values: netChangeRow.values }
                });
            }
        }
        // --- Snapshot/List Reports (TB, GL) ---
        else if (reportType === "Trial Balance") {
            response.chart.metric = "Account Composition";
            response.table.columns = ["Account", "Debit", "Credit"];

            const data = await ctx.runQuery(api.reports.trialBalance.getTrialBalanceData, {
                asOfDate: endDate
            });

            if (data) {
                // Chart: Assets vs Liabilities vs Equity
                let assets = 0, liabilities = 0, equity = 0;

                const rows = data.entries.map((entry: any) => {
                    if (entry.accountType === "asset") assets += entry.debit;
                    if (entry.accountType === "liability") liabilities += entry.credit;
                    if (entry.accountType === "equity") equity += entry.credit;

                    return {
                        label: entry.account,
                        values: [entry.debit, entry.credit] // Maps to Debit, Credit columns
                    };
                });

                response.chart.data = [
                    { period: "Assets", value: assets, color: "neutral", isCurrent: false },
                    { period: "Liabilities", value: liabilities, color: "neutral", isCurrent: false },
                    { period: "Equity", value: equity, color: "highlight", isCurrent: true },
                ];

                response.table.sections.push({
                    title: "All Accounts",
                    rows: rows,
                    subtotal: {
                        label: "Totals",
                        values: [data.totals.debits, data.totals.credits]
                    }
                });
            }

        } else if (reportType === "General Ledger") {
            response.chart.metric = "Transaction Volume";
            response.table.columns = ["Date", "Account", "Memo", "Debit", "Credit", "Balance"];

            const start = startDate || (endDate - (30 * 24 * 60 * 60 * 1000)); // Default to last 30 days if not specified

            const data = await ctx.runQuery(api.reports.generalLedger.getGeneralLedgerData, {
                startDate: start,
                endDate: endDate
            });

            if (data) {
                // Chart: Daily transaction volume? Or just total debits vs credits?
                // Let's show Total Debits vs Total Credits
                let totalDebits = 0;
                let totalCredits = 0;

                const rows = data.entries.map((entry: any) => {
                    totalDebits += entry.debit;
                    totalCredits += entry.credit;

                    return {
                        label: new Date(entry.date).toLocaleDateString(), // Use label for Date
                        // Values map to: Account, Memo, Debit, Credit, Balance
                        // Note: "values" in previous reports were numbers. Here we have mixed types.
                        // The frontend needs to handle mixed types or we convert all to string/number.
                        // Let's assume values can be mixed.
                        values: [
                            entry.account,
                            entry.memo,
                            entry.debit,
                            entry.credit,
                            entry.balance
                        ]
                    };
                });

                response.chart.data = [
                    { period: "Total Debits", value: totalDebits, color: "neutral", isCurrent: false },
                    { period: "Total Credits", value: totalCredits, color: "highlight", isCurrent: true },
                ];

                response.table.sections.push({
                    title: "Transactions",
                    rows: rows,
                    subtotal: {
                        label: "Totals",
                        values: ["", "", totalDebits, totalCredits, ""]
                    }
                });
            }
        }

        return response;
    }
});
