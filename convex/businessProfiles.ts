/**
 * Business Profile management functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get business profile for current user
 */
export const getBusinessProfile = query({
  args: {},
  handler: async (ctx) => {
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
    usesRegisteredAgent: v.optional(v.boolean()),
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
    // Certifications
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

    const existingProfile = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const updateData: any = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, updateData);
      return { success: true, id: existingProfile._id };
    } else {
      const profileId = await ctx.db.insert("business_profiles", {
        userId: user._id,
        ...updateData,
        createdAt: Date.now(),
      });
      return { success: true, id: profileId };
    }
  },
});

