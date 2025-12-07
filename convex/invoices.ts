/**
 * Invoices API
 * CRUD operations for simple invoicing (Core Product)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUserOrThrow } from "./users";

/**
 * List all invoices for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        let invoicesQuery = ctx.db
            .query("invoices")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .order("desc");

        const invoices = await invoicesQuery.take(args.limit || 50);

        // Filter by status in memory if specified
        if (args.status) {
            return invoices.filter((inv) => inv.status === args.status);
        }

        return invoices;
    },
});

/**
 * Get a single invoice by ID
 */
export const getById = query({
    args: {
        id: v.id("invoices"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const invoice = await ctx.db.get(args.id);
        return invoice;
    },
});

/**
 * Get the next invoice number for an organization
 */
export const getNextInvoiceNumber = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Get the highest invoice number
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        if (invoices.length === 0) {
            return "INV-001";
        }

        // Extract numbers and find max
        const numbers = invoices
            .map((inv) => {
                const match = inv.invoiceNumber.match(/INV-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n));

        const maxNumber = Math.max(...numbers, 0);
        const nextNumber = maxNumber + 1;

        return `INV-${nextNumber.toString().padStart(3, "0")}`;
    },
});

/**
 * Create a new invoice
 */
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        customerId: v.optional(v.id("vendors")),
        customerName: v.string(),
        customerEmail: v.optional(v.string()),
        customerAddress: v.optional(v.string()),
        invoiceNumber: v.string(),
        issueDate: v.number(),
        dueDate: v.number(),
        lineItems: v.array(
            v.object({
                description: v.string(),
                quantity: v.number(),
                unitPrice: v.number(),
                amount: v.number(),
                taxRate: v.optional(v.number()),
            })
        ),
        subtotal: v.number(),
        taxAmount: v.optional(v.number()),
        total: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        paymentTerms: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const id = await ctx.db.insert("invoices", {
            ...args,
            status: "draft",
            createdByUserId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});

/**
 * Update an existing invoice
 */
export const update = mutation({
    args: {
        id: v.id("invoices"),
        customerId: v.optional(v.id("vendors")),
        customerName: v.optional(v.string()),
        customerEmail: v.optional(v.string()),
        customerAddress: v.optional(v.string()),
        issueDate: v.optional(v.number()),
        dueDate: v.optional(v.number()),
        lineItems: v.optional(
            v.array(
                v.object({
                    description: v.string(),
                    quantity: v.number(),
                    unitPrice: v.number(),
                    amount: v.number(),
                    taxRate: v.optional(v.number()),
                })
            )
        ),
        subtotal: v.optional(v.number()),
        taxAmount: v.optional(v.number()),
        total: v.optional(v.number()),
        notes: v.optional(v.string()),
        paymentTerms: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const { id, ...updates } = args;

        const invoice = await ctx.db.get(id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Only allow updates to draft invoices
        if (invoice.status !== "draft") {
            throw new Error("Can only update draft invoices");
        }

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete an invoice
 */
export const remove = mutation({
    args: {
        id: v.id("invoices"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const invoice = await ctx.db.get(args.id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Only allow deletion of draft invoices
        if (invoice.status !== "draft") {
            throw new Error("Can only delete draft invoices");
        }

        await ctx.db.delete(args.id);
    },
});

/**
 * Mark invoice as sent
 */
export const markAsSent = mutation({
    args: {
        id: v.id("invoices"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const invoice = await ctx.db.get(args.id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        await ctx.db.patch(args.id, {
            status: "sent",
            updatedAt: Date.now(),
        });
    },
});

/**
 * Mark invoice as paid
 */
export const markAsPaid = mutation({
    args: {
        id: v.id("invoices"),
        paidAt: v.optional(v.number()),
        transactionId: v.optional(v.id("transactions_raw")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const invoice = await ctx.db.get(args.id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        await ctx.db.patch(args.id, {
            status: "paid",
            paidAt: args.paidAt || Date.now(),
            paidTransactionId: args.transactionId,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Void an invoice
 */
export const voidInvoice = mutation({
    args: {
        id: v.id("invoices"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const invoice = await ctx.db.get(args.id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        if (invoice.status === "paid") {
            throw new Error("Cannot void a paid invoice");
        }

        await ctx.db.patch(args.id, {
            status: "void",
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get invoice stats for an organization
 */
export const getStats = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        const now = Date.now();

        const stats = {
            total: invoices.length,
            draft: invoices.filter((i) => i.status === "draft").length,
            sent: invoices.filter((i) => i.status === "sent").length,
            paid: invoices.filter((i) => i.status === "paid").length,
            overdue: invoices.filter(
                (i) => i.status === "sent" && i.dueDate < now
            ).length,
            totalOutstanding: invoices
                .filter((i) => i.status === "sent" || i.status === "viewed")
                .reduce((sum, i) => sum + i.total, 0),
            totalPaid: invoices
                .filter((i) => i.status === "paid")
                .reduce((sum, i) => sum + i.total, 0),
        };

        return stats;
    },
});
