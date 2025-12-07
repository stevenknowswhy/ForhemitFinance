/**
 * AI Insights Module
 * Core AI functionality for scheduled and on-demand insights
 */

import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction, action, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

type CashFlowForecastResult = {
    success: boolean;
    forecast?: any[];
    error?: string;
};

type SpendingRecommendationsResult = {
    success: boolean;
    recommendations?: any[];
    totalSpending?: number;
    error?: string;
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Get recent AI insights for an organization
 */
export const getInsights = query({
    args: {
        orgId: v.optional(v.id("organizations")),
        userId: v.optional(v.id("users")),
        type: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let insights: Doc<"ai_insights">[] = [];

        if (args.orgId) {
            insights = await ctx.db
                .query("ai_insights")
                .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
                .order("desc")
                .take(args.limit || 20);
        } else if (args.userId) {
            insights = await ctx.db
                .query("ai_insights")
                .withIndex("by_user", (q) => q.eq("userId", args.userId!))
                .order("desc")
                .take(args.limit || 20);
        } else {
            insights = [];
        }

        if (args.type) {
            insights = insights.filter((i) => i.type === args.type);
        }

        return insights;
    },
});

/**
 * Get insights for a specific period
 */
export const getInsightsByPeriod = query({
    args: {
        userId: v.id("users"),
        orgId: v.optional(v.id("organizations")),
        period: v.string(), // "2024-01" format
    },
    handler: async (ctx, args) => {
        if (args.orgId) {
            return ctx.db
                .query("ai_insights")
                .withIndex("by_org_period", (q) =>
                    q.eq("orgId", args.orgId).eq("period", args.period)
                )
                .collect();
        }

        return ctx.db
            .query("ai_insights")
            .withIndex("by_user_period", (q) =>
                q.eq("userId", args.userId).eq("period", args.period)
            )
            .collect();
    },
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new AI insight
 */
export const createInsight = mutation({
    args: {
        userId: v.id("users"),
        orgId: v.optional(v.id("organizations")),
        type: v.union(
            v.literal("monthly_narrative"),
            v.literal("alert"),
            v.literal("recommendation"),
            v.literal("forecast")
        ),
        period: v.string(),
        title: v.string(),
        content: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("ai_insights", {
            ...args,
            createdAt: Date.now(),
        });
        return id;
    },
});

/**
 * Delete an AI insight
 */
export const deleteInsight = mutation({
    args: {
        id: v.id("ai_insights"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// ==========================================
// INTERNAL MUTATIONS (For scheduled jobs)
// ==========================================

/**
 * Generate monthly insights for all active organizations
 */
export const generateMonthlyInsightsInternal = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

        // Get all active organizations
        const orgs = await ctx.db
            .query("organizations")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        let generated = 0;

        for (const org of orgs) {
            // Get org owner
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_org", (q) => q.eq("orgId", org._id))
                .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
                .first();

            if (!membership) continue;

            // Check if already generated for this period
            const existing = await ctx.db
                .query("ai_insights")
                .withIndex("by_org_period", (q) =>
                    q.eq("orgId", org._id).eq("period", period)
                )
                .filter((q) => q.eq(q.field("type"), "monthly_narrative"))
                .first();

            if (existing) continue;

            // Schedule the actual generation action
            await ctx.scheduler.runAfter(0, internal.ai_insights.generateInsightAction, {
                userId: membership.userId,
                orgId: org._id,
                type: "monthly_narrative",
                period,
            });

            generated++;
        }

        console.log(`Scheduled monthly insight generation for ${generated} organizations`);
        return { scheduled: generated };
    },
});

/**
 * Generate anomaly detection alerts
 */
export const generateAnomalyAlertsInternal = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // Get all active organizations
        const orgs = await ctx.db
            .query("organizations")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        let alertsGenerated = 0;

        for (const org of orgs) {
            // Get recent transactions (last 30 days)
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const transactions = await ctx.db
                .query("transactions_raw")
                .withIndex("by_org", (q) => q.eq("orgId", org._id))
                .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
                .collect();

            if (transactions.length < 10) continue; // Not enough data

            // Simple anomaly detection: Large transactions
            const amounts = transactions.map((t) => Math.abs(t.amount));
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(
                amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
            );
            const threshold = avgAmount + 2 * stdDev;

            const anomalies = transactions.filter((t) => Math.abs(t.amount) > threshold);

            if (anomalies.length > 0) {
                // Get org owner
                const membership = await ctx.db
                    .query("memberships")
                    .withIndex("by_org", (q) => q.eq("orgId", org._id))
                    .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
                    .first();

                if (!membership) continue;

                await ctx.db.insert("ai_insights", {
                    userId: membership.userId,
                    orgId: org._id,
                    type: "alert",
                    period,
                    title: `${anomalies.length} Unusual Transaction${anomalies.length > 1 ? "s" : ""} Detected`,
                    content: `We detected ${anomalies.length} transaction(s) that are significantly larger than your typical spending pattern. The threshold for unusual activity is $${threshold.toFixed(2)}.`,
                    metadata: {
                        anomalyCount: anomalies.length,
                        threshold,
                        avgAmount,
                        transactionIds: anomalies.map((a) => a._id),
                    },
                    createdAt: Date.now(),
                });

                alertsGenerated++;
            }
        }

        console.log(`Generated ${alertsGenerated} anomaly alerts`);
        return { alertsGenerated };
    },
});

// ==========================================
// INTERNAL ACTIONS (AI-powered generation)
// ==========================================

/**
 * Generate a single insight using AI
 */
export const generateInsightAction = internalAction({
    args: {
        userId: v.id("users"),
        orgId: v.id("organizations"),
        type: v.string(),
        period: v.string(),
    },
    handler: async (ctx, args) => {
        // Get financial data
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        // Run queries to get data
        const transactions = await ctx.runQuery(internal.ai_insights.getTransactionsForInsight, {
            orgId: args.orgId,
            since: thirtyDaysAgo,
        });

        if (!transactions || transactions.length === 0) {
            console.log(`No transactions for org ${args.orgId}, skipping insight generation`);
            return;
        }

        // Calculate metrics
        const income = transactions
            .filter((t: any) => t.amount > 0)
            .reduce((sum: number, t: any) => sum + t.amount, 0);
        const expenses = transactions
            .filter((t: any) => t.amount < 0)
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        const netCashFlow = income - expenses;

        // Generate insight content
        let title: string;
        let content: string;

        if (args.type === "monthly_narrative") {
            title = `Monthly Financial Summary - ${args.period}`;
            content = `This month, you recorded $${income.toLocaleString()} in income and $${expenses.toLocaleString()} in expenses, resulting in a net cash flow of ${netCashFlow >= 0 ? "+" : ""}$${netCashFlow.toLocaleString()}.

${netCashFlow >= 0
                    ? "Great job! You're in positive territory this month."
                    : "Your expenses exceeded your income this month. Consider reviewing your spending categories."}

Key highlights:
• ${transactions.length} transactions processed
• Average transaction size: $${(transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / transactions.length).toFixed(2)}
• ${transactions.filter((t: any) => t.amount > 0).length} income transactions
• ${transactions.filter((t: any) => t.amount < 0).length} expense transactions`;
        } else {
            title = "Financial Insight";
            content = "Your financial data has been analyzed.";
        }

        // Save the insight
        await ctx.runMutation(internal.ai_insights.saveInsightInternal, {
            userId: args.userId,
            orgId: args.orgId,
            type: args.type as any,
            period: args.period,
            title,
            content,
            metadata: {
                income,
                expenses,
                netCashFlow,
                transactionCount: transactions.length,
            },
        });
    },
});

/**
 * Internal query to get transactions for insight generation
 */
export const getTransactionsForInsight = internalQuery({
    args: {
        orgId: v.id("organizations"),
        since: v.number(),
    },
    handler: async (ctx, args) => {
        return ctx.db
            .query("transactions_raw")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.gte(q.field("createdAt"), args.since))
            .collect();
    },
});

/**
 * Internal mutation to save insight
 */
export const saveInsightInternal = internalMutation({
    args: {
        userId: v.id("users"),
        orgId: v.id("organizations"),
        type: v.union(
            v.literal("monthly_narrative"),
            v.literal("alert"),
            v.literal("recommendation"),
            v.literal("forecast")
        ),
        period: v.string(),
        title: v.string(),
        content: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.db.insert("ai_insights", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// ==========================================
// PUBLIC ACTIONS (On-demand AI)
// ==========================================

/**
 * Generate a cash flow forecast (on-demand)
 */
export const generateCashFlowForecast = action({
    args: {
        userId: v.id("users"),
        orgId: v.id("organizations"),
        months: v.optional(v.number()), // How many months to forecast
    },
    handler: async (ctx, args): Promise<CashFlowForecastResult> => {
        const months = args.months || 3;

        // Get historical data (last 90 days)
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const transactions = await ctx.runQuery(internal.ai_insights.getTransactionsForInsight, {
            orgId: args.orgId,
            since: ninetyDaysAgo,
        });

        if (!transactions || transactions.length < 10) {
            return {
                success: false,
                error: "Not enough historical data for forecasting. Need at least 10 transactions.",
            };
        }

        // Calculate monthly averages
        const monthlyIncome = transactions
            .filter((t: any) => t.amount > 0)
            .reduce((sum: number, t: any) => sum + t.amount, 0) / 3;
        const monthlyExpenses = transactions
            .filter((t: any) => t.amount < 0)
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / 3;

        // Simple linear forecast
        const forecast = [];
        const now = new Date();

        for (let i = 1; i <= months; i++) {
            const forecastDate = new Date(now);
            forecastDate.setMonth(forecastDate.getMonth() + i);

            forecast.push({
                month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`,
                projectedIncome: Math.round(monthlyIncome),
                projectedExpenses: Math.round(monthlyExpenses),
                projectedNetCashFlow: Math.round(monthlyIncome - monthlyExpenses),
            });
        }

        // Save as insight
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await ctx.runMutation(internal.ai_insights.saveInsightInternal, {
            userId: args.userId,
            orgId: args.orgId,
            type: "forecast",
            period,
            title: `${months}-Month Cash Flow Forecast`,
            content: `Based on your last 90 days of activity, here's your projected cash flow:

${forecast.map((f) => `• ${f.month}: +$${f.projectedIncome.toLocaleString()} income, -$${f.projectedExpenses.toLocaleString()} expenses = ${f.projectedNetCashFlow >= 0 ? "+" : ""}$${f.projectedNetCashFlow.toLocaleString()}`).join("\n")}

This forecast is based on historical averages and assumes similar spending patterns continue.`,
            metadata: {
                forecast,
                basedOnDays: 90,
                monthlyAverageIncome: Math.round(monthlyIncome),
                monthlyAverageExpenses: Math.round(monthlyExpenses),
            },
        });

        return {
            success: true,
            forecast,
        };
    },
});

/**
 * Generate spending recommendations (on-demand)
 */
export const generateSpendingRecommendations = action({
    args: {
        userId: v.id("users"),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args): Promise<SpendingRecommendationsResult> => {
        // Get last 60 days of transactions
        const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
        const transactions = await ctx.runQuery(internal.ai_insights.getTransactionsForInsight, {
            orgId: args.orgId,
            since: sixtyDaysAgo,
        });

        if (!transactions || transactions.length < 5) {
            return {
                success: false,
                error: "Not enough data for recommendations.",
            };
        }

        // Analyze spending by category
        const categorySpending: Record<string, number> = {};
        for (const tx of transactions) {
            if ((tx as any).amount < 0) {
                const category = (tx as any).categoryName || (tx as any).category?.[0] || "Uncategorized";
                categorySpending[category] = (categorySpending[category] || 0) + Math.abs((tx as any).amount);
            }
        }

        // Sort by amount
        const sortedCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const totalSpending = Object.values(categorySpending).reduce((a, b) => a + b, 0);

        // Generate recommendations
        const recommendations = sortedCategories.map(([category, amount], index) => {
            const percentage = ((amount / totalSpending) * 100).toFixed(1);
            const suggestion =
                index === 0
                    ? "This is your biggest expense category. Consider reviewing for potential savings."
                    : index < 3
                        ? "A significant portion of your spending. Look for optimization opportunities."
                        : "Monitor this category to ensure it stays within budget.";

            return {
                category,
                amount: Math.round(amount),
                percentage: parseFloat(percentage),
                suggestion,
            };
        });

        // Save as insight
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        await ctx.runMutation(internal.ai_insights.saveInsightInternal, {
            userId: args.userId,
            orgId: args.orgId,
            type: "recommendation",
            period,
            title: "Spending Analysis & Recommendations",
            content: `Based on your spending over the last 60 days, here are your top expense categories:

${recommendations.map((r) => `• **${r.category}**: $${r.amount.toLocaleString()} (${r.percentage}%) - ${r.suggestion}`).join("\n")}

Total spending: $${totalSpending.toLocaleString()}`,
            metadata: {
                recommendations,
                totalSpending: Math.round(totalSpending),
                analyzedDays: 60,
                transactionCount: transactions.length,
            },
        });

        return {
            success: true,
            recommendations,
            totalSpending: Math.round(totalSpending),
        };
    },
});
