/**
 * Phase 1 Migration: Convert single-tenant to multi-tenant
 * 
 * This migration:
 * 1. Creates default plans (starter, pro, enterprise)
 * 2. Creates a default organization for each existing user
 * 3. Creates membership records (ORG_OWNER) for each user
 * 4. Migrates all userId-scoped data to orgId-scoped
 * 
 * Run this once after deploying Phase 1 schema changes
 */

import { internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create default plans (handler function)
 */
async function createDefaultPlansHandler(ctx: MutationCtx) {
  // Check if plans already exist
  const existingPlans = await ctx.db.query("plans").collect();
  if (existingPlans.length > 0) {
    console.log("Plans already exist, skipping creation");
    return { created: 0 };
  }

  const plans = [
    {
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
      createdAt: Date.now(),
    },
    {
      name: "pro",
      displayName: "Pro",
      limits: {
        maxUsers: 5,
        maxTransactions: 10000,
        features: ["basic_reports", "ai_stories", "advanced_reports"],
      },
      priceMonthly: 29,
      priceYearly: 290,
      isActive: true,
      createdAt: Date.now(),
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      limits: {
        maxUsers: undefined, // Unlimited
        maxTransactions: undefined, // Unlimited
        features: [
          "basic_reports",
          "ai_stories",
          "advanced_reports",
          "custom_integrations",
          "priority_support",
        ],
      },
      priceMonthly: 99,
      priceYearly: 990,
      isActive: true,
      createdAt: Date.now(),
    },
  ];

  const planIds: string[] = [];
  for (const plan of plans) {
    const planId = await ctx.db.insert("plans", plan);
    planIds.push(planId);
  }

  console.log(`Created ${planIds.length} default plans`);
  return { created: planIds.length, planIds };
}

/**
 * Create default plans (exported mutation)
 */
export const createDefaultPlans = internalMutation({
  args: {},
  handler: createDefaultPlansHandler,
});

/**
 * Migrate existing users to organizations (handler function)
 */
async function migrateUsersToOrgsHandler(ctx: MutationCtx) {
    // Get all existing users
    const users = await ctx.db.query("users").collect();
    console.log(`Found ${users.length} users to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if user already has an org
      const existingMembership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (existingMembership) {
        console.log(`User ${user._id} already has an org, skipping`);
        skipped++;
        continue;
      }

      // Determine plan based on subscription tier
      let planName = "starter";
      if (user.subscriptionTier === "light") {
        planName = "starter";
      } else if (user.subscriptionTier === "pro") {
        planName = "pro";
      }

      const plan = await ctx.db
        .query("plans")
        .filter((q) => q.eq(q.field("name"), planName))
        .first();

      if (!plan) {
        console.error(`Plan ${planName} not found, using starter`);
        const starterPlan = await ctx.db
          .query("plans")
          .filter((q) => q.eq(q.field("name"), "starter"))
          .first();
        if (!starterPlan) {
          throw new Error("Starter plan not found. Run createDefaultPlans first.");
        }
      }

      // Create organization
      const orgName = user.name
        ? `${user.name}'s Organization`
        : `${user.email}'s Organization`;

      const orgId = await ctx.db.insert("organizations", {
        name: orgName,
        type: "business", // Default to business
        status: "active",
        baseCurrency: user.preferences.defaultCurrency || "USD",
        fiscalYearStart: user.preferences.fiscalYearStart,
        createdAt: user.createdAt,
        updatedAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      // Create membership
      await ctx.db.insert("memberships", {
        userId: user._id,
        orgId,
        role: "ORG_OWNER",
        status: "active",
        joinedAt: user.createdAt,
        createdAt: user.createdAt,
      });

      // Create subscription
      if (plan) {
        await ctx.db.insert("subscriptions", {
          orgId,
          planId: plan._id,
          status: "active",
          createdAt: user.createdAt,
          updatedAt: Date.now(),
        });
      }

      // Update user status if not set
      if (!user.status) {
        await ctx.db.patch(user._id, {
          status: "active",
        });
      }

      migrated++;
      console.log(`Migrated user ${user._id} to org ${orgId}`);
    }

    return { migrated, skipped, total: users.length };
}

/**
 * Migrate existing users to organizations (exported mutation)
 */
export const migrateUsersToOrgs = internalMutation({
  args: {},
  handler: migrateUsersToOrgsHandler,
});

/**
 * Migrate data from userId to orgId (handler function)
 * This updates all financial tables to include orgId
 */
async function migrateDataToOrgScopedHandler(ctx: MutationCtx) {
    // Get all users with their orgs
    const memberships = await ctx.db.query("memberships").collect();
    const userOrgMap = new Map<string, string>();

    for (const membership of memberships) {
      if (membership.role === "ORG_OWNER" && membership.status === "active") {
        userOrgMap.set(membership.userId, membership.orgId);
      }
    }

    console.log(`Found ${userOrgMap.size} user-org mappings`);

    // Tables to migrate
    const tables = [
      "accounts",
      "transactions_raw",
      "entries_proposed",
      "entries_final",
      "receipts",
      "goals",
      "budgets",
      "ai_insights",
      "ai_stories",
      "business_profiles",
      "addresses",
      "professional_contacts",
      "categorization_knowledge",
      "institutions",
      "reset_events",
    ] as const;

    const results: Record<string, { updated: number; skipped: number }> = {};

    for (const tableName of tables) {
      let updated = 0;
      let skipped = 0;

      // Get all records for this table
      const records = await ctx.db.query(tableName).collect();

      for (const record of records) {
        // Skip if already has orgId
        if ("orgId" in record && record.orgId) {
          skipped++;
          continue;
        }

        // Get userId from record
        const userId = ("userId" in record ? record.userId : null) as
          | string
          | null
          | undefined;

        if (!userId) {
          skipped++;
          continue;
        }

        // Get orgId for this user
        const orgId = userOrgMap.get(userId);
        if (!orgId) {
          skipped++;
          continue;
        }

        // Update record with orgId
        await ctx.db.patch(record._id, {
          orgId: orgId as any,
        });

        updated++;
      }

      results[tableName] = { updated, skipped };
      console.log(
        `${tableName}: updated ${updated}, skipped ${skipped}`
      );
    }

    return results;
}

/**
 * Migrate data from userId to orgId (exported mutation)
 * This updates all financial tables to include orgId
 */
export const migrateDataToOrgScoped = internalMutation({
  args: {},
  handler: migrateDataToOrgScopedHandler,
});

/**
 * Run full migration
 * Call this after deploying Phase 1
 */
export const runPhase1Migration = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting Phase 1 migration...");

    // Step 1: Create default plans
    console.log("Step 1: Creating default plans...");
    const plansResult = await createDefaultPlansHandler(ctx);
    console.log("Plans result:", plansResult);

    // Step 2: Migrate users to orgs
    console.log("Step 2: Migrating users to organizations...");
    const usersResult = await migrateUsersToOrgsHandler(ctx);
    console.log("Users result:", usersResult);

    // Step 3: Migrate data to org-scoped
    console.log("Step 3: Migrating data to org-scoped...");
    const dataResult = await migrateDataToOrgScopedHandler(ctx);
    console.log("Data result:", dataResult);

    return {
      plans: plansResult,
      users: usersResult,
      data: dataResult,
    };
  },
});
