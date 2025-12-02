/**
 * Business Profile management functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get business profile for current user
 */
/**
 * Get business profile for current user or organization
 */
export const getBusinessProfile = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    // If orgId is provided, get profile for that org
    if (args.orgId) {
      const profile = await ctx.db
        .query("business_profiles")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .first();
      return profile;
    }

    // Fallback to user-linked profile (legacy)
    const profile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});

/**
 * Update or create business profile
 */
export const updateBusinessProfile = mutation({
  args: {
    orgId: v.optional(v.id("organizations")), // Optional for backward compatibility
    // Business Branding
    businessIcon: v.optional(v.string()), // URL to uploaded business icon
    // Core Business Identity
    legalBusinessName: v.optional(v.string()),
    dbaTradeName: v.optional(v.string()),
    einTaxId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    filingState: v.optional(v.string()),
    dateOfIncorporation: v.optional(v.string()),
    naicsCode: v.optional(v.string()),
    businessCategory: v.optional(v.string()),
    businessStructure: v.optional(v.string()),
    // Business Address & Contact
    registeredAddress: v.optional(v.string()),
    headquartersAddress: v.optional(v.string()),
    mailingAddress: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    businessEmail: v.optional(v.string()),
    businessWebsite: v.optional(v.string()),
    // Compliance & Verification IDs
    dunsNumber: v.optional(v.string()),
    samUei: v.optional(v.string()),
    cageCode: v.optional(v.string()),
    stateBusinessLicense: v.optional(v.string()),
    localBusinessLicense: v.optional(v.string()),
    resellersPermit: v.optional(v.string()),
    stateTaxRegistrationId: v.optional(v.string()),
    // Financial Profile
    primaryBankName: v.optional(v.string()),
    merchantProvider: v.optional(v.string()),
    averageMonthlyRevenue: v.optional(v.number()),
    fundingStatus: v.optional(v.string()),
    stageOfBusiness: v.optional(v.string()),
    // Ownership & Leadership
    owners: v.optional(v.array(v.object({
      name: v.string(),
      ownershipPercentage: v.optional(v.string()),
      linkedIn: v.optional(v.string()),
      role: v.optional(v.string()),
    }))),
    registeredAgent: v.optional(v.object({
      name: v.optional(v.string()),
      company: v.optional(v.string()),
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zip: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    })),
    // Operational Details
    numberOfEmployees: v.optional(v.number()),
    independentContractors: v.optional(v.number()),
    workModel: v.optional(v.union(
      v.literal("remote"),
      v.literal("hybrid"),
      v.literal("on_site")
    )),
    businessDescription: v.optional(v.string()),
    products: v.optional(v.array(v.string())),
    // Business Demographics
    womanOwned: v.optional(v.boolean()),
    minorityOwned: v.optional(v.boolean()),
    veteranOwned: v.optional(v.boolean()),
    lgbtqOwned: v.optional(v.boolean()),
    dbeStatus: v.optional(v.boolean()),
    hubzoneQualification: v.optional(v.boolean()),
    ruralUrban: v.optional(v.union(
      v.literal("rural"),
      v.literal("urban"),
      v.literal("suburban")
    )),
    // Certifications - structured array with dates and metadata
    certifications: v.optional(v.array(v.object({
      type: v.union(
        v.literal("8a"),
        v.literal("wosb"),
        v.literal("mbe"),
        v.literal("dbe"),
        v.literal("hubzone"),
        v.literal("gdpr"),
        v.literal("ccpa"),
        v.literal("iso")
      ),
      obtainedAt: v.number(),
      expiresAt: v.optional(v.number()),
      certificateNumber: v.optional(v.string()),
      notes: v.optional(v.string()),
    }))),
    // Legacy fields - kept for backward compatibility during migration
    cert8a: v.optional(v.boolean()),
    certWosb: v.optional(v.boolean()),
    certMbe: v.optional(v.boolean()),
    isoCertifications: v.optional(v.string()),
    gdprCompliant: v.optional(v.boolean()),
    ccpaCompliant: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let existingProfile;

    if (args.orgId) {
      existingProfile = await ctx.db
        .query("business_profiles")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .first();
    } else {
      existingProfile = await ctx.db
        .query("business_profiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
    }

    // Migrate legacy certification booleans to new certifications array if provided
    let certifications = args.certifications;
    if (!certifications && existingProfile) {
      // If no new certifications provided, try to preserve existing ones
      certifications = existingProfile.certifications;
    }

    // If legacy booleans are provided, migrate them to certifications array
    if (args.cert8a || args.certWosb || args.certMbe || args.gdprCompliant || args.ccpaCompliant || args.isoCertifications) {
      const now = Date.now();
      certifications = certifications || [];

      // Remove existing certifications of these types before adding new ones
      const legacyTypes = ["8a", "wosb", "mbe", "gdpr", "ccpa", "iso"];
      certifications = certifications.filter((c: any) => !legacyTypes.includes(c.type));

      // Add certifications from legacy booleans
      if (args.cert8a) {
        certifications.push({ type: "8a", obtainedAt: now });
      }
      if (args.certWosb) {
        certifications.push({ type: "wosb", obtainedAt: now });
      }
      if (args.certMbe) {
        certifications.push({ type: "mbe", obtainedAt: now });
      }
      if (args.gdprCompliant) {
        certifications.push({ type: "gdpr", obtainedAt: now });
      }
      if (args.ccpaCompliant) {
        certifications.push({ type: "ccpa", obtainedAt: now });
      }
      if (args.isoCertifications) {
        certifications.push({
          type: "iso",
          obtainedAt: now,
          notes: args.isoCertifications
        });
      }
    }

    const updateData: any = {
      ...args,
      certifications,
      updatedAt: Date.now(),
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, updateData);
      return { success: true, id: existingProfile._id };
    } else {
      const profileId = await ctx.db.insert("business_profiles", {
        userId: user._id,
        orgId: args.orgId, // Link to org if provided
        ...updateData,
        createdAt: Date.now(),
      });
      return { success: true, id: profileId };
    }
  },
});

