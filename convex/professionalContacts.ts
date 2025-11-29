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
    isPrimary: v.optional(v.boolean()),
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

    // If setting as primary, unset others of the same type
    if (args.isPrimary) {
      const existingContacts = await ctx.db
        .query("professional_contacts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const existingPrimary = existingContacts.find(
        (c) => c.contactType === args.contactType && c.isPrimary === true
      );

      if (existingPrimary) {
        await ctx.db.patch(existingPrimary._id, { isPrimary: false });
      }
    }

    const contactId = await ctx.db.insert("professional_contacts", {
      userId: user._id,
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

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
    isPrimary: v.optional(v.boolean()),
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

    // If setting as primary, unset others of the same type
    if (args.isPrimary) {
      const contactType = args.contactType || contact.contactType;
      const existingContacts = await ctx.db
        .query("professional_contacts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const existingPrimary = existingContacts.find(
        (c) => c.contactType === contactType && c.isPrimary === true && c._id !== args.id
      );

      if (existingPrimary) {
        await ctx.db.patch(existingPrimary._id, { isPrimary: false });
      }
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: Date.now(),
    });

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

