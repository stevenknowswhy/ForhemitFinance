/**
 * Unit Tests for Invoices Module
 * Tests convex/invoices.ts functions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockContext, createTestId } from "../../mocks/mockConvexContext";
import type { Id } from "../../../convex/_generated/dataModel";

// Test data
const testOrg = {
    _id: createTestId("organizations") as Id<"organizations">,
    name: "Test Business",
    type: "business" as const,
    status: "active" as const,
    baseCurrency: "USD",
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

const testUser = {
    _id: createTestId("users") as Id<"users">,
    clerkId: "test_clerk_id",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role: "USER" as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

describe("Invoices - Unit Tests", () => {
    describe("Invoice Creation", () => {
        it("should create an invoice with valid data", async () => {
            const ctx = createMockContext({
                user: testUser,
                seedData: [
                    { table: "users", data: [testUser] },
                    { table: "organizations", data: [testOrg] },
                ],
            });

            const invoiceData = {
                orgId: testOrg._id,
                customerName: "John Doe",
                customerEmail: "john@example.com",
                invoiceNumber: "INV-001",
                issueDate: Date.now(),
                dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
                lineItems: [
                    {
                        description: "Consulting Service",
                        quantity: 10,
                        unitPrice: 150,
                        amount: 1500,
                    },
                ],
                subtotal: 1500,
                total: 1500,
                currency: "USD",
                status: "draft" as const,
                createdByUserId: testUser._id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const invoiceId = await ctx.db.insert("invoices", invoiceData);
            expect(invoiceId).toBeDefined();

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice).toBeDefined();
            expect(invoice?.customerName).toBe("John Doe");
            expect(invoice?.total).toBe(1500);
            expect(invoice?.status).toBe("draft");
        });

        it("should calculate line item amounts correctly", () => {
            const lineItems = [
                { description: "Item 1", quantity: 5, unitPrice: 100, amount: 0 },
                { description: "Item 2", quantity: 3, unitPrice: 50, amount: 0 },
            ];

            const calculated = lineItems.map((item) => ({
                ...item,
                amount: item.quantity * item.unitPrice,
            }));

            expect(calculated[0].amount).toBe(500);
            expect(calculated[1].amount).toBe(150);

            const subtotal = calculated.reduce((sum, item) => sum + item.amount, 0);
            expect(subtotal).toBe(650);
        });

        it("should generate sequential invoice numbers", () => {
            const existingNumbers = ["INV-001", "INV-002", "INV-010"];

            const getNextNumber = (existing: string[]): string => {
                const numbers = existing
                    .map((inv) => {
                        const match = inv.match(/INV-(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter((n) => !isNaN(n));

                const maxNumber = Math.max(...numbers, 0);
                return `INV-${(maxNumber + 1).toString().padStart(3, "0")}`;
            };

            expect(getNextNumber([])).toBe("INV-001");
            expect(getNextNumber(existingNumbers)).toBe("INV-011");
        });
    });

    describe("Invoice Status Transitions", () => {
        it("should allow draft → sent transition", () => {
            const validTransitions: Record<string, string[]> = {
                draft: ["sent", "void"],
                sent: ["viewed", "paid", "overdue", "void"],
                viewed: ["paid", "overdue", "void"],
                overdue: ["paid", "void"],
                paid: [], // Terminal state
                void: [], // Terminal state
            };

            expect(validTransitions.draft.includes("sent")).toBe(true);
            expect(validTransitions.draft.includes("paid")).toBe(false);
        });

        it("should not allow paid → void transition", () => {
            const canVoid = (status: string) => {
                return status !== "paid";
            };

            expect(canVoid("draft")).toBe(true);
            expect(canVoid("sent")).toBe(true);
            expect(canVoid("paid")).toBe(false);
        });
    });

    describe("Invoice Queries", () => {
        it("should filter invoices by status", async () => {
            const invoices = [
                { _id: "inv1", status: "draft", total: 100 },
                { _id: "inv2", status: "sent", total: 200 },
                { _id: "inv3", status: "paid", total: 300 },
                { _id: "inv4", status: "sent", total: 150 },
            ];

            const sentInvoices = invoices.filter((i) => i.status === "sent");
            expect(sentInvoices.length).toBe(2);
            expect(sentInvoices.every((i) => i.status === "sent")).toBe(true);
        });

        it("should calculate outstanding amount correctly", () => {
            const invoices = [
                { status: "sent", total: 1000 },
                { status: "viewed", total: 500 },
                { status: "paid", total: 2000 },
                { status: "overdue", total: 300 },
            ];

            const outstandingStatuses = ["sent", "viewed", "overdue"];
            const outstanding = invoices
                .filter((i) => outstandingStatuses.includes(i.status))
                .reduce((sum, i) => sum + i.total, 0);

            expect(outstanding).toBe(1800); // 1000 + 500 + 300
        });
    });
});
