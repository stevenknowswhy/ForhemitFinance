/**
 * Prompt builders for different story types
 */

import type { FinancialData } from "./types";

/**
 * Build prompt for Company Story
 */
export function buildCompanyStoryPrompt(
  data: FinancialData,
  periodLabel: string
): string {
  return `Generate a Company Story (Internal Compass) financial narrative for ${periodLabel}.

Financial Data:
- Revenue: $${data.revenue.toLocaleString()}
- Expenses: $${data.expenses.toLocaleString()}
- Net Income: $${data.netIncome.toLocaleString()}
- Cash Flow: $${data.cashFlow.toLocaleString()}
- Starting Cash: $${data.startingCash.toLocaleString()}
- Ending Cash: $${data.endingCash.toLocaleString()}
- Monthly Burn Rate: $${data.burnRate.toLocaleString()}
- Runway: ${data.runway.toFixed(1)} months
- Revenue Growth: ${data.revenueGrowth.toFixed(1)}%
- Month-over-Month Revenue Change: ${data.monthOverMonthChange.revenue.toFixed(1)}%
- Month-over-Month Expenses Change: ${data.monthOverMonthChange.expenses.toFixed(1)}%

Top Revenue Categories:
${data.revenueByCategory.slice(0, 5).map((c) => `- ${c.category}: $${c.amount.toLocaleString()}`).join("\n")}

Top Expense Categories:
${data.expensesByCategory.slice(0, 5).map((c) => `- ${c.category}: $${c.amount.toLocaleString()}`).join("\n")}

Business Context:
- Business Type: ${data.businessType || "Not specified"}
- Entity Type: ${data.businessEntityType || "Not specified"}
- Accounting Method: ${data.accountingMethod}

Requirements:
1. Write in clear, honest, operationally useful language
2. Explain monthly burn rate in plain language
3. Describe what's improving vs. declining
4. Explain cash runway in simple English
5. Provide revenue breakdowns and trends
6. Identify cost drivers that are quietly growing
7. Note any seasonality patterns
8. Provide 3 actionable recommendations to improve cash health
9. Compare to previous period: "What changed since last ${data.periodType === "monthly" ? "month" : data.periodType === "quarterly" ? "quarter" : "year"}?"

Word Count Target: ${data.periodType === "monthly" ? "500-800" : data.periodType === "quarterly" ? "1,500-2,500" : "3,000-5,000"} words

Respond with JSON:
{
  "narrative": "Full narrative text...",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "burnRate": ${data.burnRate},
    "runway": ${data.runway},
    "revenueGrowth": ${data.revenueGrowth},
    "topExpenseCategory": "${data.expensesByCategory[0]?.category || "N/A"}"
  }
}`;
}

/**
 * Build prompt for Banker Story
 */
export function buildBankerStoryPrompt(
  data: FinancialData,
  periodLabel: string
): string {
  return `Generate a Banker/Creditor Story (Financial Credibility Profile) financial narrative for ${periodLabel}.

Financial Data:
- Revenue: $${data.revenue.toLocaleString()}
- Expenses: $${data.expenses.toLocaleString()}
- Net Income: $${data.netIncome.toLocaleString()}
- Cash Flow: $${data.cashFlow.toLocaleString()}
- Ending Cash: $${data.endingCash.toLocaleString()}
- Debt-to-Income Ratio: ${(data.debtToIncome * 100).toFixed(1)}%
- Debt-to-Revenue Ratio: ${(data.debtToRevenue * 100).toFixed(1)}%
- Transaction Count: ${data.transactionCount}
- Income Transactions: ${data.incomeTransactionCount}
- Expense Transactions: ${data.expenseTransactionCount}

Account Balances:
${data.accountBalances.filter((a) => Math.abs(a.balance) > 100).slice(0, 10).map((a) => `- ${a.accountName} (${a.type}): $${a.balance.toLocaleString()}`).join("\n")}

Business Context:
- Business Type: ${data.businessType || "Not specified"}
- Entity Type: ${data.businessEntityType || "Not specified"}
- Accounting Method: ${data.accountingMethod}

Requirements:
1. Write in stable, conservative, cautious tone
2. Highlight reliability and repayment strength
3. No hype or forward-looking fantasies
4. Focus on: "Are you safe to lend to?"
5. Analyze debt-to-income and debt-to-revenue ratios
6. Assess cash flow reliability
7. Review payment history patterns
8. Identify upcoming liabilities
9. Evaluate cushion and reserves
10. Provide evidence of financial discipline
11. Forecast repayment likelihood
12. Flag any concerns (late payments, abnormal cash spikes, etc.)

Word Count Target: ${data.periodType === "monthly" ? "500-800" : data.periodType === "quarterly" ? "1,500-2,500" : "3,000-5,000"} words

Respond with JSON:
{
  "narrative": "Full narrative text...",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "debtToIncome": ${data.debtToIncome},
    "debtToRevenue": ${data.debtToRevenue},
    "cashFlow": ${data.cashFlow},
    "endingCash": ${data.endingCash}
  }
}`;
}

/**
 * Build prompt for Investor Story
 */
export function buildInvestorStoryPrompt(
  data: FinancialData,
  periodLabel: string
): string {
  return `Generate an Investor Story (Forward Narrative + Growth Thesis) financial narrative for ${periodLabel}.

Financial Data:
- Revenue: $${data.revenue.toLocaleString()}
- Expenses: $${data.expenses.toLocaleString()}
- Net Income: $${data.netIncome.toLocaleString()}
- Cash Flow: $${data.cashFlow.toLocaleString()}
- Ending Cash: $${data.endingCash.toLocaleString()}
- Revenue Growth: ${data.revenueGrowth.toFixed(1)}%
- Growth Rate: ${data.growthRate.toFixed(1)}%
- Runway: ${data.runway.toFixed(1)} months
- Month-over-Month Revenue Change: ${data.monthOverMonthChange.revenue.toFixed(1)}%

Revenue Breakdown:
${data.revenueByCategory.slice(0, 5).map((c) => `- ${c.category}: $${c.amount.toLocaleString()}`).join("\n")}

Expense Breakdown:
${data.expensesByCategory.slice(0, 5).map((c) => `- ${c.category}: $${c.amount.toLocaleString()}`).join("\n")}

Period Trends:
${data.periodBreakdown.map((p) => `${p.period}: Revenue $${p.revenue.toLocaleString()}, Expenses $${p.expenses.toLocaleString()}, Net $${p.netIncome.toLocaleString()}`).join("\n")}

Business Context:
- Business Type: ${data.businessType || "Not specified"}
- Entity Type: ${data.businessEntityType || "Not specified"}
- Accounting Method: ${data.accountingMethod}

Requirements:
1. Write in forward-looking, opportunity-driven tone
2. Be honest and grounded in evidence
3. Use investment-grade clarity without jargon
4. Present current financial position with clean narrative
5. Highlight growth indicators
6. Analyze revenue efficiency (if applicable: LTV/CAC, churn, retention)
7. Identify milestones achieved
8. Outline upcoming milestones
9. Identify scalable opportunities
10. Address risks (but frame responsibly)
11. Provide 12-24 month outlook

Word Count Target: ${data.periodType === "monthly" ? "500-800" : data.periodType === "quarterly" ? "1,500-2,500" : "3,000-5,000"} words

Respond with JSON:
{
  "narrative": "Full narrative text...",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "revenueGrowth": ${data.revenueGrowth},
    "growthRate": ${data.growthRate},
    "runway": ${data.runway},
    "netIncome": ${data.netIncome}
  }
}`;
}

