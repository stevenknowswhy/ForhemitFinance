import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get events for the payment calendar (Bills, Subscriptions, Income)
 */
export const getEvents = query({
    args: {
        orgId: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        if (!args.orgId) return [];

        // 1. Get Bills (Due Date)
        const bills = await ctx.db.query("bills")
            .withIndex("by_org", q => q.eq("orgId", args.orgId as any))
            .filter(q => q.and(
                q.gte(q.field("dueDate"), args.startDate),
                q.lte(q.field("dueDate"), args.endDate),
                q.neq(q.field("status"), "canceled") // Don't show canceled bills
            ))
            .collect();

        // 2. Get Subscriptions (Next Run Date)
        // Note: Subscriptions are recurring, so ideally we project them onto the calendar.
        // For MVP, we only show the 'nextRunDate' if it falls in the window.
        // A more advanced version would generate occurrences.
        const subscriptions = await ctx.db.query("subscriptions_billpay")
            .withIndex("by_org", q => q.eq("orgId", args.orgId as any))
            .filter(q => q.and(
                q.eq(q.field("isActive"), true),
                q.gte(q.field("nextRunDate"), args.startDate),
                q.lte(q.field("nextRunDate"), args.endDate)
            ))
            .collect();

        // 3. Get Income (Scheduled Transactions > 0)
        // We use transactions_raw with status="scheduled" and amount > 0
        const scheduledIncome = await ctx.db.query("transactions_raw")
            .withIndex("by_org", q => q.eq("orgId", args.orgId as any))
            .filter(q => q.and(
                q.eq(q.field("status"), "scheduled"),
                q.gt(q.field("amount"), 0),
                q.gte(q.field("dateTimestamp"), args.startDate), // Assuming dateTimestamp exists and is populated
                q.lte(q.field("dateTimestamp"), args.endDate)
            ))
            .collect();

        // If dateTimestamp is not reliable, we might need to parse `date` string.
        // However, schema says `dateTimestamp` is optional. Let's assume it's populated for scheduled txs.
        // If not, we might miss them. 
        // fallback: scan and filter in memory if volume is low? 
        // For now, let's trust dateTimestamp or date string range if indexed. 
        // `by_org_date` index uses `date` (ISO string). 
        // Let's use `by_org_date` instead since `date` string is reliably YYYY-MM-DD.
        // But `startDate` arg is number. 
        // We will convert number to ISO string range for query if possible, or just filter in memory for MVP.
        // Given we already fetched bills/subs, let's fetch scheduled txs and filter.

        // Wait, `transactions_raw` has `by_org` index.
        const allScheduled = await ctx.db.query("transactions_raw")
            .withIndex("by_org", q => q.eq("orgId", args.orgId as any))
            .filter(q => q.eq(q.field("status"), "scheduled"))
            .collect();

        const incomeEvents = allScheduled
            .filter(tx => tx.amount > 0)
            .filter(tx => {
                const updatedTime = new Date(tx.date).getTime();
                return updatedTime >= args.startDate && updatedTime <= args.endDate;
            })
            .map(tx => ({
                id: tx._id,
                type: "income",
                title: tx.description || tx.merchant || "Incoming Payment",
                date: new Date(tx.date).getTime(),
                amount: tx.amount,
                status: "scheduled",
                currency: tx.currency,
            }));

        const billEvents = Promise.all(bills.map(async (b) => {
            const vendor = await ctx.db.get(b.vendorId);
            return {
                id: b._id,
                type: "bill",
                title: vendor?.name || "Bill",
                date: b.dueDate,
                amount: b.amount,
                status: b.status,
                currency: b.currency,
            };
        }));

        const subEvents = Promise.all(subscriptions.map(async (s) => {
            // We might want vendor name too
            const vendor = await ctx.db.get(s.vendorId);
            return {
                id: s._id,
                type: "subscription",
                title: s.name || vendor?.name || "Subscription",
                date: s.nextRunDate,
                amount: s.amount,
                status: "active",
                currency: s.currency,
            };
        }));

        return [
            ...incomeEvents,
            ...(await billEvents),
            ...(await subEvents)
        ].sort((a, b) => a.date - b.date);
    }
});
