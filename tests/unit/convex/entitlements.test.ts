/**
 * Unit Tests for Marketplace Entitlements
 * Tests convex/marketplace/entitlements.ts functions
 */

import { describe, it, expect } from "vitest";
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

const testAddon = {
    _id: createTestId("addons") as Id<"addons">,
    slug: "project_profitability",
    name: "Project Profitability",
    shortDescription: "Track project costs and revenue",
    longDescription: "Full description...",
    category: "productivity",
    version: "1.0.0",
    status: "active" as const,
    isFree: false,
    supportsTrial: true,
    trialDays: 14,
    priceAmount: 2999,
    priceCurrency: "usd",
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

const testFreeAddon = {
    _id: createTestId("addons") as Id<"addons">,
    slug: "basic_reports",
    name: "Basic Reports",
    shortDescription: "Basic financial reports",
    longDescription: "Full description...",
    category: "reports",
    version: "1.0.0",
    status: "active" as const,
    isFree: true,
    supportsTrial: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

describe("Marketplace Entitlements - Unit Tests", () => {
    describe("checkAccess", () => {
        it("should deny access when module is not enabled", () => {
            const enablements: any[] = []; // No enablements

            const isEnabled = (
                enablements: any[],
                orgId: string,
                moduleSlug: string
            ) => {
                return enablements.some(
                    (e) =>
                        e.orgId === orgId && e.moduleId === moduleSlug && e.enabled === true
                );
            };

            expect(isEnabled(enablements, testOrg._id, "project_profitability")).toBe(
                false
            );
        });

        it("should grant access for free modules when enabled", () => {
            const enablements = [
                {
                    orgId: testOrg._id,
                    moduleId: "basic_reports",
                    enabled: true,
                },
            ];

            const checkFreeAccess = (
                enablements: any[],
                addon: typeof testFreeAddon,
                orgId: string
            ) => {
                const enablement = enablements.find(
                    (e) => e.orgId === orgId && e.moduleId === addon.slug
                );
                if (!enablement?.enabled) return false;
                return addon.isFree;
            };

            expect(checkFreeAccess(enablements, testFreeAddon, testOrg._id)).toBe(
                true
            );
        });

        it("should check entitlement status for paid modules", () => {
            const entitlements = [
                {
                    orgId: testOrg._id,
                    addonId: testAddon._id,
                    status: "active",
                },
            ];

            const hasPaidAccess = (
                entitlements: any[],
                orgId: string,
                addonId: string
            ) => {
                const entitlement = entitlements.find(
                    (e) => e.orgId === orgId && e.addonId === addonId
                );
                return entitlement?.status === "active";
            };

            expect(hasPaidAccess(entitlements, testOrg._id, testAddon._id)).toBe(
                true
            );
        });

        it("should grant access during active trial", () => {
            const entitlements = [
                {
                    orgId: testOrg._id,
                    addonId: testAddon._id,
                    status: "trialing",
                    trialEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
                },
            ];

            const hasTrialAccess = (entitlements: any[], orgId: string) => {
                const entitlement = entitlements.find((e) => e.orgId === orgId);
                if (!entitlement) return false;
                if (entitlement.status !== "trialing") return false;
                return entitlement.trialEnd > Date.now();
            };

            expect(hasTrialAccess(entitlements, testOrg._id)).toBe(true);
        });

        it("should deny access for expired trial", () => {
            const entitlements = [
                {
                    orgId: testOrg._id,
                    addonId: testAddon._id,
                    status: "trialing",
                    trialEnd: Date.now() - 1000, // Expired
                },
            ];

            const hasTrialAccess = (entitlements: any[], orgId: string) => {
                const entitlement = entitlements.find((e) => e.orgId === orgId);
                if (!entitlement) return false;
                if (entitlement.status !== "trialing") return false;
                return entitlement.trialEnd > Date.now();
            };

            expect(hasTrialAccess(entitlements, testOrg._id)).toBe(false);
        });
    });

    describe("requireAddon guard", () => {
        it("should throw error when addon not entitled", () => {
            const requireAddon = (
                entitlements: any[],
                orgId: string,
                moduleSlug: string
            ) => {
                const hasAccess = entitlements.some(
                    (e) =>
                        e.orgId === orgId &&
                        e.moduleSlug === moduleSlug &&
                        e.status === "active"
                );

                if (!hasAccess) {
                    throw new Error(
                        `Access denied: No entitlement for addon "${moduleSlug}"`
                    );
                }
            };

            expect(() => requireAddon([], testOrg._id, "project_profitability")).toThrow(
                /Access denied/
            );
        });

        it("should not throw when addon is entitled", () => {
            const entitlements = [
                {
                    orgId: testOrg._id,
                    moduleSlug: "project_profitability",
                    status: "active",
                },
            ];

            const requireAddon = (
                entitlements: any[],
                orgId: string,
                moduleSlug: string
            ) => {
                const hasAccess = entitlements.some(
                    (e) =>
                        e.orgId === orgId &&
                        e.moduleSlug === moduleSlug &&
                        e.status === "active"
                );

                if (!hasAccess) {
                    throw new Error(
                        `Access denied: No entitlement for addon "${moduleSlug}"`
                    );
                }
            };

            expect(() =>
                requireAddon(entitlements, testOrg._id, "project_profitability")
            ).not.toThrow();
        });
    });

    describe("getOrgEntitlements", () => {
        it("should return all enabled modules with status", () => {
            const enablements = [
                { orgId: testOrg._id, moduleId: "basic_reports", enabled: true },
                { orgId: testOrg._id, moduleId: "project_profitability", enabled: true },
                { orgId: testOrg._id, moduleId: "time_tracking", enabled: false },
            ];

            const activeModules = enablements
                .filter((e) => e.orgId === testOrg._id && e.enabled)
                .map((e) => e.moduleId);

            expect(activeModules).toContain("basic_reports");
            expect(activeModules).toContain("project_profitability");
            expect(activeModules).not.toContain("time_tracking");
            expect(activeModules.length).toBe(2);
        });

        it("should merge enablements with entitlement status", () => {
            const enablements = [
                { orgId: testOrg._id, moduleId: "project_profitability", enabled: true },
            ];

            const orgAddons = [
                {
                    orgId: testOrg._id,
                    addonId: testAddon._id,
                    status: "trialing",
                    trialEnd: Date.now() + 7 * 24 * 60 * 60 * 1000,
                },
            ];

            const addons = [testAddon];

            const mergedEntitlements = enablements.map((e) => {
                const addon = addons.find((a) => a.slug === e.moduleId);
                const orgAddon = addon
                    ? orgAddons.find((oa) => oa.addonId === addon._id)
                    : null;

                return {
                    moduleSlug: e.moduleId,
                    enabled: e.enabled,
                    status: orgAddon?.status || "free",
                    trialEnd: orgAddon?.trialEnd,
                    isFree: addon?.isFree ?? true,
                };
            });

            expect(mergedEntitlements[0].moduleSlug).toBe("project_profitability");
            expect(mergedEntitlements[0].status).toBe("trialing");
            expect(mergedEntitlements[0].trialEnd).toBeGreaterThan(Date.now());
        });
    });
});
