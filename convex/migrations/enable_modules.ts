/**
 * Migration: Enable Stories and Reports modules for existing organizations
 * 
 * This migration enables the Stories and Reports modules for all existing organizations
 * to maintain backward compatibility.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Enable modules for all existing organizations
 */
export const enableModulesForAllOrgs = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all organizations
    const orgs = await ctx.db.query("organizations").collect();
    
    let enabledCount = 0;
    let skippedCount = 0;

    for (const org of orgs) {
      // Enable Stories module
      const storiesEnablement = await ctx.db
        .query("module_enablements")
        .withIndex("by_org_module", (q) => 
          q.eq("orgId", org._id).eq("moduleId", "stories")
        )
        .first();

      if (!storiesEnablement) {
        // Get the first org owner to set as enabledBy
        const owner = await ctx.db
          .query("memberships")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
          .first();

        if (owner) {
          await ctx.db.insert("module_enablements", {
            orgId: org._id,
            moduleId: "stories",
            enabled: true,
            enabledBy: owner.userId,
            enabledAt: Date.now(),
            updatedAt: Date.now(),
          });
          enabledCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }

      // Enable Reports module
      const reportsEnablement = await ctx.db
        .query("module_enablements")
        .withIndex("by_org_module", (q) => 
          q.eq("orgId", org._id).eq("moduleId", "reports")
        )
        .first();

      if (!reportsEnablement) {
        // Get the first org owner to set as enabledBy
        const owner = await ctx.db
          .query("memberships")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
          .first();

        if (owner) {
          await ctx.db.insert("module_enablements", {
            orgId: org._id,
            moduleId: "reports",
            enabled: true,
            enabledBy: owner.userId,
            enabledAt: Date.now(),
            updatedAt: Date.now(),
          });
          enabledCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    return {
      success: true,
      orgsProcessed: orgs.length,
      modulesEnabled: enabledCount,
      modulesSkipped: skippedCount,
    };
  },
});

/**
 * Enable modules for a specific organization
 */
export const enableModulesForOrg = internalMutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Get the first org owner to set as enabledBy
    const owner = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("role"), "ORG_OWNER"))
      .first();

    if (!owner) {
      throw new Error("No owner found for organization");
    }

    const enabled: string[] = [];

    // Enable Stories module
    const storiesEnablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) => 
        q.eq("orgId", args.orgId).eq("moduleId", "stories")
      )
      .first();

    if (!storiesEnablement) {
      await ctx.db.insert("module_enablements", {
        orgId: args.orgId,
        moduleId: "stories",
        enabled: true,
        enabledBy: owner.userId,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
      enabled.push("stories");
    }

    // Enable Reports module
    const reportsEnablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) => 
        q.eq("orgId", args.orgId).eq("moduleId", "reports")
      )
      .first();

    if (!reportsEnablement) {
      await ctx.db.insert("module_enablements", {
        orgId: args.orgId,
        moduleId: "reports",
        enabled: true,
        enabledBy: owner.userId,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
      enabled.push("reports");
    }

    return {
      success: true,
      orgId: args.orgId,
      enabledModules: enabled,
    };
  },
});

