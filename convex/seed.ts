/**
 * Seed Mutations for Gap Fixes
 * Seeds story templates, business type configs, and default category sets
 */

import { mutation } from "./_generated/server";

/**
 * GAP-001: Seed story templates from previously hardcoded storyConfig.ts
 * Run once to populate the story_templates table
 */
export const seedStoryTemplates = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if templates already exist
        const existing = await ctx.db.query("story_templates").first();
        if (existing) {
            return "Story templates already seeded. Delete existing templates first to re-seed.";
        }

        const now = Date.now();

        // Company - Monthly
        await ctx.db.insert("story_templates", {
            title: "Company Story",
            slug: "company-monthly",
            storyType: "company",
            periodType: "monthly",
            subtitle: "Internal compass - burn rate, trends, cash runway",
            role: "Chief Financial Officer",
            systemPrompt: `You are the Chief Financial Officer preparing an internal monthly financial report for the executive team and board of directors.

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

**Key Metrics to Calculate:**
- burnRate: Monthly cash consumption
- runway: Months of operation at current burn
- cashFlow: Net change in cash
- expenses: Total monthly expenses
- topExpenseCategory: Highest expense area
- debtToRevenue: If applicable`,
            dataRequirements: [
                "cash_balance",
                "monthly_expenses",
                "monthly_revenue",
                "expense_categories",
                "prior_month_comparison",
                "budget_targets"
            ],
            focuses: [
                "Monthly burn rate and cash runway",
                "Expense trends and cost management",
                "Revenue growth and operational efficiency",
                "Actionable recommendations for next month"
            ],
            tone: "Direct, actionable, focused on operational sustainability",
            exampleOpening: "With $342K in cash and a monthly burn rate of $87K, the company maintains a 3.9-month runway. October's operations consumed $18K less cash than September, driven by disciplined expense management while revenue grew 5.5% to $341K...",
            icon: "BookOpen",
            keyMetricsToCalculate: ["burnRate", "runway", "cashFlow", "expenses", "topExpenseCategory", "debtToRevenue"],
            order: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Company - Quarterly
        await ctx.db.insert("story_templates", {
            title: "Company Story",
            slug: "company-quarterly",
            storyType: "company",
            periodType: "quarterly",
            subtitle: "Internal compass - burn rate, trends, cash runway",
            role: "Chief Financial Officer",
            systemPrompt: `You are the Chief Financial Officer preparing a quarterly financial report for the executive team, board of directors, and key stakeholders.

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

**Key Metrics to Calculate:**
- revenue: Quarterly total
- growthRate: QoQ growth percentage
- netIncome: Quarterly profit/loss
- cashFlow: Net quarterly cash change
- expenses: Quarterly total
- debtToRevenue: If applicable`,
            dataRequirements: [
                "quarterly_revenue",
                "quarterly_expenses",
                "quarterly_cash_flow",
                "prior_quarter_comparison",
                "yearly_comparison",
                "quarterly_targets"
            ],
            focuses: [
                "Quarterly performance trends",
                "Strategic financial metrics",
                "Comparative analysis (QoQ, YoY)",
                "Forward-looking outlook"
            ],
            tone: "Strategic, analytical, forward-looking",
            exampleOpening: "Q3 marked a turning point with $1.02M in revenue (up 23% QoQ), the first quarter to exceed $1M. The company achieved profitability with $89K net income, driven by revenue acceleration and improved gross margins to 68%...",
            icon: "BookOpen",
            keyMetricsToCalculate: ["revenue", "growthRate", "netIncome", "cashFlow", "expenses", "debtToRevenue"],
            order: 2,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Banker - Monthly
        await ctx.db.insert("story_templates", {
            title: "Banker Story",
            slug: "banker-monthly",
            storyType: "banker",
            periodType: "monthly",
            subtitle: "Financial credibility - debt ratios, cash flow reliability",
            role: "Credit Risk Analyst",
            systemPrompt: `You are a Credit Risk Analyst preparing a credit assessment report for a lending committee.

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

**Key Metrics to Calculate:**
- debtToRevenue: Total debt / monthly revenue
- debtToIncome: Total debt / net income
- cashFlow: Operating cash flow
- revenue: Monthly revenue (stability indicator)
- netIncome: Profitability measure`,
            dataRequirements: [
                "total_debt",
                "monthly_revenue",
                "net_income",
                "cash_balance",
                "accounts_receivable",
                "accounts_payable",
                "debt_service_payments"
            ],
            focuses: [
                "Debt service coverage and ratios",
                "Liquidity and working capital",
                "Cash flow reliability and consistency",
                "Credit risk assessment"
            ],
            tone: "Objective, risk-focused, data-driven",
            exampleOpening: "The company maintains a strong debt-to-revenue ratio of 0.45 with consistent monthly cash flow averaging $24K over the past quarter. With $342K in liquid assets against $154K in total debt, the company demonstrates solid credit fundamentals...",
            icon: "Building2",
            keyMetricsToCalculate: ["debtToRevenue", "debtToIncome", "cashFlow", "revenue", "netIncome"],
            order: 3,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Banker - Quarterly
        await ctx.db.insert("story_templates", {
            title: "Banker Story",
            slug: "banker-quarterly",
            storyType: "banker",
            periodType: "quarterly",
            subtitle: "Financial credibility - debt ratios, cash flow reliability",
            role: "Credit Risk Analyst",
            systemPrompt: `You are a Credit Risk Analyst preparing a quarterly credit review for the lending portfolio.

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

**Key Metrics to Calculate:**
- debtToRevenue: Quarterly average
- debtToIncome: Quarterly calculation
- cashFlow: Quarterly operating cash flow
- revenue: Quarterly total (growth trend)
- netIncome: Quarterly profitability`,
            dataRequirements: [
                "quarterly_debt_balance",
                "quarterly_revenue",
                "quarterly_net_income",
                "quarterly_cash_flow",
                "debt_service_schedule",
                "covenant_requirements"
            ],
            focuses: [
                "Credit quality trends",
                "Leverage and liquidity metrics",
                "Cash flow consistency",
                "Future creditworthiness outlook"
            ],
            tone: "Professional, analytical, forward-looking on credit risk",
            exampleOpening: "Credit quality remains strong with the debt-to-revenue ratio improving from 0.52 to 0.45 over the quarter. Quarterly cash flow of $71K supports comfortable debt service coverage of 3.2x, and the company's growth trajectory suggests continued creditworthiness improvement...",
            icon: "Building2",
            keyMetricsToCalculate: ["debtToRevenue", "debtToIncome", "cashFlow", "revenue", "netIncome"],
            order: 4,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Investor - Monthly
        await ctx.db.insert("story_templates", {
            title: "Investor Story",
            slug: "investor-monthly",
            storyType: "investor",
            periodType: "monthly",
            subtitle: "Growth thesis - revenue efficiency, 12-24 month outlook",
            role: "Venture Capital Investment Partner",
            systemPrompt: `You are a Venture Capital Investment Partner presenting a monthly portfolio company update to the partnership.

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

**Key Metrics to Calculate:**
- growthRate: MoM revenue growth percentage
- ltvCac: Lifetime value to customer acquisition cost ratio
- burnRate: If pre-profitable, monthly burn
- runway: Months to next funding milestone
- revenueGrowth: Absolute and percentage growth
- churn: Monthly customer/revenue churn
- retention: Customer retention rate`,
            dataRequirements: [
                "monthly_revenue",
                "revenue_growth_rate",
                "customer_acquisition_cost",
                "lifetime_value",
                "churn_rate",
                "cash_balance",
                "burn_rate",
                "customer_counts"
            ],
            focuses: [
                "Growth rate and scaling metrics",
                "Unit economics (CAC, LTV, payback)",
                "Capital efficiency and runway",
                "12-24 month growth trajectory"
            ],
            tone: "Growth-focused, optimistic but realistic, forward-looking",
            exampleOpening: "Revenue grew 23% MoM to $341K, maintaining the strong growth trajectory from the past 6 months. With LTV:CAC improving to 4.2x and CAC payback at 8 months, the company demonstrates increasingly efficient growth. At the current burn rate of $87K/month with $342K in the bank, there's 4 months of runway...",
            icon: "TrendingUp",
            keyMetricsToCalculate: ["growthRate", "ltvCac", "burnRate", "runway", "revenueGrowth", "churn", "retention"],
            order: 5,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Investor - Quarterly
        await ctx.db.insert("story_templates", {
            title: "Investor Story",
            slug: "investor-quarterly",
            storyType: "investor",
            periodType: "quarterly",
            subtitle: "Growth thesis - revenue efficiency, 12-24 month outlook",
            role: "Venture Capital Investment Partner",
            systemPrompt: `You are a Venture Capital Investment Partner preparing a quarterly board presentation for investors.

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

**Key Metrics to Calculate:**
- growthRate: QoQ and YoY growth percentages
- ltvCac: Trending LTV:CAC ratio
- revenueGrowth: Absolute quarterly growth
- netIncome: Path to profitability metrics
- retention: Cohort retention analysis
- runway: Months to profitability or next funding`,
            dataRequirements: [
                "quarterly_revenue",
                "quarterly_growth_rates",
                "quarterly_expenses",
                "unit_economics",
                "cohort_analysis",
                "cash_position",
                "milestone_tracking"
            ],
            focuses: [
                "Strategic and financial progress",
                "Growth metrics and cohort performance",
                "Unit economics and capital efficiency",
                "12-24 month strategic outlook"
            ],
            tone: "Strategic, data-driven, inspirational yet honest",
            exampleOpening: "Q3 exceeded plan with $1.02M revenue (23% QoQ, 145% YoY), crossing the $1M quarterly milestone. The company achieved its first profitable quarter with $89K net income, driven by improving gross margins (now 68%) and scaling efficiency. With LTV:CAC at 5.1x and net revenue retention at 118%, the company is positioned for continued efficient growth...",
            icon: "TrendingUp",
            keyMetricsToCalculate: ["growthRate", "ltvCac", "revenueGrowth", "netIncome", "retention", "runway"],
            order: 6,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        return "Seeded 6 story templates (3 types × 2 periods)";
    },
});

/**
 * GAP-002: Seed business type configurations from previously hardcoded onboarding
 */
export const seedBusinessTypes = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if already seeded
        const existing = await ctx.db.query("business_type_configs").first();
        if (existing) {
            return "Business types already seeded.";
        }

        const now = Date.now();
        const businessTypes = [
            { slug: "creator", displayName: "Creator (Video, Design, Writing, Coaching)", order: 1 },
            { slug: "tradesperson", displayName: "Tradesperson (Handyman, Electrician, etc.)", order: 2 },
            { slug: "wellness", displayName: "Health & Wellness (Trainer, Therapist, etc.)", order: 3 },
            { slug: "tutor", displayName: "Tutor or Educator", order: 4 },
            { slug: "real_estate", displayName: "Real Estate Agent", order: 5 },
            { slug: "agency", displayName: "Small Agency or Studio", order: 6 },
            { slug: "other", displayName: "Other", order: 7 },
        ];

        for (const bt of businessTypes) {
            await ctx.db.insert("business_type_configs", {
                slug: bt.slug,
                displayName: bt.displayName,
                order: bt.order,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
        }

        return `Seeded ${businessTypes.length} business types`;
    },
});

/**
 * GAP-003: Seed default category sets from previously hardcoded CategorySelector
 */
export const seedDefaultCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if already seeded
        const existing = await ctx.db.query("default_category_sets").first();
        if (existing) {
            return "Default categories already seeded.";
        }

        const now = Date.now();

        // General default set (applies to all business types)
        await ctx.db.insert("default_category_sets", {
            name: "General",
            categories: [
                "Food & Drinks",
                "Office Supplies",
                "Travel",
                "Software",
                "Utilities",
                "Shopping",
                "Entertainment",
                "Health & Fitness",
                "Marketing",
                "Professional Services",
                "Rent",
                "Insurance",
                "Income",
                "Other",
            ],
            isDefault: true,
            order: 1,
            createdAt: now,
            updatedAt: now,
        });

        return "Seeded default category set (General)";
    },
});
