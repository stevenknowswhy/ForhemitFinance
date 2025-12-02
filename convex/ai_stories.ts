/**
 * AI Stories Generation (Phase 2)
 * Generates three types of AI-powered financial narratives:
 * 1. Company Story (Internal Compass)
 * 2. Banker Story (Financial Credibility Profile)
 * 3. Investor Story (Forward Narrative + Growth Thesis)
 */

import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Financial data aggregation for story generation
 */
interface FinancialData {
  // Period information
  periodStart: number;
  periodEnd: number;
  periodType: "monthly" | "quarterly" | "annually";

  // Revenue and expenses
  revenue: number;
  expenses: number;
  netIncome: number;

  // Cash flow
  cashFlow: number;
  startingCash: number;
  endingCash: number;

  // Business metrics
  burnRate: number;
  runway: number; // months

  // Debt metrics
  debtToIncome: number;
  debtToRevenue: number;

  // Growth metrics
  growthRate: number;
  revenueGrowth: number;

  // Category breakdowns
  revenueByCategory: Array<{ category: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;

  // Monthly/quarterly breakdowns
  periodBreakdown: Array<{
    period: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }>;

  // Account balances
  accountBalances: Array<{ accountName: string; balance: number; type: string }>;

  // Transaction counts
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;

  // Trends
  monthOverMonthChange: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };

  // Business context
  businessType?: string;
  businessEntityType?: string;
  accountingMethod: string;
}

/**
 * Aggregate financial data for a given period (query function)
 */
export const aggregateFinancialDataQuery = query({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<FinancialData> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    const periodStart = args.periodStart;
    const periodEnd = args.periodEnd;
    const periodType = args.periodType;

    const businessProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    // Get all entries for the period
    const allEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const periodEntries = allEntries.filter(
      (e: any) => e.date >= periodStart && e.date <= periodEnd
    );

    // Get entry lines for period entries
    const entryLines: any[] = [];
    for (const entry of periodEntries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      entryLines.push(...lines);
    }

    // Calculate revenue (income accounts - credits)
    let revenue = 0;
    const incomeAccounts = accounts.filter((a: any) => a.type === "income");
    for (const account of incomeAccounts) {
      for (const line of entryLines) {
        if (
          (line as any).accountId === (account as any)._id &&
          (line as any).side === "credit" &&
          (line as any).amount
        ) {
          revenue += (line as any).amount;
        }
      }
    }

    // Calculate expenses (expense accounts - debits)
    let expenses = 0;
    const expenseAccounts = accounts.filter((a: any) => a.type === "expense");
    for (const account of expenseAccounts) {
      for (const line of entryLines) {
        if (
          (line as any).accountId === (account as any)._id &&
          (line as any).side === "debit" &&
          (line as any).amount
        ) {
          expenses += (line as any).amount;
        }
      }
    }

    const netIncome = revenue - expenses;

    // Calculate cash flow (asset accounts)
    let startingCash = 0;
    let endingCash = 0;
    const assetAccounts = accounts.filter((a: any) => a.type === "asset");

    // Starting balance (before period)
    const entriesBeforePeriod = allEntries.filter((e: any) => e.date < periodStart);
    const linesBeforePeriod: any[] = [];
    for (const entry of entriesBeforePeriod) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      linesBeforePeriod.push(...lines);
    }

    for (const account of assetAccounts) {
      for (const line of linesBeforePeriod) {
        if ((line as any).accountId === (account as any)._id) {
          if ((line as any).side === "debit") {
            startingCash += (line as any).amount;
          } else {
            startingCash -= (line as any).amount;
          }
        }
      }
    }

    // Ending balance (including period)
    for (const account of assetAccounts) {
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id) {
          if ((line as any).side === "debit") {
            endingCash += (line as any).amount;
          } else {
            endingCash -= (line as any).amount;
          }
        }
      }
    }
    endingCash = startingCash + (endingCash - startingCash);

    const cashFlow = endingCash - startingCash;

    // Calculate burn rate (for expenses > revenue)
    const monthlyBurn = expenses / (periodType === "monthly" ? 1 : periodType === "quarterly" ? 3 : 12);
    const burnRate = netIncome < 0 ? Math.abs(monthlyBurn) : 0;
    const runway = endingCash > 0 && burnRate > 0 ? endingCash / burnRate : 0;

    // Calculate debt metrics
    const liabilityAccounts = accounts.filter((a: any) => a.type === "liability");
    let totalDebt = 0;
    for (const account of liabilityAccounts) {
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          totalDebt += (line as any).amount;
        }
      }
    }
    const debtToIncome = revenue > 0 ? totalDebt / revenue : 0;
    const debtToRevenue = revenue > 0 ? totalDebt / revenue : 0;

    // Calculate growth (compare to previous period)
    const previousPeriodStart = periodStart - (periodEnd - periodStart);
    const previousPeriodEnd = periodStart;
    const previousEntries = allEntries.filter(
      (e: any) => e.date >= previousPeriodStart && e.date < previousPeriodEnd
    );

    let previousRevenue = 0;
    let previousExpenses = 0;
    const previousLines: any[] = [];
    for (const entry of previousEntries) {
      const lines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", (entry as any)._id))
        .collect();
      previousLines.push(...lines);
    }

    for (const account of incomeAccounts) {
      for (const line of previousLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          previousRevenue += (line as any).amount;
        }
      }
    }

    for (const account of expenseAccounts) {
      for (const line of previousLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "debit") {
          previousExpenses += (line as any).amount;
        }
      }
    }

    const revenueGrowth =
      previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const growthRate = revenueGrowth;

    // Category breakdowns
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    for (const account of incomeAccounts) {
      let accountRevenue = 0;
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "credit") {
          accountRevenue += (line as any).amount;
        }
      }
      if (accountRevenue > 0) {
        revenueByCategory[account.name] = accountRevenue;
      }
    }

    for (const account of expenseAccounts) {
      let accountExpenses = 0;
      for (const line of entryLines) {
        if ((line as any).accountId === (account as any)._id && (line as any).side === "debit") {
          accountExpenses += (line as any).amount;
        }
      }
      if (accountExpenses > 0) {
        expensesByCategory[account.name] = accountExpenses;
      }
    }

    const revenueByCategoryArray = Object.entries(revenueByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Period breakdown (monthly for quarterly/annual, weekly for monthly)
    const periodBreakdown: Array<{
      period: string;
      revenue: number;
      expenses: number;
      netIncome: number;
    }> = [];

    if (periodType === "monthly") {
      // Weekly breakdown for monthly
      const weeks = 4;
      const weekDuration = (periodEnd - periodStart) / weeks;
      for (let i = 0; i < weeks; i++) {
        const weekStart = periodStart + i * weekDuration;
        const weekEnd = periodStart + (i + 1) * weekDuration;
        const weekEntries = periodEntries.filter(
          (e: any) => e.date >= weekStart && e.date < weekEnd
        );
        // Calculate week totals (simplified)
        periodBreakdown.push({
          period: `Week ${i + 1}`,
          revenue: revenue / weeks,
          expenses: expenses / weeks,
          netIncome: netIncome / weeks,
        });
      }
    } else if (periodType === "quarterly") {
      // Monthly breakdown for quarterly
      const months = 3;
      const monthDuration = (periodEnd - periodStart) / months;
      for (let i = 0; i < months; i++) {
        const monthStart = periodStart + i * monthDuration;
        const monthEnd = periodStart + (i + 1) * monthDuration;
        periodBreakdown.push({
          period: `Month ${i + 1}`,
          revenue: revenue / months,
          expenses: expenses / months,
          netIncome: netIncome / months,
        });
      }
    } else {
      // Quarterly breakdown for annual
      const quarters = 4;
      for (let i = 0; i < quarters; i++) {
        periodBreakdown.push({
          period: `Q${i + 1}`,
          revenue: revenue / quarters,
          expenses: expenses / quarters,
          netIncome: netIncome / quarters,
        });
      }
    }

    // Account balances
    const accountBalances = accounts.map((account: any) => {
      let balance = 0;
      for (const line of entryLines) {
        if ((line as any).accountId === account._id) {
          if (
            (account.type === "asset" || account.type === "expense") &&
            (line as any).side === "debit"
          ) {
            balance += (line as any).amount;
          } else if (
            (account.type === "liability" ||
              account.type === "equity" ||
              account.type === "income") &&
            (line as any).side === "credit"
          ) {
            balance += (line as any).amount;
          } else {
            balance -= (line as any).amount;
          }
        }
      }
      return {
        accountName: account.name,
        balance,
        type: account.type,
      };
    });

    // Transaction counts
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const periodTransactions = transactions.filter((t: any) => {
      const transactionDate = t.dateTimestamp || new Date(t.date).getTime();
      return transactionDate >= periodStart && transactionDate <= periodEnd;
    });

    const incomeTransactionCount = periodTransactions.filter(
      (t: any) => t.amount > 0
    ).length;
    const expenseTransactionCount = periodTransactions.filter(
      (t: any) => t.amount < 0
    ).length;

    // Month-over-month change
    const monthOverMonthChange = {
      revenue: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0,
      expenses: previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0,
      netIncome:
        previousRevenue - previousExpenses !== 0
          ? ((netIncome - (previousRevenue - previousExpenses)) /
            Math.abs(previousRevenue - previousExpenses)) *
          100
          : 0,
    };

    return {
      periodStart,
      periodEnd,
      periodType,
      revenue,
      expenses,
      netIncome,
      cashFlow,
      startingCash,
      endingCash,
      burnRate,
      runway,
      debtToIncome,
      debtToRevenue,
      growthRate,
      revenueGrowth,
      revenueByCategory: revenueByCategoryArray,
      expensesByCategory: expensesByCategoryArray,
      periodBreakdown,
      accountBalances,
      transactionCount: periodTransactions.length,
      incomeTransactionCount,
      expenseTransactionCount,
      monthOverMonthChange,
      businessType: user.businessType,
      businessEntityType: businessProfile?.entityType,
      accountingMethod: user.preferences.accountingMethod || "cash",
    };
  },
});

/**
 * Role-specific system prompts for story generation
 */
const STORY_SYSTEM_PROMPTS = {
  company: {
    monthly: `You are the Chief Financial Officer preparing an internal monthly financial report for the executive team and board of directors.

**Your Role & Perspective:**
- You have complete visibility into all financial operations
- Your audience is the CEO, executives, and internal stakeholders
- Focus on operational health, burn rate, and runway
- Be direct about challenges while highlighting opportunities

**Story Requirements:**
1. **Opening**: Lead with the most critical operational metric (burn rate, runway, or cash position)
2. **Cash Management**: Emphasize current cash position, monthly burn rate, and runway in months
3. **Operational Efficiency**: Discuss expense trends and cost management
4. **Internal Context**: Reference internal goals, budgets, and operational targets
5. **Action Items**: Clearly state what needs attention or adjustment

**Tone**: Direct, actionable, focused on operational sustainability

Always respond with valid JSON in this format:
{
  "narrative": "2-4 paragraph narrative (150-300 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "burnRate": number,
    "runway": number,
    "cashFlow": number,
    "revenueGrowth": number,
    "topExpenseCategory": string
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
    quarterly: `You are the Chief Financial Officer preparing a quarterly financial report for the executive team, board of directors, and key stakeholders.

**Your Role & Perspective:**
- Provide strategic financial overview of the quarter
- Compare quarterly performance to prior quarters and annual targets
- Your audience includes board members who need high-level insights
- Focus on trends, not just monthly fluctuations

**Story Requirements:**
1. **Opening**: Summarize the quarter's financial performance in one powerful statement
2. **Trend Analysis**: Identify patterns across the three months
3. **Strategic Metrics**: Revenue growth, margin trends, cash efficiency
4. **Comparative Context**: Quarter-over-quarter and year-over-year comparisons
5. **Forward Outlook**: Set context for next quarter's expectations

**Tone**: Strategic, analytical, forward-looking

Always respond with valid JSON in this format:
{
  "narrative": "Comprehensive quarterly narrative (1,500-2,500 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "revenue": number,
    "growthRate": number,
    "netIncome": number,
    "cashFlow": number,
    "expenses": number
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
  },
  banker: {
    monthly: `You are a Credit Risk Analyst preparing a credit assessment report for a lending committee.

**Your Role & Perspective:**
- Assess creditworthiness and repayment capability
- Your audience is loan officers and credit committees
- Focus on financial stability, debt servicing, and risk factors
- Emphasize liquidity, leverage, and consistency

**Story Requirements:**
1. **Opening**: Lead with debt service coverage or key credit metric
2. **Liquidity Assessment**: Cash position, working capital, current ratio
3. **Leverage Analysis**: Debt-to-income, debt-to-revenue ratios
4. **Cash Flow Reliability**: Consistency and predictability of cash generation
5. **Risk Factors**: Flag any concerns about repayment ability

**Tone**: Objective, risk-focused, data-driven

Always respond with valid JSON in this format:
{
  "narrative": "Credit assessment narrative (500-800 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "debtToRevenue": number,
    "debtToIncome": number,
    "cashFlow": number,
    "revenue": number,
    "netIncome": number
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
    quarterly: `You are a Credit Risk Analyst preparing a quarterly credit review for the lending portfolio.

**Your Role & Perspective:**
- Evaluate credit quality trends over the quarter
- Your audience includes senior credit officers and portfolio managers
- Assess whether credit terms should be maintained, improved, or tightened
- Focus on trajectory and sustainability

**Story Requirements:**
1. **Opening**: Summarize overall credit quality and any rating changes
2. **Trend Analysis**: Track leverage and liquidity metrics across the quarter
3. **Cash Flow Consistency**: Evaluate predictability and reliability
4. **Covenant Compliance**: Note adherence to any financial covenants
5. **Outlook**: Assess future creditworthiness trajectory

**Tone**: Professional, analytical, forward-looking on credit risk

Always respond with valid JSON in this format:
{
  "narrative": "Quarterly credit review narrative (1,500-2,500 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "debtToRevenue": number,
    "debtToIncome": number,
    "cashFlow": number,
    "revenue": number,
    "netIncome": number
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
  },
  investor: {
    monthly: `You are a Venture Capital Investment Partner presenting a monthly portfolio company update to the partnership.

**Your Role & Perspective:**
- Evaluate growth trajectory and market opportunity capture
- Your audience is VC partners, LP investors, and growth-focused stakeholders
- Focus on unit economics, growth efficiency, and scaling potential
- Emphasize ARR/MRR, CAC payback, and capital efficiency

**Story Requirements:**
1. **Opening**: Lead with growth rate or key scaling metric (MRR, ARR growth)
2. **Growth Efficiency**: Discuss CAC, LTV:CAC ratio, payback periods
3. **Unit Economics**: Break down profitability at the unit level
4. **Scaling Indicators**: Metrics that show ability to scale efficiently
5. **12-24 Month Outlook**: Project trajectory and potential milestones

**Tone**: Growth-focused, optimistic but realistic, forward-looking

Always respond with valid JSON in this format:
{
  "narrative": "Growth-focused narrative (500-800 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "growthRate": number,
    "ltvCac": number,
    "burnRate": number,
    "runway": number,
    "revenueGrowth": number,
    "churn": number,
    "retention": number
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
    quarterly: `You are a Venture Capital Investment Partner preparing a quarterly board presentation for investors.

**Your Role & Perspective:**
- Present comprehensive quarterly performance and strategic progress
- Your audience includes board members, lead investors, and LP stakeholders
- Focus on milestone achievement, market positioning, and funding runway
- Connect financial performance to company strategy and market opportunity

**Story Requirements:**
1. **Opening**: Summarize the quarter's strategic and financial progress
2. **Growth Metrics**: Detailed analysis of QoQ growth, cohort performance
3. **Efficiency Gains**: Show improving unit economics and capital efficiency
4. **Market Position**: Context on competitive performance and market capture
5. **Strategic Outlook**: 12-24 month trajectory, funding needs, key milestones

**Tone**: Strategic, data-driven, inspirational yet honest

Always respond with valid JSON in this format:
{
  "narrative": "Strategic quarterly narrative (1,500-2,500 words)",
  "summary": "Short 2-3 sentence summary for card preview",
  "keyMetrics": {
    "growthRate": number,
    "ltvCac": number,
    "revenueGrowth": number,
    "netIncome": number,
    "retention": number,
    "runway": number
  },
  "insight": "One actionable insight (1-2 sentences)"
}`,
  },
};

/**
 * Call OpenRouter API to generate story narrative
 */
async function callOpenRouterAPI(
  prompt: string,
  systemPrompt: string,
  model: string = "x-ai/grok-4.1-fast:free"
): Promise<{
  narrative: string;
  summary: string;
  keyMetrics: Record<string, any>;
  insight?: string;
}> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterApiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_REFERRER || "https://ezfinancial.app",
      "X-Title": "EZ Financial AI Stories",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  try {
    const parsed = JSON.parse(content);
    return {
      narrative: parsed.narrative || "",
      summary: parsed.summary || "",
      keyMetrics: parsed.keyMetrics || {},
      insight: parsed.insight || "",
    };
  } catch (e) {
    // Fallback: treat entire response as narrative
    return {
      narrative: content,
      summary: content.substring(0, 200) + "...",
      keyMetrics: {},
      insight: "",
    };
  }
}

/**
 * Build prompt for Company Story
 */
function buildCompanyStoryPrompt(
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
function buildBankerStoryPrompt(
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
function buildInvestorStoryPrompt(
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

/**
 * Create story in database (public mutation)
 */
export const createStory = mutation({
  args: {
    userId: v.id("users"),
    storyType: v.union(v.literal("company"), v.literal("banker"), v.literal("investor")),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
    periodStart: v.number(),
    periodEnd: v.number(),
    title: v.string(),
    narrative: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyMetrics: v.optional(v.any()),
    generationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const storyId = await ctx.db.insert("ai_stories", {
      userId: args.userId,
      storyType: args.storyType,
      periodType: args.periodType,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      title: args.title,
      narrative: args.narrative,
      summary: args.summary,
      keyMetrics: args.keyMetrics || {},
      generationStatus: args.generationStatus || "completed",
      generationError: args.generationError,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return storyId;
  },
});


/**
 * Internal action to generate company story in the background
 */
export const _generateCompanyStoryInternal = internalAction({
  args: {
    storyId: v.id("ai_stories"),
    userId: v.id("users"),
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args) => {
    try {
      // Update status to generating
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "generating",
      });

      // Aggregate financial data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      // Build prompt
      const periodLabel = `${new Date(args.periodStart).toLocaleDateString()} to ${new Date(args.periodEnd).toLocaleDateString()}`;
      const prompt = buildCompanyStoryPrompt(financialData, periodLabel);
      const systemPrompt = (args.periodType === "annually"
        ? STORY_SYSTEM_PROMPTS.company.quarterly
        : STORY_SYSTEM_PROMPTS.company[args.periodType]) || STORY_SYSTEM_PROMPTS.company.monthly;

      // Call OpenRouter API
      const result = await callOpenRouterAPI(prompt, systemPrompt);

      // Update story with results
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        narrative: result.narrative,
        summary: result.summary || result.insight || "",
        keyMetrics: result.keyMetrics,
        generationStatus: "completed",
      });

      // Create notification
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_complete",
        title: "Story Generated",
        message: `Your Company Story for ${periodName} is ready to view.`,
        metadata: { storyId: args.storyId },
      });
    } catch (error: any) {
      // Update story with error
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "failed",
        generationError: error.message || "Unknown error occurred",
      });

      // Create failure notification
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_failed",
        title: "Story Generation Failed",
        message: `Failed to generate your Company Story: ${error.message || "Unknown error"}`,
        metadata: { storyId: args.storyId },
      });
    }
  },
});

/**
 * Generate Company Story (schedules background generation)
 */
export const generateCompanyStory = action({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<{ storyId: Id<"ai_stories">; success: boolean; error?: string }> => {
    try {
      const user = await ctx.runQuery(api.users.getCurrentUser);
      if (!user) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "User not found" };
      }

      // Validate date range
      if (args.periodStart >= args.periodEnd) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "Invalid date range: start date must be before end date" };
      }

      // Check if we have data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      if (financialData.transactionCount === 0) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "No financial data found for the selected period" };
      }

      // Create title
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      const title = `Company Story - ${periodName}`;

      // Create pending story record
      const storyId = await ctx.runMutation(api.ai_stories.createStory, {
        userId: user._id,
        storyType: "company",
        periodType: args.periodType,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        title,
        generationStatus: "pending",
      });

      // Schedule background generation
      await ctx.scheduler.runAfter(0, api.ai_stories._generateCompanyStoryInternal, {
        storyId,
        userId: user._id,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      return { storyId, success: true };
    } catch (error: any) {
      return { storyId: "" as Id<"ai_stories">, success: false, error: error.message || "Unknown error occurred" };
    }
  },
});

/**
 * Internal action to generate banker story in the background
 */
export const _generateBankerStoryInternal = internalAction({
  args: {
    storyId: v.id("ai_stories"),
    userId: v.id("users"),
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args) => {
    try {
      // Update status to generating
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "generating",
      });

      // Aggregate financial data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      // Build prompt
      const periodLabel = `${new Date(args.periodStart).toLocaleDateString()} to ${new Date(args.periodEnd).toLocaleDateString()}`;
      const prompt = buildBankerStoryPrompt(financialData, periodLabel);
      const systemPrompt = (args.periodType === "annually"
        ? STORY_SYSTEM_PROMPTS.banker.quarterly
        : STORY_SYSTEM_PROMPTS.banker[args.periodType]) || STORY_SYSTEM_PROMPTS.banker.monthly;

      // Call OpenRouter API
      const result = await callOpenRouterAPI(prompt, systemPrompt);

      // Update story with results
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        narrative: result.narrative,
        summary: result.summary || result.insight || "",
        keyMetrics: result.keyMetrics,
        generationStatus: "completed",
      });

      // Create notification
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_complete",
        title: "Story Generated",
        message: `Your Banker Story for ${periodName} is ready to view.`,
        metadata: { storyId: args.storyId },
      });
    } catch (error: any) {
      // Update story with error
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "failed",
        generationError: error.message || "Unknown error occurred",
      });

      // Create failure notification
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_failed",
        title: "Story Generation Failed",
        message: `Failed to generate your Banker Story: ${error.message || "Unknown error"}`,
        metadata: { storyId: args.storyId },
      });
    }
  },
});

/**
 * Generate Banker Story (schedules background generation)
 */
export const generateBankerStory = action({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<{ storyId: Id<"ai_stories">; success: boolean; error?: string }> => {
    try {
      const user = await ctx.runQuery(api.users.getCurrentUser);
      if (!user) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "User not found" };
      }

      // Validate date range
      if (args.periodStart >= args.periodEnd) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "Invalid date range: start date must be before end date" };
      }

      // Check if we have data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      if (financialData.transactionCount === 0) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "No financial data found for the selected period" };
      }

      // Create title
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      const title = `Banker Story - ${periodName}`;

      // Create pending story record
      const storyId = await ctx.runMutation(api.ai_stories.createStory, {
        userId: user._id,
        storyType: "banker",
        periodType: args.periodType,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        title,
        generationStatus: "pending",
      });

      // Schedule background generation
      await ctx.scheduler.runAfter(0, api.ai_stories._generateBankerStoryInternal, {
        storyId,
        userId: user._id,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      return { storyId, success: true };
    } catch (error: any) {
      return { storyId: "" as Id<"ai_stories">, success: false, error: error.message || "Unknown error occurred" };
    }
  },
});

/**
 * Internal action to generate investor story in the background
 */
export const _generateInvestorStoryInternal = internalAction({
  args: {
    storyId: v.id("ai_stories"),
    userId: v.id("users"),
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args) => {
    try {
      // Update status to generating
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "generating",
      });

      // Aggregate financial data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      // Build prompt
      const periodLabel = `${new Date(args.periodStart).toLocaleDateString()} to ${new Date(args.periodEnd).toLocaleDateString()}`;
      const prompt = buildInvestorStoryPrompt(financialData, periodLabel);
      const systemPrompt = (args.periodType === "annually"
        ? STORY_SYSTEM_PROMPTS.investor.quarterly
        : STORY_SYSTEM_PROMPTS.investor[args.periodType]) || STORY_SYSTEM_PROMPTS.investor.monthly;

      // Call OpenRouter API
      const result = await callOpenRouterAPI(prompt, systemPrompt);

      // Update story with results
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        narrative: result.narrative,
        summary: result.summary || result.insight || "",
        keyMetrics: result.keyMetrics,
        generationStatus: "completed",
      });

      // Create notification
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_complete",
        title: "Story Generated",
        message: `Your Investor Story for ${periodName} is ready to view.`,
        metadata: { storyId: args.storyId },
      });
    } catch (error: any) {
      // Update story with error
      await ctx.runMutation(api.ai_stories.updateStory, {
        storyId: args.storyId,
        generationStatus: "failed",
        generationError: error.message || "Unknown error occurred",
      });

      // Create failure notification
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.userId,
        type: "story_failed",
        title: "Story Generation Failed",
        message: `Failed to generate your Investor Story: ${error.message || "Unknown error"}`,
        metadata: { storyId: args.storyId },
      });
    }
  },
});

/**
 * Generate Investor Story (schedules background generation)
 */
export const generateInvestorStory = action({
  args: {
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args): Promise<{ storyId: Id<"ai_stories">; success: boolean; error?: string }> => {
    try {
      const user = await ctx.runQuery(api.users.getCurrentUser);
      if (!user) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "User not found" };
      }

      // Validate date range
      if (args.periodStart >= args.periodEnd) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "Invalid date range: start date must be before end date" };
      }

      // Check if we have data
      const financialData = await ctx.runQuery(api.ai_stories.aggregateFinancialDataQuery, {
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      if (financialData.transactionCount === 0) {
        return { storyId: "" as Id<"ai_stories">, success: false, error: "No financial data found for the selected period" };
      }

      // Create title
      const periodName = args.periodType === "monthly"
        ? new Date(args.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : args.periodType === "quarterly"
          ? `Q${Math.floor(new Date(args.periodStart).getMonth() / 3) + 1} ${new Date(args.periodStart).getFullYear()}`
          : `${new Date(args.periodStart).getFullYear()}`;

      const title = `Investor Story - ${periodName}`;

      // Create pending story record
      const storyId = await ctx.runMutation(api.ai_stories.createStory, {
        userId: user._id,
        storyType: "investor",
        periodType: args.periodType,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        title,
        generationStatus: "pending",
      });

      // Schedule background generation
      await ctx.scheduler.runAfter(0, api.ai_stories._generateInvestorStoryInternal, {
        storyId,
        userId: user._id,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        periodType: args.periodType,
      });

      return { storyId, success: true };
    } catch (error: any) {
      return { storyId: "" as Id<"ai_stories">, success: false, error: error.message || "Unknown error occurred" };
    }
  },
});

/**
 * Get all stories for user
 */
export const getStories = query({
  args: {
    periodType: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let stories = await ctx.db
      .query("ai_stories")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Filter by period type if provided
    if (args.periodType) {
      stories = stories.filter((s) => s.periodType === args.periodType);
    }

    // Sort by periodEnd descending (most recent first)
    stories.sort((a, b) => b.periodEnd - a.periodEnd);

    return stories.map((story) => ({
      _id: story._id,
      storyType: story.storyType,
      periodType: story.periodType,
      periodStart: story.periodStart,
      periodEnd: story.periodEnd,
      title: story.title,
      summary: story.summary,
      narrative: story.narrative,
      keyMetrics: story.keyMetrics,
      userNotes: story.userNotes,
      attachments: story.attachments,
      generationStatus: story.generationStatus,
      generationError: story.generationError,
      version: story.version,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    }));
  },
});

/**
 * Get story by ID
 */
export const getStoryById = query({
  args: {
    storyId: v.id("ai_stories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const story = await ctx.db.get(args.storyId);

    if (!story || story.userId !== user._id) {
      return null;
    }

    return story;
  },
});

/**
 * Update story (user notes, attachments, generation status)
 */
export const updateStory = mutation({
  args: {
    storyId: v.id("ai_stories"),
    userNotes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    narrative: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyMetrics: v.optional(v.any()),
    generationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const story = await ctx.db.get(args.storyId);

    if (!story || story.userId !== user._id) {
      throw new Error("Story not found or unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
      version: story.version + 1,
    };

    if (args.userNotes !== undefined) {
      updateData.userNotes = args.userNotes;
    }

    if (args.attachments !== undefined) {
      updateData.attachments = args.attachments;
    }

    if (args.narrative !== undefined) {
      updateData.narrative = args.narrative;
    }

    if (args.summary !== undefined) {
      updateData.summary = args.summary;
    }

    if (args.keyMetrics !== undefined) {
      updateData.keyMetrics = args.keyMetrics;
    }

    if (args.generationStatus !== undefined) {
      updateData.generationStatus = args.generationStatus;
    }

    if (args.generationError !== undefined) {
      updateData.generationError = args.generationError;
    }

    await ctx.db.patch(args.storyId, updateData);

    return { success: true };
  },
});

/**
 * Export story in various formats
 */
export const exportStory = action({
  args: {
    storyId: v.id("ai_stories"),
    format: v.union(v.literal("pdf"), v.literal("email"), v.literal("csv"), v.literal("shareable-link")),
  },
  handler: async (ctx, args): Promise<any> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const story = await ctx.runQuery(api.ai_stories.getStoryById, { storyId: args.storyId });

    if (!story || story.userId !== user._id) {
      throw new Error("Story not found or unauthorized");
    }

    // Get business profile for export formatting
    const businessProfile = await ctx.runQuery(api.businessProfiles.getBusinessProfile);

    const periodLabel = `${new Date(story.periodStart).toLocaleDateString()} to ${new Date(story.periodEnd).toLocaleDateString()}`;

    if (args.format === "csv") {
      // CSV export - key metrics as CSV
      const csvRows: string[] = [];
      csvRows.push("Metric,Value");
      Object.entries(story.keyMetrics).forEach(([key, value]) => {
        csvRows.push(`${key},${value}`);
      });
      const csvContent = csvRows.join("\n");

      return {
        format: "csv",
        content: csvContent,
        filename: `${story.title.replace(/\s+/g, "_")}_metrics.csv`,
        mimeType: "text/csv",
      };
    } else if (args.format === "email") {
      // Email format - HTML email template
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${story.title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">${story.title}</h1>
  <p style="color: #666; font-size: 14px;">${periodLabel}</p>
  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
  <div style="white-space: pre-wrap; margin-top: 20px;">${story.narrative}</div>
  ${Object.keys(story.keyMetrics).length > 0 ? `
  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
  <h2 style="color: #2563eb; margin-top: 30px;">Key Metrics</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    ${Object.entries(story.keyMetrics).map(([key, value]) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${key.replace(/([A-Z])/g, " $1").trim()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${typeof value === "number" ? value.toLocaleString("en-US", { style: "currency", currency: "USD" }) : String(value)}</td>
    </tr>
    `).join("")}
  </table>
  ` : ""}
  ${story.userNotes ? `
  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
  <h2 style="color: #2563eb; margin-top: 30px;">Notes</h2>
  <div style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 10px;">${story.userNotes}</div>
  ` : ""}
  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
    Generated by EZ Financial AI Stories
  </p>
</body>
</html>
      `.trim();

      return {
        format: "email",
        content: emailHtml,
        subject: story.title,
        mimeType: "text/html",
      };
    } else if (args.format === "shareable-link") {
      // Shareable link - generate a unique token (simplified for now)
      // TODO: Implement proper shareable link generation with password protection
      const token = `story_${story._id}_${Date.now()}`;
      const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ezfinancial.app"}/stories/share/${token}`;

      return {
        format: "shareable-link",
        url: shareableUrl,
        token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        message: "Shareable link generated. Full implementation with password protection coming soon.",
      };
    } else {
      // PDF format - return structured data for PDF generation
      // TODO: Implement actual PDF generation using a library like @react-pdf/renderer
      return {
        format: "pdf",
        data: {
          title: story.title,
          period: periodLabel,
          storyType: story.storyType,
          periodType: story.periodType,
          narrative: story.narrative,
          summary: story.summary,
          keyMetrics: story.keyMetrics,
          userNotes: story.userNotes,
          businessName: businessProfile?.legalBusinessName || businessProfile?.dbaTradeName || "Your Business",
          generatedAt: new Date(story.updatedAt).toLocaleDateString(),
        },
        message: "PDF export data prepared. Full PDF generation coming soon.",
      };
    }
  },
});
