/**
 * Professional Contacts management functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all professional contacts for current user
 */
export const getProfessionalContacts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const contacts = await ctx.db
      .query("professional_contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return contacts;
  },
});

/**
 * Add a new professional contact
 */
export const addProfessionalContact = mutation({
  args: {
    contactType: v.string(),
    category: v.optional(v.string()),
    name: v.string(),
    firmCompany: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    setAsPrimaryAt: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()),
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

    const now = Date.now();
    const contactData: any = {
      userId: user._id,
      contactType: args.contactType,
      category: args.category,
      name: args.name,
      firmCompany: args.firmCompany,
      phone: args.phone,
      email: args.email,
      website: args.website,
      notes: args.notes,
      tags: args.tags,
      fileUrl: args.fileUrl,
      createdAt: now,
      updatedAt: now,
    };

    // If setting as primary, unset others of the same type
    if (args.setAsPrimaryAt !== undefined && args.setAsPrimaryAt !== null) {
      const existingContacts = await ctx.db
        .query("professional_contacts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const existingPrimary = existingContacts.find(
        (c) => c.contactType === args.contactType && c.setAsPrimaryAt !== null && c.setAsPrimaryAt !== undefined
      );

      if (existingPrimary) {
        await ctx.db.patch(existingPrimary._id, { setAsPrimaryAt: undefined });
      }
      contactData.setAsPrimaryAt = args.setAsPrimaryAt;
    }

    const contactId = await ctx.db.insert("professional_contacts", contactData);

    return { success: true, id: contactId };
  },
});

/**
 * Update an existing professional contact
 */
export const updateProfessionalContact = mutation({
  args: {
    id: v.id("professional_contacts"),
    contactType: v.optional(v.string()),
    category: v.optional(v.string()),
    name: v.optional(v.string()),
    firmCompany: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    setAsPrimaryAt: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()),
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

    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found or access denied");
    }

    const { id, setAsPrimaryAt, ...updateData } = args;
    const finalUpdateData: any = {
      ...updateData,
      updatedAt: Date.now(),
    };

    // If setting as primary, unset others of the same type
    if (setAsPrimaryAt !== undefined) {
      if (setAsPrimaryAt !== null) {
        const contactType = args.contactType || contact.contactType;
        const existingContacts = await ctx.db
          .query("professional_contacts")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const existingPrimary = existingContacts.find(
          (c) => c._id !== args.id && c.contactType === contactType && c.setAsPrimaryAt !== null && c.setAsPrimaryAt !== undefined
        );

        if (existingPrimary) {
          await ctx.db.patch(existingPrimary._id, { setAsPrimaryAt: undefined });
        }
      }
      finalUpdateData.setAsPrimaryAt = setAsPrimaryAt;
    }

    await ctx.db.patch(args.id, finalUpdateData);

    return { success: true };
  },
});

/**
 * Delete a professional contact
 */
export const deleteProfessionalContact = mutation({
  args: {
    id: v.id("professional_contacts"),
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

    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found or access denied");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

