import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex database schema for EZ Financial
 */

export default defineSchema({
  // Users
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    businessType: v.optional(v.union(
      v.literal("creator"),
      v.literal("tradesperson"),
      v.literal("wellness"),
      v.literal("tutor"),
      v.literal("real_estate"),
      v.literal("agency"),
      v.literal("other")
    )),
    subscriptionTier: v.union(
      v.literal("solo"),
      v.literal("light"),
      v.literal("pro")
    ),
    preferences: v.object({
      defaultCurrency: v.string(),
      fiscalYearStart: v.optional(v.string()),
      aiInsightLevel: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      ),
      notificationsEnabled: v.boolean(),
      darkMode: v.optional(v.boolean()),
    }),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Plaid institutions
  institutions: defineTable({
    userId: v.id("users"),
    plaidItemId: v.string(),
    plaidInstitutionId: v.string(),
    name: v.string(),
    accessTokenEncrypted: v.string(), // Encrypted Plaid access token
    lastSyncAt: v.optional(v.number()),
    syncStatus: v.union(
      v.literal("active"),
      v.literal("error"),
      v.literal("disconnected")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_plaid_item", ["plaidItemId"]),

  // Accounts (bank accounts + chart of accounts)
  accounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("income"),
      v.literal("expense")
    ),
    isBusiness: v.boolean(),
    parentId: v.optional(v.id("accounts")),
    plaidAccountId: v.optional(v.string()), // If linked to Plaid
    institutionId: v.optional(v.id("institutions")),
    balance: v.optional(v.number()), // Current balance
    // Mock bank connection fields
    bankId: v.optional(v.string()), // Mock bank ID (chase, bofa, etc.)
    bankName: v.optional(v.string()), // Mock bank name
    accountType: v.optional(v.string()), // Checking, Savings, Credit Card
    accountNumber: v.optional(v.string()), // Last 4 digits
    availableBalance: v.optional(v.number()),
    currency: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    connectedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_bank", ["bankId"]),

  // Raw transactions from Plaid
  transactions_raw: defineTable({
    userId: v.id("users"),
    plaidTransactionId: v.optional(v.string()),
    accountId: v.id("accounts"),
    amount: v.number(),
    currency: v.string(),
    date: v.string(), // ISO date string
    merchant: v.optional(v.string()),
    category: v.optional(v.array(v.string())),
    plaidCategory: v.optional(v.array(v.string())),
    description: v.string(),
    isPending: v.boolean(),
    source: v.union(
      v.literal("plaid"),
      v.literal("manual"),
      v.literal("receipt"),
      v.literal("mock") // Mock transactions
    ),
    receiptUrl: v.optional(v.string()),
    // Mock transaction fields
    transactionId: v.optional(v.string()), // Unique transaction ID for mock
    transactionType: v.optional(v.union(
      v.literal("debit"),
      v.literal("credit")
    )),
    merchantName: v.optional(v.string()),
    categoryName: v.optional(v.string()), // Single category name for mock
    location: v.optional(v.object({
      city: v.string(),
      state: v.string(),
    })),
    dateTimestamp: v.optional(v.number()), // Numeric timestamp for sorting/filtering
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_plaid_id", ["plaidTransactionId"])
    .index("by_date", ["userId", "dateTimestamp"]),

  // Proposed entries (waiting for approval)
  entries_proposed: defineTable({
    userId: v.id("users"),
    transactionId: v.optional(v.id("transactions_raw")),
    receiptId: v.optional(v.id("receipts")),
    date: v.number(),
    memo: v.string(),
    debitAccountId: v.id("accounts"),
    creditAccountId: v.id("accounts"),
    amount: v.number(),
    currency: v.string(),
    confidence: v.number(), // 0-1
    source: v.union(
      v.literal("plaid_rules"),
      v.literal("user_rule"),
      v.literal("ai_model"),
      v.literal("manual")
    ),
    explanation: v.string(),
    isBusiness: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("edited")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_transaction", ["transactionId"]),

  // Final approved entries
  entries_final: defineTable({
    userId: v.id("users"),
    date: v.number(),
    memo: v.string(),
    source: v.union(
      v.literal("plaid"),
      v.literal("manual"),
      v.literal("ai"),
      v.literal("adjustment")
    ),
    status: v.union(
      v.literal("posted"),
      v.literal("pending")
    ),
    createdAt: v.number(),
    approvedAt: v.number(),
    approvedBy: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Entry lines (debits/credits)
  entry_lines: defineTable({
    entryId: v.id("entries_final"),
    accountId: v.id("accounts"),
    side: v.union(
      v.literal("debit"),
      v.literal("credit")
    ),
    amount: v.number(),
    currency: v.string(),
  })
    .index("by_entry", ["entryId"])
    .index("by_account", ["accountId"]),

  // Receipts
  receipts: defineTable({
    userId: v.id("users"),
    storageUrl: v.string(), // S3/R2 URL
    ocrData: v.optional(v.object({
      merchant: v.optional(v.string()),
      amount: v.optional(v.number()),
      date: v.optional(v.string()),
      items: v.optional(v.array(v.object({
        description: v.string(),
        amount: v.number(),
        quantity: v.optional(v.number()),
      }))),
      tax: v.optional(v.number()),
      tip: v.optional(v.number()),
      confidence: v.number(),
    })),
    matchedTransactionId: v.optional(v.id("transactions_raw")),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Financial goals
  goals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("save_amount"),
      v.literal("reduce_expense"),
      v.literal("increase_revenue"),
      v.literal("maintain_runway")
    ),
    targetAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    currentAmount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    categoryId: v.optional(v.id("accounts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Budgets
  budgets: defineTable({
    userId: v.id("users"),
    categoryId: v.id("accounts"),
    period: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    amount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    spent: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["categoryId"]),

  // AI insights and narratives
  ai_insights: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("monthly_narrative"),
      v.literal("alert"),
      v.literal("recommendation"),
      v.literal("forecast")
    ),
    period: v.string(), // "2024-01" format
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_period", ["userId", "period"]),
});

