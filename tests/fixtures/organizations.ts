/**
 * Test Fixtures for Organizations
 */

import type { Id } from "../../../convex/_generated/dataModel";

export const testOrganizations = [
    {
        _id: "org_active_1" as Id<"organizations">,
        name: "Acme Corp",
        type: "business" as const,
        status: "active" as const,
        baseCurrency: "USD",
        fiscalYearStart: "01-01",
        accountingMethod: "accrual" as const,
        createdAt: Date.now() - 86400000 * 30, // 30 days ago
        updatedAt: Date.now() - 86400000 * 5,
    },
    {
        _id: "org_trial_1" as Id<"organizations">,
        name: "Startup Inc",
        type: "business" as const,
        status: "trial" as const,
        baseCurrency: "USD",
        fiscalYearStart: "01-01",
        accountingMethod: "cash" as const,
        createdAt: Date.now() - 86400000 * 7, // 7 days ago
        updatedAt: Date.now() - 86400000 * 1,
    },
    {
        _id: "org_suspended_1" as Id<"organizations">,
        name: "Suspended Co",
        type: "business" as const,
        status: "suspended" as const,
        baseCurrency: "USD",
        createdAt: Date.now() - 86400000 * 60,
        updatedAt: Date.now() - 86400000 * 10,
    },
];

export const testUsers = [
    {
        _id: "user_super_admin" as Id<"users">,
        email: "admin@ezfinancial.com",
        name: "Super Admin",
        isSuperAdmin: true,
        subscriptionTier: "pro" as const,
        preferences: {
            defaultCurrency: "USD",
            aiInsightLevel: "high" as const,
            notificationsEnabled: true,
        },
        createdAt: Date.now() - 86400000 * 365,
    },
    {
        _id: "user_org_owner" as Id<"users">,
        email: "owner@acme.com",
        name: "Org Owner",
        subscriptionTier: "pro" as const,
        preferences: {
            defaultCurrency: "USD",
            aiInsightLevel: "medium" as const,
            notificationsEnabled: true,
        },
        createdAt: Date.now() - 86400000 * 30,
    },
    {
        _id: "user_org_admin" as Id<"users">,
        email: "admin@acme.com",
        name: "Org Admin",
        subscriptionTier: "light" as const,
        preferences: {
            defaultCurrency: "USD",
            aiInsightLevel: "medium" as const,
            notificationsEnabled: true,
        },
        createdAt: Date.now() - 86400000 * 20,
    },
    {
        _id: "user_bookkeeper" as Id<"users">,
        email: "bookkeeper@acme.com",
        name: "Bookkeeper",
        subscriptionTier: "solo" as const,
        preferences: {
            defaultCurrency: "USD",
            aiInsightLevel: "low" as const,
            notificationsEnabled: false,
        },
        createdAt: Date.now() - 86400000 * 15,
    },
];

export const testMemberships = [
    {
        _id: "membership_1" as Id<"memberships">,
        userId: "user_org_owner" as Id<"users">,
        orgId: "org_active_1" as Id<"organizations">,
        role: "ORG_OWNER" as const,
        status: "active" as const,
        joinedAt: Date.now() - 86400000 * 30,
        createdAt: Date.now() - 86400000 * 30,
    },
    {
        _id: "membership_2" as Id<"memberships">,
        userId: "user_org_admin" as Id<"users">,
        orgId: "org_active_1" as Id<"organizations">,
        role: "ORG_ADMIN" as const,
        status: "active" as const,
        joinedAt: Date.now() - 86400000 * 20,
        createdAt: Date.now() - 86400000 * 20,
    },
    {
        _id: "membership_3" as Id<"memberships">,
        userId: "user_bookkeeper" as Id<"users">,
        orgId: "org_active_1" as Id<"organizations">,
        role: "BOOKKEEPER" as const,
        status: "active" as const,
        joinedAt: Date.now() - 86400000 * 15,
        createdAt: Date.now() - 86400000 * 15,
    },
];

export const testBusinessProfiles = [
    {
        _id: "profile_1" as Id<"business_profiles">,
        userId: "user_org_owner" as Id<"users">,
        orgId: "org_active_1" as Id<"organizations">,
        legalBusinessName: "Acme Corporation",
        dbaTradeName: "Acme Corp",
        einTaxId: "12-3456789",
        entityType: "llc",
        filingState: "Delaware",
        businessEmail: "contact@acme.com",
        businessPhone: "+1-555-0100",
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 5,
    },
];

export const testPlans = [
    {
        _id: "plan_starter" as Id<"plans">,
        name: "starter",
        displayName: "Starter",
        limits: {
            maxUsers: 1,
            maxTransactions: 1000,
            features: ["basic_reports"],
        },
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
        createdAt: Date.now() - 86400000 * 365,
    },
    {
        _id: "plan_pro" as Id<"plans">,
        name: "pro",
        displayName: "Professional",
        limits: {
            maxUsers: 10,
            features: ["ai_stories", "advanced_reports", "team_management"],
        },
        priceMonthly: 49,
        priceYearly: 490,
        isActive: true,
        createdAt: Date.now() - 86400000 * 365,
    },
];

export const testSubscriptions = [
    {
        _id: "subscription_1" as Id<"subscriptions">,
        orgId: "org_active_1" as Id<"organizations">,
        planId: "plan_pro" as Id<"plans">,
        status: "active" as const,
        renewsAt: Date.now() + 86400000 * 30,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 5,
    },
    {
        _id: "subscription_2" as Id<"subscriptions">,
        orgId: "org_trial_1" as Id<"organizations">,
        planId: "plan_starter" as Id<"plans">,
        status: "trialing" as const,
        trialEndsAt: Date.now() + 86400000 * 7,
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000 * 1,
    },
];
