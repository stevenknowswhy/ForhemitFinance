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
      // App Display Settings
      numberFormat: v.optional(v.union(v.literal("us"), v.literal("eu"))),
      timezone: v.optional(v.string()),
      weekStart: v.optional(v.union(v.literal("sunday"), v.literal("monday"))),
      defaultHomeTab: v.optional(v.union(
        v.literal("dashboard"),
        v.literal("transactions"),
        v.literal("analytics")
      )),
      // Accounting Preferences
      accountingMethod: v.optional(v.union(v.literal("cash"), v.literal("accrual"))),
      businessEntityType: v.optional(v.union(
        v.literal("sole_proprietorship"),
        v.literal("llc"),
        v.literal("s_corp"),
        v.literal("c_corp"),
        v.literal("partnership"),
        v.literal("nonprofit")
      )),
      // Notification Preferences
      transactionAlerts: v.optional(v.boolean()),
      weeklyBurnRate: v.optional(v.boolean()),
      monthlyCashFlow: v.optional(v.boolean()),
      anomalyAlerts: v.optional(v.boolean()),
      pushNotifications: v.optional(v.boolean()),
      emailNotifications: v.optional(v.boolean()),
      smsAlerts: v.optional(v.boolean()),
      // Privacy Settings
      optOutAI: v.optional(v.boolean()),
      allowTraining: v.optional(v.boolean()),
      hideBalances: v.optional(v.boolean()),
      optOutAnalytics: v.optional(v.boolean()),
      // AI Personalization
      aiStrictness: v.optional(v.number()), // 0-100
      showExplanations: v.optional(v.boolean()),
      aiTone: v.optional(v.union(
        v.literal("friendly"),
        v.literal("professional"),
        v.literal("technical")
      )),
      confidenceThreshold: v.optional(v.number()), // 0-100
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
    isBusiness: v.optional(v.boolean()),
    source: v.union(
      v.literal("plaid"),
      v.literal("manual"),
      v.literal("receipt"),
      v.literal("mock") // Mock transactions
    ),
    receiptUrl: v.optional(v.string()),
    receiptIds: v.optional(v.array(v.id("receipts"))),
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
    transactionId: v.optional(v.id("transactions_raw")),
    // UploadThing / storage metadata
    fileUrl: v.string(),         // public or signed URL from UploadThing
    fileKey: v.string(),         // UploadThing file key (for future deletes)
    originalFilename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    // Legacy field for backward compatibility
    storageUrl: v.optional(v.string()), // Deprecated: use fileUrl instead
    // Optional useful extras
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
    notes: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_transaction", ["transactionId"]),

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

  // Business Profiles
  business_profiles: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // User Addresses
  addresses: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("residential"),
      v.literal("business")
    ),
    streetAddress: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Professional Contacts
  professional_contacts: defineTable({
    userId: v.id("users"),
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
    fileUrl: v.optional(v.string()), // For uploaded documents
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "contactType"])
    .index("by_user_category", ["userId", "category"]),
});

