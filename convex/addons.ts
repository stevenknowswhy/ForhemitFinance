import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAllModuleManifests } from "./moduleManifests";

/**
 * Sync manifests to the addons table
 * This ensures the database is populated with available modules
 */
export const syncAddons = mutation({
  args: {},
  handler: async (ctx) => {
    const manifests = getAllModuleManifests();

    for (const manifest of manifests) {
      // Check if addon already exists by slug (using module ID as slug)
      const existing = await ctx.db
        .query("addons")
        .withIndex("by_slug", (q) => q.eq("slug", manifest.id))
        .first();

      const addonData = {
        slug: manifest.id,
        name: manifest.name,
        shortDescription: manifest.description,
        longDescription: manifest.description, // Use same for now
        category: (manifest.id === "stories" ? "stories" : manifest.id === "reports" ? "reports" : "bundle") as any,
        isFree: manifest.billing.type === "free",
        supportsTrial: manifest.billing.type === "paid", // Assume paid supports trial for now
        trialDurationDays: manifest.billing.type === "paid" ? 14 : undefined,
        version: manifest.version,
        status: "active" as const,
        uiPlacement: {
          section: "insights",
          label: manifest.name,
          icon: typeof manifest.icon === "string" ? manifest.icon : undefined,
        },
        updatedAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, addonData);
      } else {
        await ctx.db.insert("addons", {
          ...addonData,
          createdAt: Date.now(),
        });
      }
    }
    return "Synced " + manifests.length + " addons";
  },
});

export const enableFreeAddon = mutation({
  args: {
    orgId: v.string(),
    addonId: v.id("addons"),
  },
  handler: async (ctx, args) => {
    // 1. Verify addon is free
    const addon = await ctx.db.get(args.addonId);
    if (!addon) throw new Error("Addon not found");
    if (!addon.isFree) throw new Error("Addon is not free");

    // 2. Check/Create org_addons record (Entitlement)
    const existingEntitlement = await ctx.db
      .query("org_addons")
      .withIndex("by_org_addon", (q) =>
        q.eq("orgId", args.orgId as any).eq("addonId", args.addonId)
      )
      .first();

    if (!existingEntitlement) {
      await ctx.db.insert("org_addons", {
        orgId: args.orgId as any,
        addonId: args.addonId,
        status: "active",
        source: "free",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (existingEntitlement.status !== "active") {
      await ctx.db.patch(existingEntitlement._id, {
        status: "active",
        updatedAt: Date.now(),
      });
    }

    // 3. Enable the module (Functional switch)
    const existingEnablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId as any).eq("moduleId", addon.slug)
      )
      .first();

    if (existingEnablement) {
      await ctx.db.patch(existingEnablement._id, {
        enabled: true,
        updatedAt: Date.now(),
      });
    } else {
      // We need a userId for enabledBy, but we might not have it easily in this context if not authenticated
      // Assuming the caller is authenticated and we can get identity, or just use a system/placeholder if needed.
      // For now, let's try to get identity.
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthenticated");

      // We need to find the user ID from the identity
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user) throw new Error("User not found");

      await ctx.db.insert("module_enablements", {
        orgId: args.orgId as any,
        moduleId: addon.slug,
        enabled: true,
        enabledBy: user._id,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return "Enabled";
  },
});

export const toggleAddon = mutation({
  args: {
    orgId: v.string(),
    addonId: v.id("addons"),
  },
  handler: async (ctx, args) => {
    const addon = await ctx.db.get(args.addonId);
    if (!addon) throw new Error("Addon not found");

    const existingEnablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) =>
        q.eq("orgId", args.orgId as any).eq("moduleId", addon.slug)
      )
      .first();

    if (existingEnablement) {
      await ctx.db.patch(existingEnablement._id, {
        enabled: !existingEnablement.enabled,
        updatedAt: Date.now(),
      });
      return !existingEnablement.enabled;
    } else {
      // If no record, create as enabled (assuming toggle on)
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthenticated");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user) throw new Error("User not found");

      await ctx.db.insert("module_enablements", {
        orgId: args.orgId as any,
        moduleId: addon.slug,
        enabled: true,
        enabledBy: user._id,
        enabledAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  },
});

export const getAvailableAddons = query({
  args: {
    orgId: v.optional(v.string()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    sortBy: v.optional(v.string()), // "name", "price", "newest"
  },
  handler: async (ctx, args) => {
    let addons;

    // 1. Fetch addons (Search vs List)
    if (args.search) {
      addons = await ctx.db
        .query("addons")
        .withSearchIndex("search_name", (q) => {
          let query = q.search("name", args.search!);
          // Apply category filter if present
          if (args.category && args.category !== "all") {
            query = query.eq("category", args.category as any);
          }
          // Always filter by active status
          return query.eq("status", "active");
        })
        .collect();
    } else {
      // No search, just list
      let query = ctx.db.query("addons");

      if (args.category && args.category !== "all") {
        query = query.withIndex("by_category", (q) => q.eq("category", args.category as any));
      } else {
        query = query.withIndex("by_status", (q) => q.eq("status", "active"));
      }

      addons = await query.collect();

      // If we used category index, we still need to filter by status active
      if (args.category && args.category !== "all") {
        addons = addons.filter(a => a.status === "active");
      }
    }

    // 2. Sort (In-memory)
    // Note: Convex search returns by relevance, so we only sort if explicit sort requested OR no search
    if (args.sortBy) {
      addons.sort((a, b) => {
        switch (args.sortBy) {
          case "price":
            // Free first, then cheap to expensive
            if (a.isFree && !b.isFree) return -1;
            if (!a.isFree && b.isFree) return 1;
            return (a.priceAmount || 0) - (b.priceAmount || 0);
          case "newest":
            return b.createdAt - a.createdAt;
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
    } else if (!args.search) {
      // Default sort by name if not searching
      addons.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (!args.orgId) {
      // Return without entitlement info if no orgId
      return addons.map(addon => ({
        ...addon,
        entitlement: null,
        campaigns: [],
        isEnabled: false,
      }));
    }

    // Enrich with entitlement info
    const enrichedAddons = await Promise.all(
      addons.map(async (addon) => {
        // Get entitlement
        const entitlement = await ctx.db
          .query("org_addons")
          .withIndex("by_org_addon", (q) =>
            q.eq("orgId", args.orgId as any).eq("addonId", addon._id)
          )
          .first();

        // Get enablement status
        const enablement = await ctx.db
          .query("module_enablements")
          .withIndex("by_org_module", (q) =>
            q.eq("orgId", args.orgId as any).eq("moduleId", addon.slug)
          )
          .first();

        // Get active campaigns
        const campaigns = await ctx.db
          .query("pricing_campaigns")
          .withIndex("by_addon", (q) => q.eq("addonId", addon._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        return {
          ...addon,
          entitlement: entitlement ? {
            status: entitlement.status,
            source: entitlement.source,
            trialEnd: entitlement.trialEnd,
            purchasedAt: entitlement.purchasedAt,
            lastPaymentStatus: entitlement.lastPaymentStatus,
          } : null,
          campaigns,
          isEnabled: enablement ? enablement.enabled : false,
        };
      })
    );

    return enrichedAddons;
  },
});
