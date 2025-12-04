/**
 * Module Management System
 * Handles module enablement, entitlements, and access checks
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requirePermission } from "./rbac";
import { getOrgContext } from "./helpers/orgContext";
import { planIncludesModule, isModulePaid, getModulesToEnableOnUpgrade, getModulesToDisableOnDowngrade } from "./moduleEntitlements";
import { api } from "./_generated/api";
import { getAllModuleManifests } from "./moduleManifests";

/**
 * Get a module manifest by ID (for use in Convex)
 */
function getModuleManifest(moduleId: string) {
  const allManifests = getAllModuleManifests();
  return allManifests.find(m => m.id === moduleId);
}

/**
 * Get all enabled modules for an organization
 */
export const getEnabledModules = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is member of org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
      .first();

    if (!membership) throw new Error("Not a member of this organization");

    // Get all enablements for this org
    const enablements = await ctx.db
      .query("module_enablements")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return enablements.map(e => ({
      moduleId: e.moduleId,
      enabled: e.enabled,
      enabledBy: e.enabledBy,
      enabledAt: e.enabledAt,
      userOverrides: e.userOverrides,
      metadata: e.metadata,
    }));
  },
});

/**
 * Get all modules with their enablement status for an organization
 * Returns all registered modules with their current enablement and entitlement status
 */
export const getOrgModuleStatus = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is member of org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
      .first();

    if (!membership) throw new Error("Not a member of this organization");

    // Get all registered modules
    const allRegisteredModules = getAllModuleManifests();

    // Get all enablements for this org
    const enablements = await ctx.db
      .query("module_enablements")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get subscription to check entitlements
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
    const plan = subscription ? await ctx.db.get(subscription.planId) : null;
    const tier = plan?.name as "solo" | "light" | "pro" | undefined;

    // Get all entitlements
    const entitlements = await ctx.db
      .query("module_entitlements")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Log any dangling enablements (enablements for modules not in manifest list)
    // This helps debug misconfigurations
    const registeredModuleIds = new Set(allRegisteredModules.map(m => m.id));
    const danglingEnablements = enablements.filter(e =>
      e.enabled && !registeredModuleIds.has(e.moduleId)
    );
    if (danglingEnablements.length > 0 && process.env.NODE_ENV === "development") {
      console.warn(
        `Found ${danglingEnablements.length} enabled module(s) without manifests:`,
        danglingEnablements.map(e => e.moduleId).join(", ")
      );
    }

    return allRegisteredModules.map((manifest) => {
      const enablement = enablements.find((e) => e.moduleId === manifest.id);
      const isOrgEnabled = enablement?.enabled ?? false;

      // Check user-level override
      const userOverride = enablement?.userOverrides?.find(
        (override) => override.userId === user._id
      );
      // If user has an explicit override, use it; otherwise default to org setting
      const isUserEnabled = userOverride !== undefined
        ? userOverride.enabled
        : isOrgEnabled;

      // Check entitlement based on plan
      // Default to true for free modules or when billing info is missing
      let hasEntitlement = true;
      if (manifest.billing) {
        if (manifest.billing.type === "included" && tier) {
          const requiredTier = manifest.billing.requiredTier;
          const tierOrder = { solo: 0, light: 1, pro: 2 };
          hasEntitlement = tierOrder[tier] >= tierOrder[requiredTier];
        } else if (manifest.billing.type === "paid") {
          const entitlement = entitlements.find((e) => e.moduleId === manifest.id);
          hasEntitlement = entitlement?.status === "active" || entitlement?.status === "trial";
        } else if (manifest.billing.type === "free") {
          // Free modules always have entitlement
          hasEntitlement = true;
        }
      }

      return {
        manifest: {
          id: manifest.id,
          version: manifest.version,
          name: manifest.name,
          description: manifest.description,
          icon: manifest.icon || "DefaultIcon",
          category: manifest.category,
          billing: manifest.billing,
          permissions: manifest.permissions,
          routes: manifest.routes,
          navigation: manifest.navigation,
          insightsNavigation: manifest.insightsNavigation,
          featureFlags: manifest.featureFlags,
          metadata: manifest.metadata,
        },
        isOrgEnabled,
        isUserEnabled,
        hasEntitlement,
        userOverride: userOverride?.enabled,
      };
    });
  },
});

/**
 * Get module enablement status for a specific module
 */
export const getModuleEnablement = query({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is member of org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
      .first();

    if (!membership) throw new Error("Not a member of this organization");

    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!enablement) {
      return null;
    }

    return {
      moduleId: enablement.moduleId,
      enabled: enablement.enabled,
      enabledBy: enablement.enabledBy,
      enabledAt: enablement.enabledAt,
      userOverrides: enablement.userOverrides,
      metadata: enablement.metadata,
    };
  },
});

/**
 * Check if user has access to a module (with user-level overrides)
 */
export const checkModuleAccess = query({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const checkUserId = args.userId || user._id;

    // Get module enablement
    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!enablement || !enablement.enabled) {
      return {
        hasAccess: false,
        reason: enablement ? "Module is disabled" : "Module not enabled for organization",
      };
    }

    // Check user-level override
    if (enablement.userOverrides) {
      const userOverride = enablement.userOverrides.find(uo => uo.userId === checkUserId);
      if (userOverride && !userOverride.enabled) {
        return {
          hasAccess: false,
          reason: "Module hidden by user preference",
        };
      }
    }

    return {
      hasAccess: true,
    };
  },
});

/**
 * Enable a module for an organization
 * Checks subscription plan requirements for paid modules
 */
export const enableModule = mutation({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId } = await getOrgContext(ctx, args.orgId);

    // Require MANAGE_MODULES permission
    await requirePermission(ctx, userId, args.orgId, "MANAGE_MODULES");

    // Validate that the module has a known manifest before enabling
    const manifest = getModuleManifest(args.moduleId);
    if (!manifest) {
      throw new Error(`Unknown module: ${args.moduleId}. Module must be registered in the system before it can be enabled.`);
    }

    // Check if module requires paid subscription
    // First check the manifest to see if it's actually a free module
    const isFreeModule = manifest.billing?.type === "free";

    // Only check subscription if module is not free
    if (!isFreeModule && isModulePaid(args.moduleId)) {
      // Get organization's subscription
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .first();

      if (!subscription) {
        throw new Error("Subscription required for this module");
      }

      if (!subscription.planId) {
        throw new Error("Subscription plan not configured");
      }

      const plan = await ctx.db.get(subscription.planId);
      if (!plan) {
        throw new Error("Plan not found");
      }

      // Map plan name to tier (assuming plan names match tiers)
      const tier = plan.name as "solo" | "light" | "pro";

      // Check if plan includes this module
      if (!planIncludesModule(tier, args.moduleId)) {
        throw new Error(`This module requires a ${args.moduleId === "stories" ? "Light" : "Pro"} plan or higher`);
      }

      // Create or update entitlement
      const existingEntitlement = await ctx.db
        .query("module_entitlements")
        .withIndex("by_org_module", (q) =>
          q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
        )
        .first();

      if (existingEntitlement) {
        await ctx.db.patch(existingEntitlement._id, {
          planId: subscription.planId,
          status: subscription.status === "trialing" ? "trial" : "active",
          trialEndsAt: subscription.trialEndsAt,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("module_entitlements", {
          orgId: args.orgId,
          moduleId: args.moduleId,
          planId: subscription.planId,
          status: subscription.status === "trialing" ? "trial" : "active",
          trialEndsAt: subscription.trialEndsAt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Check if enablement already exists
    const existing = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (existing) {
      // Update existing enablement
      await ctx.db.patch(existing._id, {
        enabled: true,
        enabledBy: userId,
        enabledAt: Date.now(),
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new enablement
      const enablementId = await ctx.db.insert("module_enablements", {
        orgId: args.orgId,
        moduleId: args.moduleId,
        enabled: true,
        enabledBy: userId,
        enabledAt: Date.now(),
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
      return enablementId;
    }
  },
});

/**
 * Disable a module for an organization
 */
export const disableModule = mutation({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getOrgContext(ctx, args.orgId);

    // Require MANAGE_MODULES permission
    await requirePermission(ctx, userId, args.orgId, "MANAGE_MODULES");

    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!enablement) {
      throw new Error("Module enablement not found");
    }

    await ctx.db.patch(enablement._id, {
      enabled: false,
      updatedAt: Date.now(),
    });

    return enablement._id;
  },
});

/**
 * Get module entitlement (for paid modules)
 */
export const getModuleEntitlement = query({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is member of org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
      .first();

    if (!membership) throw new Error("Not a member of this organization");

    const entitlement = await ctx.db
      .query("module_entitlements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!entitlement) {
      return null;
    }

    return {
      moduleId: entitlement.moduleId,
      planId: entitlement.planId,
      status: entitlement.status,
      trialEndsAt: entitlement.trialEndsAt,
      expiresAt: entitlement.expiresAt,
    };
  },
});

/**
 * Set user-level override for module visibility
 */
export const setUserModuleOverride = mutation({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
    userId: v.id("users"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Users can only set their own overrides
    if (user._id !== args.userId) {
      throw new Error("Cannot set override for another user");
    }

    // Get or create enablement
    let enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!enablement) {
      throw new Error("Module must be enabled at org level first");
    }

    // Update user overrides
    const userOverrides = enablement.userOverrides || [];
    const existingIndex = userOverrides.findIndex(uo => uo.userId === args.userId);

    if (existingIndex >= 0) {
      userOverrides[existingIndex] = {
        userId: args.userId,
        enabled: args.enabled,
      };
    } else {
      userOverrides.push({
        userId: args.userId,
        enabled: args.enabled,
      });
    }

    await ctx.db.patch(enablement._id, {
      userOverrides,
      updatedAt: Date.now(),
    });

    return enablement._id;
  },
});

/**
 * Check if org has access to a module based on subscription
 * This checks both enablement and entitlements
 */
export const checkModuleEntitlement = query({
  args: {
    orgId: v.id("organizations"),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check enablement
    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!enablement || !enablement.enabled) {
      return {
        hasAccess: false,
        reason: "Module not enabled",
        requiresUpgrade: false,
      };
    }

    // Check entitlement (for paid modules)
    const entitlement = await ctx.db
      .query("module_entitlements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", args.moduleId)
      )
      .first();

    if (entitlement) {
      const now = Date.now();
      if (entitlement.status === "active") {
        // Check if expired
        if (entitlement.expiresAt && entitlement.expiresAt < now) {
          return {
            hasAccess: false,
            reason: "Module entitlement expired",
            requiresUpgrade: true,
          };
        }
        return {
          hasAccess: true,
        };
      } else if (entitlement.status === "trial") {
        // Check if trial expired
        if (entitlement.trialEndsAt && entitlement.trialEndsAt < now) {
          return {
            hasAccess: false,
            reason: "Trial expired",
            requiresUpgrade: true,
          };
        }
        return {
          hasAccess: true,
        };
      } else {
        return {
          hasAccess: false,
          reason: `Module entitlement ${entitlement.status}`,
          requiresUpgrade: entitlement.status === "expired" || entitlement.status === "cancelled",
        };
      }
    }

    // No entitlement required (free module)
    return {
      hasAccess: true,
    };
  },
});

/**
 * Sync module entitlements handler (shared logic)
 */
async function syncModuleEntitlementsHandler(ctx: any, args: {
  orgId: Id<"organizations">;
  oldTier?: "solo" | "light" | "pro";
  newTier: "solo" | "light" | "pro";
  planId: Id<"plans">;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  trialEndsAt?: number;
}) {
  // Get org owner for enablement tracking
  const owner = await ctx.db
    .query("memberships")
    .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
    .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
    .first();

  if (!owner) {
    console.warn(`No owner found for org ${args.orgId}`);
    return;
  }

  const oldTier = args.oldTier || "solo";

  // Get modules to enable on upgrade
  const modulesToEnable = getModulesToEnableOnUpgrade(oldTier, args.newTier);
  for (const moduleId of modulesToEnable) {
    // Check if enablement exists
    let enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", moduleId)
      )
      .first();

    if (!enablement) {
      // Create enablement
      await ctx.db.insert("module_enablements", {
        orgId: args.orgId,
        moduleId,
        enabled: true,
        enabledBy: owner.userId,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (!enablement.enabled) {
      // Re-enable
      await ctx.db.patch(enablement._id, {
        enabled: true,
        enabledBy: owner.userId,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create or update entitlement for paid modules
    if (isModulePaid(moduleId)) {
      const existingEntitlement = await ctx.db
        .query("module_entitlements")
        .withIndex("by_org_module", (q) =>
          q.eq("orgId", args.orgId).eq("moduleId", moduleId)
        )
        .first();

      if (existingEntitlement) {
        await ctx.db.patch(existingEntitlement._id, {
          planId: args.planId,
          status: args.subscriptionStatus === "trialing" ? "trial" : "active",
          trialEndsAt: args.trialEndsAt,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("module_entitlements", {
          orgId: args.orgId,
          moduleId,
          planId: args.planId,
          status: args.subscriptionStatus === "trialing" ? "trial" : "active",
          trialEndsAt: args.trialEndsAt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }

  // Get modules to disable on downgrade
  const modulesToDisable = getModulesToDisableOnDowngrade(oldTier, args.newTier);
  for (const moduleId of modulesToDisable) {
    // Disable enablement (but don't delete - data remains)
    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", moduleId)
      )
      .first();

    if (enablement && enablement.enabled) {
      await ctx.db.patch(enablement._id, {
        enabled: false,
        updatedAt: Date.now(),
      });
    }

    // Update entitlement status
    const entitlement = await ctx.db
      .query("module_entitlements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId).eq("moduleId", moduleId)
      )
      .first();

    if (entitlement) {
      await ctx.db.patch(entitlement._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }
  }
}

/**
 * Sync module entitlements when subscription changes
 * This is called internally when subscription is updated
 */
export const syncModuleEntitlements = internalMutation({
  args: {
    orgId: v.id("organizations"),
    oldTier: v.optional(v.union(v.literal("solo"), v.literal("light"), v.literal("pro"))),
    newTier: v.union(v.literal("solo"), v.literal("light"), v.literal("pro")),
    planId: v.id("plans"),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("suspended")
    ),
    trialEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await syncModuleEntitlementsHandler(ctx, args);
  },
});
