import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission } from "./rbac";

/**
 * List bills for an organization
 */
export const list = query({
    args: {
        orgId: v.id("organizations"),
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("open"),
            v.literal("scheduled"),
            v.literal("paid"),
            v.literal("failed"),
            v.literal("canceled"),
            v.literal("all_active") // Custom filter
        )),
        vendorId: v.optional(v.id("vendors")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        // Check membership
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", args.orgId))
            .first();

        if (!membership) throw new Error("Not a member of this organization");

        let billsQuery = ctx.db
            .query("bills")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

        let bills = await billsQuery.collect();

        // Apply filters in memory (Convex indexes are limited for complex multi-field filtering)
        if (args.status) {
            if (args.status === "all_active") {
                bills = bills.filter(b => b.status !== "canceled" && b.status !== "paid");
            } else {
                bills = bills.filter(b => b.status === args.status);
            }
        }

        if (args.vendorId) {
            bills = bills.filter(b => b.vendorId === args.vendorId);
        }

        if (args.startDate) {
            bills = bills.filter(b => b.dueDate >= args.startDate!);
        }

        if (args.endDate) {
            bills = bills.filter(b => b.dueDate <= args.endDate!);
        }

        // Sort by due date asc
        return bills.sort((a, b) => a.dueDate - b.dueDate);
    },
});

/**
 * Create a new bill
 */
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        vendorId: v.id("vendors"),
        amount: v.number(),
        dueDate: v.number(),
        frequency: v.union(
            v.literal("one_time"),
            v.literal("monthly"),
            v.literal("quarterly"),
            v.literal("yearly")
        ),
        autoPay: v.boolean(),
        paymentAccountId: v.optional(v.id("accounts")),
        glDebitAccountId: v.optional(v.id("accounts")),
        glCreditAccountId: v.optional(v.id("accounts")),
        notes: v.optional(v.string()),
        attachmentUrls: v.optional(v.array(v.string())),
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("open"),
            v.literal("scheduled")
        )),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, args.orgId, "VIEW_FINANCIALS"); // Placeholder

        const billId = await ctx.db.insert("bills", {
            orgId: args.orgId,
            vendorId: args.vendorId,
            amount: args.amount,
            currency: "USD", // Default for now
            dueDate: args.dueDate,
            status: args.status || "open",
            frequency: args.frequency,
            autoPay: args.autoPay,
            paymentAccountId: args.paymentAccountId,
            glDebitAccountId: args.glDebitAccountId,
            glCreditAccountId: args.glCreditAccountId,
            notes: args.notes,
            attachmentUrls: args.attachmentUrls,
            createdByUserId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Create Scheduled Transaction (Future Planning)
        const vendor = await ctx.db.get(args.vendorId);
        const description = vendor ? `Bill: ${vendor.name}` : "Bill Payment";

        // Use a placeholder account if payment account not selected yet, or just don't create transaction?
        // Better to create it so it shows up in cash flow forecast.
        // We need an accountId for transactions_raw. distinct from paymentAccountId?
        // If paymentAccountId is null, maybe use a "Pending" or "Accounts Payable" placeholder ID or just skip?
        // transactions_raw.accountId is required.
        // Let's only create if we have a paymentAccountId (bank account selected) OR if we allow null accountId (schema says required).
        // For MVP, if no payment source selected, maybe we don't create the transaction yet, OR we require payment source?
        // The UI allows payment source to be selected later.
        // Let's SKIP creating transaction if no paymentAccountId is provided, but allow it if it is.

        if (args.paymentAccountId) {
            const transactionId = await ctx.db.insert("transactions_raw", {
                orgId: args.orgId,
                userId: user._id,
                accountId: args.paymentAccountId,
                amount: -args.amount,
                currency: "USD",
                date: new Date(args.dueDate).toISOString(),
                description: description,
                status: "scheduled",
                source: "manual",
                isBusiness: true,
                createdAt: Date.now(),
            });

            await ctx.db.patch(billId, {
                transactionId: transactionId,
            });
        }

        return billId;
    },
});

/**
 * Update a bill
 */
export const update = mutation({
    args: {
        billId: v.id("bills"),
        amount: v.optional(v.number()),
        dueDate: v.optional(v.number()),
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("open"),
            v.literal("scheduled"),
            v.literal("paid"),
            v.literal("failed"),
            v.literal("canceled")
        )),
        paymentAccountId: v.optional(v.id("accounts")),
        glDebitAccountId: v.optional(v.id("accounts")),
        glCreditAccountId: v.optional(v.id("accounts")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const bill = await ctx.db.get(args.billId);
        if (!bill) throw new Error("Bill not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, bill.orgId, "VIEW_FINANCIALS"); // Placeholder

        await ctx.db.patch(args.billId, {
            amount: args.amount,
            dueDate: args.dueDate,
            status: args.status,
            paymentAccountId: args.paymentAccountId,
            glDebitAccountId: args.glDebitAccountId,
            glCreditAccountId: args.glCreditAccountId,
            notes: args.notes,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Mark bill as paid
 */
export const markAsPaid = mutation({
    args: {
        billId: v.id("bills"),
        paymentAccountId: v.id("accounts"), // Account paid from
        paidAt: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const bill = await ctx.db.get(args.billId);
        if (!bill) throw new Error("Bill not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, bill.orgId, "VIEW_FINANCIALS"); // Placeholder

        // 1. Update bill status
        await ctx.db.patch(args.billId, {
            status: "paid",
            paymentAccountId: args.paymentAccountId,
            paidAt: args.paidAt,
            updatedAt: Date.now(),
        });

        // 2. Handle the transaction
        // Check if there's already a scheduled transaction
        let transactionId = bill.transactionId;

        const vendor = await ctx.db.get(bill.vendorId);
        const description = vendor ? `Payment to ${vendor.name}` : "Bill Payment";

        if (transactionId) {
            // Update existing scheduled transaction to posted
            const existingTx = await ctx.db.get(transactionId);
            if (existingTx) {
                await ctx.db.patch(transactionId, {
                    status: "posted",
                    accountId: args.paymentAccountId, // Update account if changed
                    date: new Date(args.paidAt).toISOString(),
                    // Update other fields if needed
                });
            } else {
                // If linked transaction missing, create new
                transactionId = undefined;
            }
        }

        if (!transactionId) {
            // Create new transaction if none existed
            transactionId = await ctx.db.insert("transactions_raw", {
                orgId: bill.orgId,
                userId: user._id, // Legacy field
                accountId: args.paymentAccountId,
                amount: -bill.amount, // Outflow
                currency: bill.currency,
                date: new Date(args.paidAt).toISOString(),
                description: description,
                status: "posted",
                source: "manual",
                isBusiness: true,
                createdAt: Date.now(),
            });

            // Link to bill
            await ctx.db.patch(args.billId, {
                transactionId: transactionId,
            });
        }

        return transactionId;
    },
});

/**
 * Delete a bill
 */
export const deleteBill = mutation({
    args: {
        billId: v.id("bills"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const bill = await ctx.db.get(args.billId);
        if (!bill) throw new Error("Bill not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        await requirePermission(ctx, user._id, bill.orgId, "VIEW_FINANCIALS"); // Placeholder

        await ctx.db.delete(args.billId);
    },
});
