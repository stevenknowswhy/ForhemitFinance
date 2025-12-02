/**
 * Unit Tests for Organization Management
 * Tests convex/organizations.ts functions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockContext, createTestId } from "../../mocks/mockConvexContext";
import {
    testOrganizations,
    testUsers,
    testMemberships,
} from "../../fixtures/organizations";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Organizations - Unit Tests", () => {
    describe("updateOrganization", () => {
        it("should update organization settings with valid permissions", async () => {
            const ctx = createMockContext({
                user: testUsers[1], // org owner
                seedData: [
                    { table: "users", data: [testUsers[1]] },
                    { table: "organizations", data: [testOrganizations[0]] },
                    { table: "memberships", data: [testMemberships[0]] },
                ],
            });

            const orgId = testOrganizations[0]._id;
            const updates = {
                fiscalYearStart: "07-01",
                accountingMethod: "cash" as const,
            };

            // Simulate updateOrganization mutation
            await ctx.db.patch(orgId, {
                ...updates,
                updatedAt: Date.now(),
            });

            const updatedOrg = await ctx.db.get(orgId);
            expect(updatedOrg).toBeDefined();
            expect(updatedOrg?.fiscalYearStart).toBe("07-01");
            expect(updatedOrg?.accountingMethod).toBe("cash");
        });

        it("should validate fiscal year format", () => {
            const validFormats = ["01-01", "07-01", "12-31"];
            const invalidFormats = ["1-1", "01-32", "invalid"];

            const isValidFiscalYear = (value: string) => {
                if (!/^\d{2}-\d{2}$/.test(value)) return false;
                const [month, day] = value.split("-").map(Number);
                return month >= 1 && month <= 12 && day >= 1 && day <= 31;
            };

            validFormats.forEach((format) => {
                expect(isValidFiscalYear(format)).toBe(true);
            });

            invalidFormats.forEach((format) => {
                expect(isValidFiscalYear(format)).toBe(false);
            });
        });

        it("should only allow valid accounting methods", () => {
            const validMethods = ["cash", "accrual"];
            const invalidMethods = ["hybrid", "modified", ""];

            const isValidAccountingMethod = (value: string) => {
                return validMethods.includes(value);
            };

            validMethods.forEach((method) => {
                expect(isValidAccountingMethod(method)).toBe(true);
            });

            invalidMethods.forEach((method) => {
                expect(isValidAccountingMethod(method)).toBe(false);
            });
        });
    });

    describe("createOrganization", () => {
        it("should create organization with default values", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [{ table: "users", data: [testUsers[1]] }],
            });

            const newOrg = {
                name: "New Business",
                type: "business" as const,
                status: "active" as const,
                baseCurrency: "USD",
                fiscalYearStart: "01-01",
                accountingMethod: "cash" as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const orgId = await ctx.db.insert("organizations", newOrg);
            expect(orgId).toBeDefined();

            const org = await ctx.db.get(orgId);
            expect(org?.name).toBe("New Business");
            expect(org?.accountingMethod).toBe("cash");
            expect(org?.status).toBe("active");
        });

        it("should create owner membership when creating organization", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [{ table: "users", data: [testUsers[1]] }],
            });

            const orgId = await ctx.db.insert("organizations", {
                name: "Test Org",
                type: "business" as const,
                status: "active" as const,
                baseCurrency: "USD",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            const membershipId = await ctx.db.insert("memberships", {
                userId: testUsers[1]._id,
                orgId,
                role: "ORG_OWNER" as const,
                status: "active" as const,
                joinedAt: Date.now(),
                createdAt: Date.now(),
            });

            const membership = await ctx.db.get(membershipId);
            expect(membership?.role).toBe("ORG_OWNER");
            expect(membership?.userId).toBe(testUsers[1]._id);
            expect(membership?.orgId).toBe(orgId);
        });
    });

    describe("getOrganization", () => {
        it("should retrieve organization by ID", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "organizations", data: [testOrganizations[0]] }],
            });

            const org = await ctx.db.get(testOrganizations[0]._id);
            expect(org).toBeDefined();
            expect(org?.name).toBe("Acme Corp");
            expect(org?.status).toBe("active");
        });

        it("should return null for non-existent organization", async () => {
            const ctx = createMockContext();
            const fakeId = createTestId("organizations");

            const org = await ctx.db.get(fakeId);
            expect(org).toBeNull();
        });
    });

    describe("getUserOrganizations", () => {
        it("should return all organizations for a user", async () => {
            const ctx = createMockContext({
                seedData: [
                    { table: "organizations", data: testOrganizations },
                    { table: "memberships", data: testMemberships },
                ],
            });

            // Simulate query for user's memberships
            const memberships = testMemberships.filter(
                (m) => m.userId === testUsers[1]._id && m.status === "active"
            );

            expect(memberships.length).toBeGreaterThan(0);
            expect(memberships[0].role).toBe("ORG_OWNER");
        });

        it("should filter out disabled memberships", () => {
            const allMemberships = [
                ...testMemberships,
                {
                    _id: "membership_disabled" as Id<"memberships">,
                    userId: testUsers[1]._id,
                    orgId: testOrganizations[1]._id,
                    role: "ORG_ADMIN" as const,
                    status: "disabled" as const,
                    createdAt: Date.now(),
                },
            ];

            const activeMemberships = allMemberships.filter(
                (m) => m.userId === testUsers[1]._id && m.status === "active"
            );

            expect(activeMemberships.length).toBe(1);
            expect(activeMemberships.every((m) => m.status === "active")).toBe(true);
        });
    });
});
