// Story Generation Configuration with Role-Specific System Prompts

export const STORY_CONFIGS = {
  company: {
    monthly: {
      icon: "BookOpen",
      title: "Company Story",
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
- debtToRevenue: If applicable

**Example Opening:**
"With $342K in cash and a monthly burn rate of $87K, the company maintains a 3.9-month runway. October's operations consumed $18K less cash than September, driven by disciplined expense management while revenue grew 5.5% to $341K..."`,
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
      ]
    },
    quarterly: {
      icon: "BookOpen",
      title: "Company Story",
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
- debtToRevenue: If applicable

**Example Opening:**
"Q3 marked a turning point with $1.02M in revenue (up 23% QoQ), the first quarter to exceed $1M. The company achieved profitability with $89K net income, driven by revenue acceleration and improved gross margins to 68%..."`,
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
      ]
    }
  },
  banker: {
    monthly: {
      icon: "Building2",
      title: "Banker Story",
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
- netIncome: Profitability measure

**Example Opening:**
"The company maintains a strong debt-to-revenue ratio of 0.45 with consistent monthly cash flow averaging $24K over the past quarter. With $342K in liquid assets against $154K in total debt, the company demonstrates solid credit fundamentals..."`,
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
      ]
    },
    quarterly: {
      icon: "Building2",
      title: "Banker Story",
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
- netIncome: Quarterly profitability

**Example Opening:**
"Credit quality remains strong with the debt-to-revenue ratio improving from 0.52 to 0.45 over the quarter. Quarterly cash flow of $71K supports comfortable debt service coverage of 3.2x, and the company's growth trajectory suggests continued creditworthiness improvement..."`,
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
      ]
    }
  },
  investor: {
    monthly: {
      icon: "TrendingUp",
      title: "Investor Story",
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
- retention: Customer retention rate

**Example Opening:**
"Revenue grew 23% MoM to $341K, maintaining the strong growth trajectory from the past 6 months. With LTV:CAC improving to 4.2x and CAC payback at 8 months, the company demonstrates increasingly efficient growth. At the current burn rate of $87K/month with $342K in the bank, there's 4 months of runway..."`,
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
      ]
    },
    quarterly: {
      icon: "TrendingUp",
      title: "Investor Story",
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
- runway: Months to profitability or next funding

**Example Opening:**
"Q3 exceeded plan with $1.02M revenue (23% QoQ, 145% YoY), crossing the $1M quarterly milestone. The company achieved its first profitable quarter with $89K net income, driven by improving gross margins (now 68%) and scaling efficiency. With LTV:CAC at 5.1x and net revenue retention at 118%, the company is positioned for continued efficient growth..."`,
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
      ]
    }
  }
};

// Data Validation Schema
export const DATA_VALIDATION_SCHEMA = {
  requiredFields: {
    company: [
      'cash_balance',
      'monthly_revenue',
      'monthly_expenses',
      'expense_breakdown'
    ],
    banker: [
      'total_debt',
      'monthly_revenue',
      'net_income',
      'cash_balance',
      'accounts_receivable',
      'accounts_payable'
    ],
    investor: [
      'monthly_revenue',
      'growth_rate',
      'customer_metrics',
      'cash_balance',
      'burn_rate'
    ]
  },
  calculations: {
    burnRate: (expenses: number, revenue: number) => expenses - revenue,
    runway: (cash: number, burn: number) => burn > 0 ? cash / burn : Infinity,
    debtToRevenue: (debt: number, revenue: number) => debt / revenue,
    debtToIncome: (debt: number, income: number) => income > 0 ? debt / income : Infinity,
    growthRate: (current: number, previous: number) => 
      ((current - previous) / previous) * 100,
    ltvCac: (ltv: number, cac: number) => cac > 0 ? ltv / cac : 0
  }
};

// Calculate metrics directly from Convex data
export function calculateMetricsFromConvex(data: any, storyType: string) {
  const metrics: any = {};
  
  // Common calculations
  if (data.monthly_revenue !== undefined) {
    metrics.revenue = data.monthly_revenue;
  }
  
  if (data.monthly_expenses !== undefined) {
    metrics.expenses = data.monthly_expenses;
  }
  
  if (metrics.revenue && metrics.expenses) {
    metrics.netIncome = metrics.revenue - metrics.expenses;
    metrics.cashFlow = metrics.netIncome; // Simplified
  }
  
  // Story-specific calculations
  if (storyType === 'company') {
    if (metrics.netIncome < 0) {
      metrics.burnRate = Math.abs(metrics.netIncome);
      if (data.cash_balance && metrics.burnRate > 0) {
        metrics.runway = data.cash_balance / metrics.burnRate;
      }
    }
    
    if (data.expense_breakdown) {
      const topCategory = Object.entries(data.expense_breakdown)
        .sort(([, a]: any, [, b]: any) => b - a)[0];
      metrics.topExpenseCategory = topCategory?.[0];
    }
  }
  
  if (storyType === 'banker') {
    if (data.total_debt && metrics.revenue) {
      metrics.debtToRevenue = data.total_debt / metrics.revenue;
    }
    
    if (data.total_debt && metrics.netIncome && metrics.netIncome > 0) {
      metrics.debtToIncome = data.total_debt / metrics.netIncome;
    }
  }
  
  if (storyType === 'investor') {
    if (data.previous_revenue && metrics.revenue) {
      metrics.growthRate = 
        ((metrics.revenue - data.previous_revenue) / data.previous_revenue) * 100;
      metrics.revenueGrowth = metrics.growthRate;
    }
    
    if (data.customer_ltv && data.customer_cac) {
      metrics.ltvCac = data.customer_cac > 0 
        ? data.customer_ltv / data.customer_cac 
        : 0;
    }
    
    if (data.churn_rate !== undefined) {
      metrics.churn = data.churn_rate;
      metrics.retention = 100 - data.churn_rate;
    }
  }
  
  return metrics;
}

// PDF Layout Configuration
export const PDF_LAYOUT_CONFIG = {
  page: {
    size: 'LETTER',
    margins: {
      top: 60,
      right: 50,
      bottom: 60,
      left: 50
    }
  },
  typography: {
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 12
    },
    heading2: {
      fontSize: 18,
      fontWeight: 'semibold',
      color: '#2d3748',
      marginBottom: 8
    },
    body: {
      fontSize: 11,
      lineHeight: 1.6,
      color: '#4a5568',
      marginBottom: 12
    },
    caption: {
      fontSize: 9,
      color: '#718096',
      fontStyle: 'italic'
    }
  },
  sections: {
    header: {
      height: 80,
      backgroundColor: '#f7fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    storyCard: {
      marginBottom: 24,
      padding: 20,
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 8
    },
    metricsGrid: {
      columns: 3,
      gap: 16,
      marginTop: 16
    },
    footer: {
      height: 40,
      fontSize: 8,
      color: '#a0aec0'
    }
  },
  colors: {
    primary: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#6b7280'
  }
};
