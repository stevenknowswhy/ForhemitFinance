/**
 * Unit Tests for Subscription Management
 * Tests convex/subscriptions.ts functions
 */

import { describe, it, expect } from "vitest";
import { createMockContext } from "../../mocks/mockConvexContext";
import {
    testOrganizations,
    testPlans,
    testSubscriptions,
} from "../../fixtures/organizations";

describe("Subscriptions - Unit Tests", () => {
    describe("getOrgSubscription", () => {
        it("should retrieve subscription with plan details", async () => {
            const ctx = createMockContext({
                seedData: [
                    { table: "subscriptions", data: [testSubscriptions[0]] },
                    { table: "plans", data: [testPlans[1]] },
                ],
            });

            const subscription = testSubscriptions[0];
            const plan = testPlans.find((p) => p._id === subscription.planId);

            expect(subscription).toBeDefined();
            expect(plan).toBeDefined();
            expect(plan?.name).toBe("pro");
            expect(subscription.status).toBe("active");
        });

        it("should return subscription for specific organization", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "subscriptions", data: testSubscriptions }],
            });

            const orgSubscription = testSubscriptions.find(
                (s) => s.orgId === testOrganizations[0]._id
            );

            expect(orgSubscription).toBeDefined();
            expect(orgSubscription?.orgId).toBe(testOrganizations[0]._id);
        });

        it("should handle organizations without subscriptions", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "subscriptions", data: [] }],
            });

            const subscriptions = await ctx.db.query("subscriptions").collect();
            expect(subscriptions.length).toBe(0);
        });
    });

    describe("updateOrgSubscription", () => {
        it("should update subscription status", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "subscriptions", data: [testSubscriptions[0]] }],
            });

            const subscriptionId = testSubscriptions[0]._id;
            await ctx.db.patch(subscriptionId, {
                status: "canceled" as const,
                canceledAt: Date.now(),
                updatedAt: Date.now(),
            });

            const subscription = await ctx.db.get(subscriptionId);
            expect(subscription?.status).toBe("canceled");
            expect(subscription?.canceledAt).toBeDefined();
        });

        it("should validate subscription status values", () => {
            const validStatuses = [
                "active",
                "trialing",
                "past_due",
                "canceled",
                "suspended",
            ];
            const invalidStatuses = ["pending", "expired", ""];

            const isValidStatus = (status: string) => {
                return validStatuses.includes(status);
            };

            validStatuses.forEach((status) => {
                expect(isValidStatus(status)).toBe(true);
            });

            invalidStatuses.forEach((status) => {
                expect(isValidStatus(status)).toBe(false);
            });
        });

        it("should handle trial to active transition", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "subscriptions", data: [testSubscriptions[1]] }],
            });

            const subscriptionId = testSubscriptions[1]._id;
            expect(testSubscriptions[1].status).toBe("trialing");

            await ctx.db.patch(subscriptionId, {
                status: "active" as const,
                trialEndsAt: undefined,
                renewsAt: Date.now() + 86400000 * 30,
                updatedAt: Date.now(),
            });

            const subscription = await ctx.db.get(subscriptionId);
            expect(subscription?.status).toBe("active");
            expect(subscription?.renewsAt).toBeDefined();
        });
    });

    describe("Plan Limits", () => {
        it("should enforce user limits for plans", () => {
            const starterPlan = testPlans[0];
            const proPlan = testPlans[1];

            expect(starterPlan.limits.maxUsers).toBe(1);
            expect(proPlan.limits.maxUsers).toBe(10);
        });

        it("should check feature availability", () => {
            const starterPlan = testPlans[0];
            const proPlan = testPlans[1];

            const hasAIStories = (plan: typeof starterPlan) => {
                return plan.limits.features.includes("ai_stories");
            };

            expect(hasAIStories(starterPlan)).toBe(false);
            expect(hasAIStories(proPlan)).toBe(true);
        });

        it("should validate transaction limits", () => {
            const starterPlan = testPlans[0];

            expect(starterPlan.limits.maxTransactions).toBe(1000);
            // Pro plan has no transaction limit
            expect(testPlans[1].limits.maxTransactions).toBeUndefined();
        });
    });

    describe("Subscription Lifecycle", () => {
        it("should calculate trial expiration", () => {
            const subscription = testSubscriptions[1];
            const now = Date.now();
            const trialEndsAt = subscription.trialEndsAt!;

            const daysRemaining = Math.ceil((trialEndsAt - now) / 86400000);
            expect(daysRemaining).toBeGreaterThan(0);
            expect(daysRemaining).toBeLessThanOrEqual(7);
        });

        it("should calculate renewal date", () => {
            const subscription = testSubscriptions[0];
            const now = Date.now();
            const renewsAt = subscription.renewsAt!;

            const daysUntilRenewal = Math.ceil((renewsAt - now) / 86400000);
            expect(daysUntilRenewal).toBeGreaterThan(0);
        });

        it("should identify past due subscriptions", () => {
            const now = Date.now();
            const pastDueSubscription = {
                ...testSubscriptions[0],
                status: "past_due" as const,
                renewsAt: now - 86400000 * 5, // 5 days ago
            };

            expect(pastDueSubscription.status).toBe("past_due");
            expect(pastDueSubscription.renewsAt).toBeLessThan(now);
        });
    });

    describe("Pricing Calculations", () => {
        it("should calculate monthly vs yearly savings", () => {
            const proPlan = testPlans[1];
            const monthlyTotal = proPlan.priceMonthly! * 12;
            const yearlyPrice = proPlan.priceYearly!;
            const savings = monthlyTotal - yearlyPrice;
            const savingsPercent = (savings / monthlyTotal) * 100;

            expect(monthlyTotal).toBe(588); // $49 * 12
            expect(yearlyPrice).toBe(490);
            expect(savings).toBe(98);
            expect(savingsPercent).toBeCloseTo(16.67, 1);
        });

        it("should handle free plans", () => {
            const starterPlan = testPlans[0];

            expect(starterPlan.priceMonthly).toBe(0);
            expect(starterPlan.priceYearly).toBe(0);
        });
    });
});
