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
        isFree: true, // All current modules are free
        supportsTrial: false, // Free modules don't need trials
        trialDurationDays: undefined,
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

export const startAddonTrial = mutation({
  args: {
    orgId: v.string(),
    addonId: v.id("addons"),
  },
  handler: async (ctx, args) => {
    // 1. Verify addon
    const addon = await ctx.db.get(args.addonId);
    if (!addon) throw new Error("Addon not found");

    // 2. Check existing entitlement
    const existingEntitlement = await ctx.db
      .query("org_addons")
      .withIndex("by_org_addon", (q) =>
        q.eq("orgId", args.orgId as any).eq("addonId", args.addonId)
      )
      .first();

    const trialDays = addon.trialDurationDays || 14;
    const trialEnd = Date.now() + trialDays * 24 * 60 * 60 * 1000;

    if (existingEntitlement) {
      // Update existing
      await ctx.db.patch(existingEntitlement._id, {
        status: "trialing",
        source: "trial",
        trialEnd,
        updatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("org_addons", {
        orgId: args.orgId as any,
        addonId: args.addonId,
        status: "trialing",
        source: "trial",
        trialEnd,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // 3. Enable the module
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
      const identity = await ctx.auth.getUserIdentity();
      // If system call, might not have identity. For now require it or skip enabledBy
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();

        if (user) {
          await ctx.db.insert("module_enablements", {
            orgId: args.orgId as any,
            moduleId: addon.slug,
            enabled: true,
            enabledBy: user._id,
            enabledAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    return "Trial started";
  },
});

export const declineOnboardingOffer = mutation({
  args: {
    orgId: v.optional(v.string()), // Optional as user might not have org yet?
    offerId: v.optional(v.string()),
  },
  handler: async () => {
    // No-op for now, just to satisfy the API check
    return true;
  },
});

export const declinePreTrialOffer = mutation({
  args: {
    orgId: v.optional(v.string()),
    offerId: v.optional(v.string()),
  },
  handler: async () => {
    // No-op for now
    return true;
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
  handler: async (ctx, args): Promise<any> => {
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
      if (args.category && args.category !== "all") {
        addons = await ctx.db.query("addons").withIndex("by_category", (q) => q.eq("category", args.category as any)).collect();
      } else {
        addons = await ctx.db.query("addons").withIndex("by_status", (q) => q.eq("status", "active")).collect();
      }

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
      })) as any;
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

    return enrichedAddons as any;
  },
});

/**
 * Activate an add-on purchase after successful payment
 */
export const activateAddonPurchase = mutation({
  args: {
    orgId: v.string(),
    addonId: v.id("addons"),
    promotionId: v.optional(v.id("pricing_campaigns")),
    checkoutSessionId: v.string(),
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const addon = await ctx.db.get(args.addonId);
    if (!addon) throw new Error("Addon not found");

    // Check/create org_addons record
    const existing = await ctx.db
      .query("org_addons")
      .withIndex("by_org_addon", (q: any) =>
        q.eq("orgId", args.orgId as any).eq("addonId", args.addonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "active",
        source: "paid",
        purchasedAt: Date.now(),
        stripeCheckoutSessionId: args.checkoutSessionId,
        stripePaymentIntentId: args.paymentIntentId,
        lastPaymentStatus: "succeeded",
        promotionId: args.promotionId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("org_addons", {
        orgId: args.orgId as any,
        addonId: args.addonId,
        status: "active",
        source: "paid",
        purchasedAt: Date.now(),
        stripeCheckoutSessionId: args.checkoutSessionId,
        stripePaymentIntentId: args.paymentIntentId,
        lastPaymentStatus: "succeeded",
        promotionId: args.promotionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Enable the module (simple no-op for now)
    return "Purchase activated";
  },
});

/**
 * Handle payment failure for an add-on
 */
export const handlePaymentFailure = mutation({
  args: {
    orgId: v.string(),
    addonId: v.id("addons"),
    paymentIntentId: v.string(),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update org_addons if it exists
    const existing = await ctx.db
      .query("org_addons")
      .withIndex("by_org_addon", (q: any) =>
        q.eq("orgId", args.orgId as any).eq("addonId", args.addonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastPaymentStatus: "failed",
        updatedAt: Date.now(),
      });
    }

    return "Payment failure recorded";
  },
});
