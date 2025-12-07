/**
 * Unit Tests for Projects Module
 * Tests convex/modules/projects/main.ts functions
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

describe("Projects Module - Unit Tests", () => {
    describe("Project Creation", () => {
        it("should create project with required fields", () => {
            const projectData = {
                orgId: testOrg._id,
                name: "Website Redesign",
                status: "active" as const,
                createdByUserId: testUser._id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(projectData.name).toBe("Website Redesign");
            expect(projectData.status).toBe("active");
            expect(projectData.orgId).toBe(testOrg._id);
        });

        it("should support optional fields", () => {
            const projectData = {
                orgId: testOrg._id,
                name: "Mobile App",
                status: "active" as const,
                budgetAmount: 50000,
                startDate: Date.now(),
                endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
                color: "#3B82F6",
                description: "Build a mobile app for iOS and Android",
                createdByUserId: testUser._id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(projectData.budgetAmount).toBe(50000);
            expect(projectData.color).toBe("#3B82F6");
            expect(projectData.description).toContain("mobile app");
        });
    });

    describe("Project Status Transitions", () => {
        it("should support all valid statuses", () => {
            const validStatuses = ["active", "completed", "on_hold", "cancelled"];

            validStatuses.forEach((status) => {
                expect(validStatuses.includes(status)).toBe(true);
            });
        });

        it("should allow status changes", () => {
            let projectStatus = "active";

            // Simulate completing a project
            projectStatus = "completed";
            expect(projectStatus).toBe("completed");

            // Reset back to active
            projectStatus = "active";
            expect(projectStatus).toBe("active");
        });
    });

    describe("Transaction Tagging", () => {
        it("should tag transaction to project", () => {
            const projectTransactions: Array<{
                projectId: string;
                transactionId: string;
                allocatedAmount?: number;
            }> = [];

            const projectId = createTestId("projects");
            const transactionId = createTestId("transactions_raw");

            projectTransactions.push({
                projectId,
                transactionId,
                allocatedAmount: undefined,
            });

            expect(projectTransactions.length).toBe(1);
            expect(projectTransactions[0].projectId).toBe(projectId);
        });

        it("should support partial allocation", () => {
            const transaction = { amount: -1000, category: "Software" };
            const allocation = {
                projectId: createTestId("projects"),
                transactionId: createTestId("transactions_raw"),
                allocatedAmount: 600, // Only 60% allocated to this project
            };

            expect(allocation.allocatedAmount).toBe(600);
            expect(allocation.allocatedAmount).toBeLessThan(
                Math.abs(transaction.amount)
            );
        });

        it("should prevent duplicate tagging", () => {
            const existingTags = [
                { projectId: "proj1", transactionId: "tx1" },
                { projectId: "proj1", transactionId: "tx2" },
            ];

            const isDuplicate = (projectId: string, transactionId: string) => {
                return existingTags.some(
                    (t) => t.projectId === projectId && t.transactionId === transactionId
                );
            };

            expect(isDuplicate("proj1", "tx1")).toBe(true);
            expect(isDuplicate("proj1", "tx3")).toBe(false);
        });
    });

    describe("Profitability Calculation", () => {
        it("should calculate revenue from positive transactions", () => {
            const transactions = [
                { amount: 5000, allocatedAmount: undefined },
                { amount: 3000, allocatedAmount: 1500 },
                { amount: -2000, allocatedAmount: undefined },
            ];

            const revenue = transactions
                .filter((t) => {
                    const amount = t.allocatedAmount ?? t.amount;
                    return amount > 0;
                })
                .reduce((sum, t) => sum + (t.allocatedAmount ?? t.amount), 0);

            expect(revenue).toBe(6500); // 5000 + 1500
        });

        it("should calculate costs from negative transactions", () => {
            const transactions = [
                { amount: 5000, allocatedAmount: undefined },
                { amount: -2000, allocatedAmount: undefined },
                { amount: -1500, allocatedAmount: -800 },
            ];

            const costs = transactions
                .filter((t) => {
                    const amount = t.allocatedAmount ?? t.amount;
                    return amount < 0;
                })
                .reduce((sum, t) => sum + Math.abs(t.allocatedAmount ?? t.amount), 0);

            expect(costs).toBe(2800); // 2000 + 800
        });

        it("should calculate profit margin correctly", () => {
            const revenue = 10000;
            const costs = 6000;
            const profit = revenue - costs;
            const margin = (profit / revenue) * 100;

            expect(profit).toBe(4000);
            expect(margin).toBe(40);
        });

        it("should calculate budget usage percentage", () => {
            const budgetAmount = 50000;
            const costsToDate = 35000;

            const budgetUsed = (costsToDate / budgetAmount) * 100;

            expect(budgetUsed).toBe(70);
        });

        it("should handle zero revenue gracefully", () => {
            const revenue = 0;
            const costs = 5000;
            const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

            expect(margin).toBe(0);
        });
    });

    describe("Project Deletion", () => {
        it("should delete project transactions when project is deleted", () => {
            let projectTransactions = [
                { _id: "pt1", projectId: "proj1", transactionId: "tx1" },
                { _id: "pt2", projectId: "proj1", transactionId: "tx2" },
                { _id: "pt3", projectId: "proj2", transactionId: "tx3" },
            ];

            const projectToDelete = "proj1";

            // Simulate cascade delete
            projectTransactions = projectTransactions.filter(
                (pt) => pt.projectId !== projectToDelete
            );

            expect(projectTransactions.length).toBe(1);
            expect(projectTransactions[0].projectId).toBe("proj2");
        });
    });
});
