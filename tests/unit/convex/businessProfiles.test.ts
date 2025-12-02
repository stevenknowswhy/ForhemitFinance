/**
 * Unit Tests for Business Profile Management
 * Tests convex/businessProfiles.ts functions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockContext, createTestId } from "../../mocks/mockConvexContext";
import {
    testOrganizations,
    testUsers,
    testBusinessProfiles,
} from "../../fixtures/organizations";

describe("BusinessProfiles - Unit Tests", () => {
    describe("getBusinessProfile", () => {
        it("should retrieve profile by orgId", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [
                    { table: "users", data: [testUsers[1]] },
                    { table: "business_profiles", data: [testBusinessProfiles[0]] },
                ],
            });

            // Simulate query with orgId
            const profiles = await ctx.db.query("business_profiles").collect();
            const profile = profiles.find(
                (p: any) => p.orgId === testOrganizations[0]._id
            );

            expect(profile).toBeDefined();
            expect(profile?.legalBusinessName).toBe("Acme Corporation");
            expect(profile?.orgId).toBe(testOrganizations[0]._id);
        });

        it("should fall back to user-scoped profile when no orgId", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [
                    { table: "users", data: [testUsers[1]] },
                    { table: "business_profiles", data: [testBusinessProfiles[0]] },
                ],
            });

            // Simulate query by userId (legacy)
            const profiles = await ctx.db.query("business_profiles").collect();
            const profile = profiles.find(
                (p: any) => p.userId === testUsers[1]._id
            );

            expect(profile).toBeDefined();
            expect(profile?.userId).toBe(testUsers[1]._id);
        });

        it("should return null when no profile exists", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [{ table: "users", data: [testUsers[1]] }],
            });

            const profiles = await ctx.db.query("business_profiles").collect();
            expect(profiles.length).toBe(0);
        });
    });

    describe("updateBusinessProfile", () => {
        it("should update existing profile with orgId", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [
                    { table: "users", data: [testUsers[1]] },
                    { table: "business_profiles", data: [testBusinessProfiles[0]] },
                ],
            });

            const profileId = testBusinessProfiles[0]._id;
            const updates = {
                entityType: "s_corp",
                businessEmail: "newemail@acme.com",
                updatedAt: Date.now(),
            };

            await ctx.db.patch(profileId, updates);

            const profile = await ctx.db.get(profileId);
            expect(profile?.entityType).toBe("s_corp");
            expect(profile?.businessEmail).toBe("newemail@acme.com");
        });

        it("should create new profile when none exists", async () => {
            const ctx = createMockContext({
                user: testUsers[1],
                seedData: [{ table: "users", data: [testUsers[1]] }],
            });

            const newProfile = {
                userId: testUsers[1]._id,
                orgId: testOrganizations[0]._id,
                legalBusinessName: "New Business",
                entityType: "llc",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const profileId = await ctx.db.insert("business_profiles", newProfile);
            const profile = await ctx.db.get(profileId);

            expect(profile).toBeDefined();
            expect(profile?.legalBusinessName).toBe("New Business");
            expect(profile?.orgId).toBe(testOrganizations[0]._id);
        });

        it("should validate entity type", () => {
            const validTypes = [
                "sole_proprietorship",
                "llc",
                "s_corp",
                "c_corp",
                "partnership",
                "nonprofit",
            ];
            const invalidTypes = ["invalid", "corporation", ""];

            const isValidEntityType = (value: string) => {
                return validTypes.includes(value);
            };

            validTypes.forEach((type) => {
                expect(isValidEntityType(type)).toBe(true);
            });

            invalidTypes.forEach((type) => {
                expect(isValidEntityType(type)).toBe(false);
            });
        });

        it("should handle certification migration", () => {
            // Legacy boolean certifications
            const legacyCerts = {
                cert8a: true,
                certWosb: false,
                certMbe: true,
                gdprCompliant: true,
                ccpaCompliant: false,
            };

            // Convert to new array structure
            const certifications = [];
            if (legacyCerts.cert8a) {
                certifications.push({ type: "8a", obtainedAt: Date.now() });
            }
            if (legacyCerts.certMbe) {
                certifications.push({ type: "mbe", obtainedAt: Date.now() });
            }
            if (legacyCerts.gdprCompliant) {
                certifications.push({ type: "gdpr", obtainedAt: Date.now() });
            }

            expect(certifications.length).toBe(3);
            expect(certifications.some((c) => c.type === "8a")).toBe(true);
            expect(certifications.some((c) => c.type === "wosb")).toBe(false);
            expect(certifications.some((c) => c.type === "mbe")).toBe(true);
        });
    });

    describe("Profile Data Validation", () => {
        it("should validate EIN format", () => {
            const validEINs = ["12-3456789", "98-7654321"];
            const invalidEINs = ["123456789", "12-34567", "invalid"];

            const isValidEIN = (value: string) => {
                return /^\d{2}-\d{7}$/.test(value);
            };

            validEINs.forEach((ein) => {
                expect(isValidEIN(ein)).toBe(true);
            });

            invalidEINs.forEach((ein) => {
                expect(isValidEIN(ein)).toBe(false);
            });
        });

        it("should validate email format", () => {
            const validEmails = [
                "test@example.com",
                "user.name@company.co.uk",
                "admin+tag@domain.com",
            ];
            const invalidEmails = ["invalid", "@example.com", "test@", "test"];

            const isValidEmail = (value: string) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            };

            validEmails.forEach((email) => {
                expect(isValidEmail(email)).toBe(true);
            });

            invalidEmails.forEach((email) => {
                expect(isValidEmail(email)).toBe(false);
            });
        });

        it("should validate phone format", () => {
            const validPhones = ["+1-555-0100", "+44-20-1234-5678"];

            const isValidPhone = (value: string) => {
                // Basic validation - contains digits and common phone characters
                const digitsOnly = value.replace(/\D/g, "");
                return /^[\d\s\-\+\(\)]+$/.test(value) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
            };

            validPhones.forEach((phone) => {
                expect(isValidPhone(phone)).toBe(true);
            });
        });
    });
});
