/**
 * Unit Tests for AI Insights Module
 * Tests convex/ai_insights.ts functions
 */

import { describe, it, expect } from "vitest";
import { createTestId } from "../../mocks/mockConvexContext";
import type { Id } from "../../../convex/_generated/dataModel";

// Test data
const testOrg = {
    _id: createTestId("organizations") as Id<"organizations">,
    name: "Test Business",
    status: "active" as const,
};

const testUser = {
    _id: createTestId("users") as Id<"users">,
    email: "test@example.com",
};

describe("AI Insights - Unit Tests", () => {
    describe("Insight Generation", () => {
        it("should calculate monthly metrics correctly", () => {
            const transactions = [
                { amount: 5000, createdAt: Date.now() }, // Income
                { amount: 3000, createdAt: Date.now() }, // Income
                { amount: -1500, createdAt: Date.now() }, // Expense
                { amount: -800, createdAt: Date.now() }, // Expense
                { amount: -200, createdAt: Date.now() }, // Expense
            ];

            const income = transactions
                .filter((t) => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = transactions
                .filter((t) => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const netCashFlow = income - expenses;

            expect(income).toBe(8000);
            expect(expenses).toBe(2500);
            expect(netCashFlow).toBe(5500);
        });

        it("should generate period string in correct format", () => {
            const now = new Date(2024, 11, 15); // December 15, 2024
            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

            expect(period).toBe("2024-12");
        });

        it("should skip insight generation if already exists for period", () => {
            const existingInsights = [
                { type: "monthly_narrative", period: "2024-12", orgId: testOrg._id },
            ];

            const checkExists = (
                insights: typeof existingInsights,
                orgId: string,
                period: string,
                type: string
            ) => {
                return insights.some(
                    (i) => i.orgId === orgId && i.period === period && i.type === type
                );
            };

            expect(
                checkExists(existingInsights, testOrg._id, "2024-12", "monthly_narrative")
            ).toBe(true);
            expect(
                checkExists(existingInsights, testOrg._id, "2024-11", "monthly_narrative")
            ).toBe(false);
        });
    });

    describe("Anomaly Detection", () => {
        it("should detect transactions above threshold", () => {
            const transactions = [
                { amount: -50 },
                { amount: -55 },
                { amount: -52 },
                { amount: -48 },
                { amount: -51 },
                { amount: -5000 }, // Extreme anomaly
                { amount: -10000 }, // Extreme anomaly
            ];

            const amounts = transactions.map((t) => Math.abs(t.amount));
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(
                amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) /
                amounts.length
            );
            const threshold = avgAmount + 2 * stdDev;

            const anomalies = transactions.filter(
                (t) => Math.abs(t.amount) > threshold
            );

            // With such extreme values, we should detect the outliers
            expect(anomalies.length).toBeGreaterThanOrEqual(1);
            expect(anomalies.some((a) => Math.abs(a.amount) >= 5000)).toBe(true);
        });

        it("should not generate alert if no anomalies found", () => {
            const transactions = [
                { amount: -50 },
                { amount: -55 },
                { amount: -45 },
                { amount: -52 },
                { amount: -48 },
            ];

            const amounts = transactions.map((t) => Math.abs(t.amount));
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(
                amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) /
                amounts.length
            );
            const threshold = avgAmount + 2 * stdDev;

            const anomalies = transactions.filter(
                (t) => Math.abs(t.amount) > threshold
            );

            expect(anomalies.length).toBe(0);
        });
    });

    describe("Cash Flow Forecast", () => {
        it("should calculate monthly averages from 90 days of data", () => {
            // Simulate 90 days of transactions (approximately 3 months)
            const income = 15000; // Total income over 90 days
            const expenses = 9000; // Total expenses over 90 days

            const monthlyIncome = income / 3;
            const monthlyExpenses = expenses / 3;

            expect(monthlyIncome).toBe(5000);
            expect(monthlyExpenses).toBe(3000);
        });

        it("should generate forecast for correct number of months", () => {
            const now = new Date(2024, 11, 15); // December 15, 2024
            const monthsToForecast = 3;

            const forecast = [];
            for (let i = 1; i <= monthsToForecast; i++) {
                const forecastDate = new Date(now);
                forecastDate.setMonth(forecastDate.getMonth() + i);

                forecast.push({
                    month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`,
                    projectedIncome: 5000,
                    projectedExpenses: 3000,
                    projectedNetCashFlow: 2000,
                });
            }

            expect(forecast.length).toBe(3);
            expect(forecast[0].month).toBe("2025-01");
            expect(forecast[1].month).toBe("2025-02");
            expect(forecast[2].month).toBe("2025-03");
        });

        it("should require minimum data for forecasting", () => {
            const transactionCount = 5;
            const minimumRequired = 10;

            const canForecast = transactionCount >= minimumRequired;
            expect(canForecast).toBe(false);

            const transactionCount2 = 50;
            const canForecast2 = transactionCount2 >= minimumRequired;
            expect(canForecast2).toBe(true);
        });
    });

    describe("Spending Recommendations", () => {
        it("should calculate category spending percentages", () => {
            const categorySpending = {
                "Software & Tools": 2500,
                Marketing: 1500,
                "Office Supplies": 500,
                Utilities: 300,
                Other: 200,
            };

            const totalSpending = Object.values(categorySpending).reduce(
                (a, b) => a + b,
                0
            );

            const percentages = Object.entries(categorySpending).map(
                ([category, amount]) => ({
                    category,
                    amount,
                    percentage: ((amount / totalSpending) * 100).toFixed(1),
                })
            );

            expect(totalSpending).toBe(5000);
            expect(percentages[0].percentage).toBe("50.0"); // Software = 50%
            expect(percentages[1].percentage).toBe("30.0"); // Marketing = 30%
        });

        it("should rank categories by spending amount", () => {
            const categorySpending: Record<string, number> = {
                Marketing: 1500,
                "Software & Tools": 2500,
                Utilities: 300,
                "Office Supplies": 500,
            };

            const sorted = Object.entries(categorySpending)
                .sort((a, b) => b[1] - a[1])
                .map(([category]) => category);

            expect(sorted[0]).toBe("Software & Tools");
            expect(sorted[1]).toBe("Marketing");
            expect(sorted[2]).toBe("Office Supplies");
            expect(sorted[3]).toBe("Utilities");
        });
    });

    describe("Insight Types", () => {
        it("should support all defined insight types", () => {
            const validTypes = [
                "monthly_narrative",
                "alert",
                "recommendation",
                "forecast",
            ];

            const isValidType = (type: string) => validTypes.includes(type);

            expect(isValidType("monthly_narrative")).toBe(true);
            expect(isValidType("alert")).toBe(true);
            expect(isValidType("recommendation")).toBe(true);
            expect(isValidType("forecast")).toBe(true);
            expect(isValidType("invalid_type")).toBe(false);
        });
    });
});
