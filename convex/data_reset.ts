/**
 * Data Reset Functions
 * Handles resetting user data: transactions only or full factory reset
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Clear all transactions for the current user
 * Preserves settings, accounts, categories, and other configuration
 */
export const resetTransactionsOnly = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    let transactionsDeleted = 0;
    let proposedEntriesDeleted = 0;
    let finalEntriesDeleted = 0;
    let entryLinesDeleted = 0;

    // Delete all proposed entries first (they reference transactions)
    const allProposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const entry of allProposedEntries) {
      await ctx.db.delete(entry._id);
      proposedEntriesDeleted++;
    }

    // Delete all transactions
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
      transactionsDeleted++;
    }

    // Delete all final entries and their entry lines
    const finalEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const entry of finalEntries) {
      // Delete entry lines
      const entryLines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
        .collect();

      for (const line of entryLines) {
        await ctx.db.delete(line._id);
        entryLinesDeleted++;
      }

      await ctx.db.delete(entry._id);
      finalEntriesDeleted++;
    }

    // Log the reset event
    await ctx.db.insert("reset_events", {
      userId,
      resetType: "transactions_only",
      performedAt: Date.now(),
      performedBy: userId,
      metadata: {
        transactionsDeleted,
        entriesDeleted: proposedEntriesDeleted + finalEntriesDeleted,
      },
    });

    return {
      success: true,
      deleted: {
        transactions: transactionsDeleted,
        proposedEntries: proposedEntriesDeleted,
        finalEntries: finalEntriesDeleted,
        entryLines: entryLinesDeleted,
      },
    };
  },
});

/**
 * Factory reset - clears all user data except identity
 * Returns app to brand-new state
 */
export const factoryReset = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    const stats = {
      transactions: 0,
      accounts: 0,
      proposedEntries: 0,
      finalEntries: 0,
      entryLines: 0,
      receipts: 0,
      addresses: 0,
      businessProfiles: 0,
      professionalContacts: 0,
      goals: 0,
      budgets: 0,
      aiInsights: 0,
      institutions: 0,
      aiStories: 0,
      categories: 0,
    };

    // Delete all proposed entries first
    const allProposedEntries = await ctx.db
      .query("entries_proposed")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const entry of allProposedEntries) {
      await ctx.db.delete(entry._id);
      stats.proposedEntries++;
    }

    // Delete all transactions and associated data
    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const transaction of transactions) {
      // Delete associated receipts
      if (transaction.receiptIds && transaction.receiptIds.length > 0) {
        for (const receiptId of transaction.receiptIds) {
          await ctx.db.delete(receiptId);
          stats.receipts++;
        }
      }

      await ctx.db.delete(transaction._id);
      stats.transactions++;
    }

    // Delete all final entries and their entry lines
    const finalEntries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const entry of finalEntries) {
      // Delete entry lines
      const entryLines = await ctx.db
        .query("entry_lines")
        .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
        .collect();

      for (const line of entryLines) {
        await ctx.db.delete(line._id);
        stats.entryLines++;
      }

      await ctx.db.delete(entry._id);
      stats.finalEntries++;
    }

    // Delete all remaining receipts
    const allReceipts = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const receipt of allReceipts) {
      await ctx.db.delete(receipt._id);
      stats.receipts++;
    }

    // Delete all accounts (except we might want to keep default chart of accounts structure)
    // For factory reset, we'll delete all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
      stats.accounts++;
    }

    // Delete all addresses
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const address of addresses) {
      await ctx.db.delete(address._id);
      stats.addresses++;
    }

    // Delete business profiles
    const businessProfiles = await ctx.db
      .query("business_profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const profile of businessProfiles) {
      await ctx.db.delete(profile._id);
      stats.businessProfiles++;
    }

    // Delete professional contacts
    const professionalContacts = await ctx.db
      .query("professional_contacts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const contact of professionalContacts) {
      await ctx.db.delete(contact._id);
      stats.professionalContacts++;
    }

    // Delete goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const goal of goals) {
      await ctx.db.delete(goal._id);
      stats.goals++;
    }

    // Delete budgets
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const budget of budgets) {
      await ctx.db.delete(budget._id);
      stats.budgets++;
    }

    // Delete AI insights
    const aiInsights = await ctx.db
      .query("ai_insights")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const insight of aiInsights) {
      await ctx.db.delete(insight._id);
      stats.aiInsights++;
    }

    // Delete AI stories
    const aiStories = await ctx.db
      .query("ai_stories")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const story of aiStories) {
      await ctx.db.delete(story._id);
      stats.aiStories++;
    }

    // Delete institutions (Plaid connections)
    const institutions = await ctx.db
      .query("institutions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const institution of institutions) {
      await ctx.db.delete(institution._id);
      stats.institutions++;
    }

    // Delete categorization knowledge/patterns
    const categorizationKnowledge = await ctx.db
      .query("categorization_knowledge")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const knowledge of categorizationKnowledge) {
      await ctx.db.delete(knowledge._id);
      stats.categories++;
    }

    // Reset user preferences to defaults (but keep user record)
    await ctx.db.patch(userId, {
      preferences: {
        defaultCurrency: "USD",
        aiInsightLevel: "medium",
        notificationsEnabled: true,
        darkMode: undefined,
        numberFormat: undefined,
        timezone: undefined,
        weekStart: undefined,
        defaultHomeTab: undefined,
        accountingMethod: undefined,
        businessEntityType: undefined,
        transactionAlerts: undefined,
        weeklyBurnRate: undefined,
        monthlyCashFlow: undefined,
        anomalyAlerts: undefined,
        pushNotifications: undefined,
        emailNotifications: undefined,
        smsAlerts: undefined,
        optOutAI: undefined,
        allowTraining: undefined,
        hideBalances: undefined,
        optOutAnalytics: undefined,
        aiStrictness: undefined,
        showExplanations: undefined,
        aiTone: undefined,
        confidenceThreshold: undefined,
        customCategories: undefined,
      },
      businessType: undefined,
    });

    // Log the reset event
    await ctx.db.insert("reset_events", {
      userId,
      resetType: "factory_reset",
      performedAt: Date.now(),
      performedBy: userId,
      metadata: {
        transactionsDeleted: stats.transactions,
        accountsDeleted: stats.accounts,
        entriesDeleted: stats.proposedEntries + stats.finalEntries,
        otherDataDeleted: stats.receipts + stats.addresses + stats.businessProfiles + stats.professionalContacts + stats.goals + stats.budgets + stats.aiInsights + stats.aiStories + stats.institutions + stats.categories,
      },
    });

    return {
      success: true,
      deleted: stats,
    };
  },
});

/**
 * Get reset history for the current user
 */
export const getResetHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated or email not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const resetEvents = await ctx.db
      .query("reset_events")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(10); // Last 10 reset events

    return resetEvents;
  },
});
