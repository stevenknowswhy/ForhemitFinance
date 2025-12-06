
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Process active bill subscriptions
 * Runs daily to generate bills for subscriptions due today or in the past
 */
export const processBillSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Find all active subscriptions due
    // Note: In a large scale app, we'd want to paginate or use an index on nextRunDate
    // For now, we'll scan all, or better, use an index if we had one.
    // We do not have a global index on nextRunDate across all orgs, only by org.
    // We can scan all subscriptions table since it's likely manageable for this scale, 
    // or iterate through orgs. Scanning table is easiest for MVP.
    const subscriptions = await ctx.db
      .query("subscriptions_billpay")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const dueSubscriptions = subscriptions.filter(s => s.nextRunDate <= now);

    if (dueSubscriptions.length === 0) {
      console.log("No subscriptions due to process.");
      return;
    }

    console.log(`Processing ${dueSubscriptions.length} due subscriptions...`);

    for (const sub of dueSubscriptions) {
      // Find a valid user to attribute this to (Org Owner)
      // We need this because createdByUserId is required.
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_org", (q) => q.eq("orgId", sub.orgId))
        .filter(q => q.eq(q.field("role"), "ORG_OWNER"))
        .first();

      const userId = membership?.userId;

      if (!userId) {
        console.error(`Could not find owner for org ${sub.orgId}, skipping bill generation.`);
        continue;
      }

      // Create Bill
      await ctx.db.insert("bills", {
        orgId: sub.orgId,
        vendorId: sub.vendorId,
        amount: sub.amount,
        currency: sub.currency,
        dueDate: now, // Due today
        status: "open",
        frequency: sub.interval === "custom" ? "one_time" : (sub.interval as any),
        autoPay: false,
        paymentAccountId: sub.defaultPaymentAccountId,
        glDebitAccountId: sub.defaultCategoryId,
        notes: `Auto-generated from subscription: ${sub.name}`,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });

      // Determine next run date
      let nextRun = new Date(sub.nextRunDate);
      if (sub.interval === "monthly") {
        nextRun.setMonth(nextRun.getMonth() + 1);
      } else if (sub.interval === "yearly") {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      } else {
        // Custom or one-time, maybe disable?
        // For "custom", we might just disable after one run or need logic.
        // Let's default to monthly fallback or disable.
        nextRun.setMonth(nextRun.getMonth() + 1);
      }

      // Update Subscription
      await ctx.db.patch(sub._id, {
        lastRunDate: now,
        nextRunDate: nextRun.getTime(),
        updatedAt: now,
      });
    }
  }
});
