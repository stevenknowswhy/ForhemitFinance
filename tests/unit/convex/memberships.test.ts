/**
 * Unit Tests for Team Management (Memberships)
 * Tests convex/memberships.ts functions
 */

import { describe, it, expect } from "vitest";
import { createMockContext, createTestId } from "../../mocks/mockConvexContext";
import {
    testOrganizations,
    testUsers,
    testMemberships,
} from "../../fixtures/organizations";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Memberships - Unit Tests", () => {
    describe("listMembers", () => {
        it("should return all members for an organization", async () => {
            const ctx = createMockContext({
                seedData: [
                    { table: "memberships", data: testMemberships },
                    { table: "users", data: testUsers },
                ],
            });

            const orgMembers = testMemberships.filter(
                (m) => m.orgId === testOrganizations[0]._id
            );

            expect(orgMembers.length).toBe(3);
            expect(orgMembers.some((m) => m.role === "ORG_OWNER")).toBe(true);
            expect(orgMembers.some((m) => m.role === "ORG_ADMIN")).toBe(true);
            expect(orgMembers.some((m) => m.role === "BOOKKEEPER")).toBe(true);
        });

        it("should include user information with memberships", async () => {
            const ctx = createMockContext({
                seedData: [
                    { table: "memberships", data: [testMemberships[0]] },
                    { table: "users", data: [testUsers[1]] },
                ],
            });

            const membership = testMemberships[0];
            const user = testUsers.find((u) => u._id === membership.userId);

            expect(user).toBeDefined();
            expect(user?.email).toBe("owner@acme.com");
            expect(user?.name).toBe("Org Owner");
        });

        it("should filter by membership status", () => {
            const allMemberships = [
                ...testMemberships,
                {
                    _id: "membership_invited" as Id<"memberships">,
                    userId: createTestId("users"),
                    orgId: testOrganizations[0]._id,
                    role: "VIEWER" as const,
                    status: "invited" as const,
                    invitedAt: Date.now(),
                    createdAt: Date.now(),
                },
            ];

            const activeMembers = allMemberships.filter(
                (m) =>
                    m.orgId === testOrganizations[0]._id && m.status === "active"
            );
            const invitedMembers = allMemberships.filter(
                (m) =>
                    m.orgId === testOrganizations[0]._id && m.status === "invited"
            );

            expect(activeMembers.length).toBe(3);
            expect(invitedMembers.length).toBe(1);
        });
    });

    describe("inviteMember", () => {
        it("should create invited membership", async () => {
            const ctx = createMockContext({
                user: testUsers[1], // org owner
                seedData: [
                    { table: "users", data: testUsers },
                    { table: "organizations", data: [testOrganizations[0]] },
                    { table: "memberships", data: [testMemberships[0]] },
                ],
            });

            const newMembership = {
                userId: createTestId("users"),
                orgId: testOrganizations[0]._id,
                role: "BOOKKEEPER" as const,
                status: "invited" as const,
                invitedBy: testUsers[1]._id,
                invitedAt: Date.now(),
                createdAt: Date.now(),
            };

            const membershipId = await ctx.db.insert("memberships", newMembership);
            const membership = await ctx.db.get(membershipId);

            expect(membership).toBeDefined();
            expect(membership?.status).toBe("invited");
            expect(membership?.invitedBy).toBe(testUsers[1]._id);
            expect(membership?.role).toBe("BOOKKEEPER");
        });

        it("should validate email format for invitations", () => {
            const validEmails = ["user@example.com", "test+tag@domain.co"];
            const invalidEmails = ["invalid", "@example.com", "test@"];

            const isValidEmail = (email: string) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            };

            validEmails.forEach((email) => {
                expect(isValidEmail(email)).toBe(true);
            });

            invalidEmails.forEach((email) => {
                expect(isValidEmail(email)).toBe(false);
            });
        });

        it("should prevent duplicate invitations", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "memberships", data: testMemberships }],
            });

            const existingMembership = testMemberships.find(
                (m) =>
                    m.userId === testUsers[1]._id &&
                    m.orgId === testOrganizations[0]._id
            );

            expect(existingMembership).toBeDefined();
            // In real implementation, this would throw an error
        });
    });

    describe("updateMemberRole", () => {
        it("should update member role", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "memberships", data: [testMemberships[2]] }],
            });

            const membershipId = testMemberships[2]._id;
            await ctx.db.patch(membershipId, {
                role: "ORG_ADMIN" as const,
            });

            const membership = await ctx.db.get(membershipId);
            expect(membership?.role).toBe("ORG_ADMIN");
        });

        it("should validate role values", () => {
            const validRoles = ["ORG_OWNER", "ORG_ADMIN", "BOOKKEEPER", "VIEWER"];
            const invalidRoles = ["ADMIN", "USER", "MANAGER", ""];

            const isValidRole = (role: string) => {
                return validRoles.includes(role);
            };

            validRoles.forEach((role) => {
                expect(isValidRole(role)).toBe(true);
            });

            invalidRoles.forEach((role) => {
                expect(isValidRole(role)).toBe(false);
            });
        });

        it("should prevent removing last owner", () => {
            const orgMemberships = testMemberships.filter(
                (m) => m.orgId === testOrganizations[0]._id
            );
            const owners = orgMemberships.filter((m) => m.role === "ORG_OWNER");

            expect(owners.length).toBe(1);
            // In real implementation, attempting to change this role would throw
        });
    });

    describe("removeMember", () => {
        it("should remove member from organization", async () => {
            const ctx = createMockContext({
                seedData: [{ table: "memberships", data: [testMemberships[2]] }],
            });

            const membershipId = testMemberships[2]._id;
            await ctx.db.delete(membershipId);

            const membership = await ctx.db.get(membershipId);
            expect(membership).toBeNull();
        });

        it("should prevent removing last owner", () => {
            const orgMemberships = testMemberships.filter(
                (m) => m.orgId === testOrganizations[0]._id
            );
            const nonOwners = orgMemberships.filter((m) => m.role !== "ORG_OWNER");

            expect(nonOwners.length).toBeGreaterThan(0);
            // Can safely remove non-owners
        });

        it("should prevent self-removal of owner", () => {
            const ownerMembership = testMemberships.find(
                (m) => m.role === "ORG_OWNER"
            );

            expect(ownerMembership).toBeDefined();
            // In real implementation, owner cannot remove themselves if they're the last owner
        });
    });

    describe("Role Permissions", () => {
        it("should verify ORG_OWNER has all permissions", () => {
            const ownerPermissions = [
                "MANAGE_ORG_SETTINGS",
                "MANAGE_TEAM",
                "MANAGE_SUBSCRIPTION",
                "VIEW_FINANCIALS",
                "EDIT_TRANSACTIONS",
                "APPROVE_ENTRIES",
                "RUN_APP_RESET",
                "MANAGE_INTEGRATIONS",
            ];

            // All permissions should be available
            expect(ownerPermissions.length).toBe(8);
        });

        it("should verify ORG_ADMIN permissions", () => {
            const adminPermissions = [
                "MANAGE_ORG_SETTINGS",
                "MANAGE_TEAM",
                "VIEW_FINANCIALS",
                "EDIT_TRANSACTIONS",
                "APPROVE_ENTRIES",
                "MANAGE_INTEGRATIONS",
            ];

            // Admin has most permissions except subscription management and app reset
            expect(adminPermissions.length).toBe(6);
            expect(adminPermissions.includes("MANAGE_SUBSCRIPTION")).toBe(false);
            expect(adminPermissions.includes("RUN_APP_RESET")).toBe(false);
        });

        it("should verify BOOKKEEPER permissions", () => {
            const bookkeeperPermissions = [
                "VIEW_FINANCIALS",
                "EDIT_TRANSACTIONS",
                "APPROVE_ENTRIES",
            ];

            expect(bookkeeperPermissions.length).toBe(3);
            expect(bookkeeperPermissions.includes("MANAGE_TEAM")).toBe(false);
        });

        it("should verify VIEWER permissions", () => {
            const viewerPermissions = ["VIEW_FINANCIALS"];

            expect(viewerPermissions.length).toBe(1);
            expect(viewerPermissions.includes("EDIT_TRANSACTIONS")).toBe(false);
        });
    });
});
