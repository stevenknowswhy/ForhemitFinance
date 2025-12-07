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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("disabled")
    )),
    isSuperAdmin: v.optional(v.boolean()), // Phase 2: Super admin flag
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
      // Custom categories created by user or AI
      customCategories: v.optional(v.array(v.string())),
    }),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Organizations (Phase 1: Multi-tenant)
  organizations: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("business"),
      v.literal("personal")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("trial"),
      v.literal("suspended"),
      v.literal("deleted")
    ),
    baseCurrency: v.string(),
    fiscalYearStart: v.optional(v.string()),
    accountingMethod: v.optional(v.union(v.literal("cash"), v.literal("accrual"))),
    lastActiveAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  // Memberships (Phase 1: User ↔ Org relationships)
  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("ORG_OWNER"),
      v.literal("ORG_ADMIN"),
      v.literal("BOOKKEEPER"),
      v.literal("VIEWER")
    ),
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("disabled")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_org", ["userId", "orgId"]),

  // Plans (Phase 1: Subscription plans)
  plans: defineTable({
    name: v.string(), // "starter", "pro", "enterprise"
    displayName: v.string(),
    limits: v.object({
      maxUsers: v.optional(v.number()),
      maxTransactions: v.optional(v.number()),
      features: v.array(v.string()), // ["ai_stories", "advanced_reports", etc.]
    }),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  // Subscriptions (Phase 1: Org subscriptions)
  subscriptions: defineTable({
    orgId: v.id("organizations"),
    planId: v.id("plans"),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("suspended")
    ),
    trialEndsAt: v.optional(v.number()),
    renewsAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["status"]),

  // Module Enablements (Module System: Org-level module enablement)
  module_enablements: defineTable({
    orgId: v.id("organizations"),
    moduleId: v.string(), // "stories", "reports", etc.
    enabled: v.boolean(),
    enabledBy: v.id("users"), // Who enabled it
    enabledAt: v.number(),
    // User-level overrides (array of user preferences)
    userOverrides: v.optional(v.array(v.object({
      userId: v.id("users"),
      enabled: v.boolean(),
    }))),
    metadata: v.optional(v.any()), // Module-specific config
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_module", ["moduleId"])
    .index("by_org_module", ["orgId", "moduleId"]),

  // Module Entitlements (Module System: Paid module access tracking)
  module_entitlements: defineTable({
    orgId: v.id("organizations"),
    moduleId: v.string(),
    planId: v.id("plans"), // Which plan includes this
    status: v.union(
      v.literal("active"),
      v.literal("trial"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    trialEndsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_module", ["orgId", "moduleId"]),

  // Audit Logs (Phase 1: Action tracking)
  audit_logs: defineTable({
    orgId: v.optional(v.id("organizations")), // Nullable for global/super actions
    actorUserId: v.id("users"),
    actorRole: v.optional(v.string()), // Role at time of action
    action: v.string(), // "ORG_UPDATED", "USER_INVITED", "SUBSCRIPTION_CHANGED", etc.
    targetType: v.optional(v.string()), // "organization", "user", "subscription", etc.
    targetId: v.optional(v.string()), // ID of the target
    metadata: v.optional(v.any()), // JSON snapshot of changes
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isImpersonation: v.optional(v.boolean()), // Phase 2: Impersonation flag
    impersonatedUserId: v.optional(v.id("users")), // Phase 2: Impersonated user
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_actor", ["actorUserId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),

  // Impersonation Sessions (Phase 2: Super admin impersonation)
  impersonation_sessions: defineTable({
    superAdminUserId: v.id("users"),
    impersonatedOrgId: v.id("organizations"),
    impersonatedUserId: v.optional(v.id("users")), // Optional: specific user persona
    impersonatedRole: v.string(), // Role to impersonate as
    sessionToken: v.string(), // Signed token for frontend
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_super_admin", ["superAdminUserId"])
    .index("by_org", ["impersonatedOrgId"]),

  // Plaid institutions
  institutions: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    lastError: v.optional(v.object({
      type: v.string(),
      code: v.string(),
      message: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_plaid_item", ["plaidItemId"]),

  // Accounts (bank accounts + chart of accounts)
  accounts: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
      v.literal("closed"),
      v.literal("pending_verification")
    )),
    isActive: v.optional(v.boolean()), // Legacy field for backward compatibility
    activatedAt: v.optional(v.number()),
    deactivatedAt: v.optional(v.number()),
    connectedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_org_type", ["orgId", "type"])
    .index("by_bank", ["bankId"]),

  // Raw transactions from Plaid
  transactions_raw: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    plaidTransactionId: v.optional(v.string()),
    accountId: v.id("accounts"),
    amount: v.number(),
    currency: v.string(),
    date: v.string(), // ISO date string
    merchant: v.optional(v.string()),
    category: v.optional(v.array(v.string())),
    plaidCategory: v.optional(v.array(v.string())),
    description: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("posted"),
      v.literal("cleared"),
      v.literal("reconciled"),
      v.literal("scheduled")
    )), // Made optional for backward compatibility with existing data
    isPending: v.optional(v.boolean()), // Legacy field for backward compatibility
    postedAt: v.optional(v.number()), // Timestamp when moved from pending to posted
    clearedAt: v.optional(v.number()), // Timestamp when cleared
    reconciledAt: v.optional(v.number()), // Timestamp when reconciled
    isBusiness: v.optional(v.boolean()),
    source: v.union(
      v.literal("plaid"),
      v.literal("manual"),
      v.literal("receipt"),
      v.literal("mock") // Mock transactions
    ),
    receiptUrl: v.optional(v.string()),
    receiptIds: v.optional(v.array(v.id("receipts"))),
    // Entry mode: simple or advanced (itemized)
    entryMode: v.optional(v.union(
      v.literal("simple"),
      v.literal("advanced")
    )),
    // Double entry accounts for simple mode
    debitAccountId: v.optional(v.id("accounts")),
    creditAccountId: v.optional(v.id("accounts")),
    // Line items for advanced/itemized transactions
    lineItems: v.optional(v.array(v.object({
      description: v.string(),
      category: v.optional(v.string()),
      amount: v.number(),
      tax: v.optional(v.number()),
      tip: v.optional(v.number()),
      // Double entry accounts for each line item
      debitAccountId: v.optional(v.id("accounts")),
      creditAccountId: v.optional(v.id("accounts")),
    }))),
    // Mock transaction fields
    transactionId: v.optional(v.string()), // Unique transaction ID for mock
    transactionType: v.optional(v.union(
      v.literal("debit"),
      v.literal("credit")
    )),
    merchantName: v.optional(v.string()),
    categoryName: v.optional(v.string()), // Single category name for mock
    removedAt: v.optional(v.number()), // Timestamp when removed (null = not removed)
    location: v.optional(v.object({
      city: v.string(),
      state: v.string(),
    })),
    dateTimestamp: v.optional(v.number()), // Numeric timestamp for sorting/filtering
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_account", ["accountId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_org_date", ["orgId", "date"])
    .index("by_plaid_id", ["plaidTransactionId"])
    .index("by_date", ["userId", "dateTimestamp"]),

  // Proposed entries (waiting for approval)
  entries_proposed: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_org_status", ["orgId", "status"])
    .index("by_transaction", ["transactionId"]),

  // Final approved entries
  entries_final: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_org_date", ["orgId", "date"]),

  // Entry lines (debits/credits)
  entry_lines: defineTable({
    entryId: v.id("entries_final"),
    accountId: v.id("accounts"),
    // Denormalized fields for reporting performance
    userId: v.optional(v.id("users")), // Made optional for migration, will be required later
    date: v.optional(v.number()),      // Made optional for migration, will be required later
    side: v.union(
      v.literal("debit"),
      v.literal("credit")
    ),
    amount: v.number(),
    currency: v.string(),
  })
    .index("by_entry", ["entryId"])
    .index("by_account", ["accountId"])
    .index("by_user_account_date", ["userId", "accountId", "date"]),

  // Receipts
  receipts: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_transaction", ["transactionId"]),

  // Financial goals
  goals: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_org_status", ["orgId", "status"]),

  // Budgets
  budgets: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_category", ["categoryId"]),

  // AI insights and narratives
  ai_insights: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
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
    .index("by_org", ["orgId"])
    .index("by_user_period", ["userId", "period"])
    .index("by_org_period", ["orgId", "period"]),

  // AI Stories (Phase 2)
  ai_stories: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    storyType: v.union(
      v.literal("company"),
      v.literal("banker"),
      v.literal("investor")
    ),
    periodType: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annually")
    ),
    periodStart: v.number(), // Timestamp
    periodEnd: v.number(), // Timestamp
    title: v.string(),
    narrative: v.optional(v.string()), // Full AI-generated narrative (optional for pending stories)
    summary: v.optional(v.string()), // Short summary for card preview (optional for pending stories)
    generationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    generationError: v.optional(v.string()),
    keyMetrics: v.object({
      // Story-specific metrics (flexible object for different story types)
      revenue: v.optional(v.number()),
      expenses: v.optional(v.number()),
      netIncome: v.optional(v.number()),
      burnRate: v.optional(v.number()),
      runway: v.optional(v.number()),
      cashFlow: v.optional(v.number()),
      startingCash: v.optional(v.number()),
      endingCash: v.optional(v.number()),
      debtToIncome: v.optional(v.number()),
      debtToRevenue: v.optional(v.number()),
      growthRate: v.optional(v.number()),
      revenueGrowth: v.optional(v.number()), // Revenue growth percentage
      ltvCac: v.optional(v.number()),
      churn: v.optional(v.number()),
      retention: v.optional(v.number()),
      topExpenseCategory: v.optional(v.string()), // Top expense category name
      // Additional metrics can be added as needed
    }),
    userNotes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())), // URLs or file references
    version: v.number(), // Track edits
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_storyType", ["userId", "storyType"])
    .index("by_org_storyType", ["orgId", "storyType"])
    .index("by_user_period", ["userId", "periodType", "periodStart"])
    .index("by_org_period", ["orgId", "periodType", "periodStart"]),
  // Notifications (for background job completion)
  notifications: defineTable({
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("story_complete"),
      v.literal("story_failed"),
      v.literal("report_complete"),
      v.literal("report_failed")
    ),
    title: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("unread"),
      v.literal("read")
    ),
    metadata: v.optional(v.any()), // Story ID, report type, etc.
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),

  // Business Profiles
  business_profiles: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    // Business Branding
    businessIcon: v.optional(v.string()), // URL to uploaded business/website icon for reports
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
    // Certifications - structured array with dates and metadata
    certifications: v.optional(v.array(v.object({
      type: v.union(
        v.literal("8a"),
        v.literal("wosb"),
        v.literal("mbe"),
        v.literal("dbe"),
        v.literal("hubzone"),
        v.literal("gdpr"),
        v.literal("ccpa"),
        v.literal("iso")
      ),
      obtainedAt: v.number(), // Timestamp when certification was obtained
      expiresAt: v.optional(v.number()), // Timestamp when certification expires (if applicable)
      certificateNumber: v.optional(v.string()), // Certificate number or reference
      notes: v.optional(v.string()), // Additional notes (e.g., ISO certification details)
    }))),
    // Legacy fields - kept for backward compatibility during migration
    cert8a: v.optional(v.boolean()),
    certWosb: v.optional(v.boolean()),
    certMbe: v.optional(v.boolean()),
    isoCertifications: v.optional(v.string()),
    gdprCompliant: v.optional(v.boolean()),
    ccpaCompliant: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"]),

  // User Addresses
  addresses: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    type: v.union(
      v.literal("residential"),
      v.literal("business")
    ),
    streetAddress: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    setAsDefaultAt: v.optional(v.number()), // Timestamp when set as default (null = not default)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_org_type", ["orgId", "type"]),

  // Professional Contacts
  professional_contacts: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    contactType: v.string(),
    category: v.optional(v.string()),
    name: v.string(),
    firmCompany: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    setAsPrimaryAt: v.optional(v.number()), // Timestamp when set as primary (null = not primary)
    tags: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()), // For uploaded documents
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_type", ["userId", "contactType"])
    .index("by_org_type", ["orgId", "contactType"]),

  // Mileage Tracking (Core Product)
  mileage: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    date: v.number(),
    startLocation: v.optional(v.string()),
    endLocation: v.optional(v.string()),
    distance: v.number(),
    distanceUnit: v.union(v.literal("miles"), v.literal("km")),
    purpose: v.string(), // "Client Meeting", "Supply Run", etc.
    description: v.optional(v.string()), // Detail notes
    vehicle: v.optional(v.string()), // "Tesla Model 3", "Ford F-150"
    rate: v.optional(v.number()), // Tax deduction rate per unit
    amount: v.number(), // Calculated deduction value
    isRoundTrip: v.optional(v.boolean()),
    status: v.union(
      v.literal("active"),
      v.literal("archived")
    ),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_date", ["date"])
    .index("by_org_date", ["orgId", "date"]),



  // Knowledge Base for AI Learning
  categorization_knowledge: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    // Pattern matching
    merchant: v.optional(v.string()), // Merchant name pattern
    description: v.optional(v.string()), // Description pattern
    // User corrections
    originalCategory: v.optional(v.string()), // What AI suggested
    correctedCategory: v.string(), // What user changed it to
    originalDebitAccountId: v.optional(v.id("accounts")), // What AI suggested
    correctedDebitAccountId: v.optional(v.id("accounts")), // What user changed it to
    originalCreditAccountId: v.optional(v.id("accounts")), // What AI suggested
    correctedCreditAccountId: v.optional(v.id("accounts")), // What user changed it to
    // Additional context
    userDescription: v.optional(v.string()), // Additional description user provided
    // Metadata
    transactionType: v.union(v.literal("expense"), v.literal("income")),
    isBusiness: v.boolean(),
    confidence: v.optional(v.number()), // AI confidence when correction was made
    usageCount: v.number(), // How many times this pattern has been used
    lastUsedAt: v.number(), // Last time this pattern was applied
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_merchant", ["userId", "merchant"])
    .index("by_org_merchant", ["orgId", "merchant"])
    .index("by_user_category", ["userId", "correctedCategory"])
    .index("by_org_category", ["orgId", "correctedCategory"]),

  // Reset Events (Audit Log) - Legacy, use audit_logs for new entries
  reset_events: defineTable({
    userId: v.id("users"), // Keep for backward compatibility
    orgId: v.optional(v.id("organizations")), // Phase 1: Add orgId
    resetType: v.union(
      v.literal("transactions_only"),
      v.literal("factory_reset")
    ),
    performedAt: v.number(),
    performedBy: v.id("users"), // Usually same as userId, but allows for admin resets in future
    metadata: v.optional(v.object({
      transactionsDeleted: v.optional(v.number()),
      accountsDeleted: v.optional(v.number()),
      entriesDeleted: v.optional(v.number()),
      otherDataDeleted: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "resetType"])
    .index("by_performed_at", ["performedAt"]),

  // Add-ons (Micro Add-On System: Catalog)
  addons: defineTable({
    // Core identification
    slug: v.string(), // Unique identifier (e.g., "investor-story-pack")
    name: v.string(),
    shortDescription: v.string(),
    longDescription: v.string(),

    // Categorization
    category: v.union(
      v.literal("stories"),
      v.literal("reports"),
      v.literal("industry_pack"),
      v.literal("stage_pack"),
      v.literal("bundle")
    ),

    // Pricing
    isFree: v.boolean(),
    supportsTrial: v.boolean(),
    trialDurationDays: v.optional(v.number()), // e.g., 14

    // Stripe integration (nullable for free add-ons)
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()), // Base price
    priceAmount: v.optional(v.number()), // In cents
    priceCurrency: v.optional(v.string()), // "usd"

    // Versioning
    version: v.string(), // Semantic versioning
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("hidden"), // Active but not shown in marketplace
      v.literal("deprecated")
    ),

    // UI placement
    uiPlacement: v.object({
      section: v.string(), // "insights", "reports", etc.
      label: v.string(), // Display name in UI
      icon: v.optional(v.string()), // Icon name
    }),

    // Configuration schema (JSON schema for Super Admin config)
    configSchema: v.optional(v.any()),

    // Metadata
    metadata: v.optional(v.any()), // Flexible for add-on-specific data

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["status", "category"],
    }),

  // Org Add-ons (Micro Add-On System: Entitlements)
  org_addons: defineTable({
    orgId: v.id("organizations"),
    addonId: v.id("addons"),

    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("revoked")
    ),

    source: v.union(
      v.literal("free"),
      v.literal("paid"),
      v.literal("promo"),
      v.literal("trial")
    ),

    // Trial tracking
    trialEnd: v.optional(v.number()), // Timestamp when trial ends

    // Purchase tracking
    purchasedAt: v.optional(v.number()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),

    // Payment status tracking
    lastPaymentStatus: v.optional(v.union(
      v.literal("succeeded"),
      v.literal("requires_payment_method"),
      v.literal("canceled"),
      v.literal("failed")
    )),

    // Discount/promotion tracking
    promotionId: v.optional(v.id("pricing_campaigns")), // If purchased with discount

    // Decline tracking (prevents re-offering declined discounts)
    declinedOnboardingOfferAt: v.optional(v.number()),
    declinedPreTrialOfferAt: v.optional(v.number()),

    // Metadata
    metadata: v.optional(v.any()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_addon", ["addonId"])
    .index("by_org_addon", ["orgId", "addonId"])
    .index("by_status", ["status"]),

  // Pricing Campaigns (Micro Add-On System: Discounts)
  pricing_campaigns: defineTable({
    addonId: v.id("addons"),
    name: v.string(), // e.g., "Onboarding 50% Off", "Pre-Trial 30% Off"
    type: v.union(
      v.literal("onboarding"),
      v.literal("pre_trial_end")
    ),

    // Discount configuration
    discountType: v.union(
      v.literal("percentage"), // e.g., 50 = 50% off
      v.literal("fixed") // e.g., 1000 = $10.00 off (in cents)
    ),
    discountValue: v.number(), // Percentage or fixed amount in cents

    // Timing window (relative to org lifecycle events)
    startsRelativeTo: v.union(
      v.literal("signup"), // Days since org creation
      v.literal("trialStart"), // Days since trial started
      v.literal("trialEnd") // Days before/after trial end
    ),
    offsetDaysStart: v.number(), // Start of eligibility window (e.g., -3 = 3 days before)
    offsetDaysEnd: v.number(), // End of eligibility window (e.g., 0 = at event)

    // Eligibility rules (JSON schema)
    eligibilityRules: v.optional(v.object({
      companyTypes: v.optional(v.array(v.string())), // e.g., ["saas", "creator"]
      subscriptionTiers: v.optional(v.array(v.string())), // e.g., ["solo", "light"]
      requireDeclined: v.optional(v.boolean()), // Only show if not previously declined
    })),

    // Stripe integration
    stripeCouponId: v.optional(v.string()), // If using Stripe Coupons
    stripePriceId: v.optional(v.string()), // If using separate discounted Price

    // Status
    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_addon", ["addonId"])
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Story Templates (Micro Add-On System: Story Add-On Templates)
  story_templates: defineTable({
    addonId: v.optional(v.id("addons")), // Made optional - can be null for core templates
    title: v.string(),
    slug: v.string(),
    storyType: v.union(
      v.literal("company"),
      v.literal("banker"),
      v.literal("investor")
    ),
    // Period type for the template
    periodType: v.union(
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    // Story generation configuration (migrated from frontend storyConfig.ts)
    subtitle: v.optional(v.string()), // e.g., "Internal compass - burn rate, trends, cash runway"
    role: v.optional(v.string()), // e.g., "Chief Financial Officer"
    systemPrompt: v.string(), // Full AI system prompt for story generation
    dataRequirements: v.array(v.string()), // Required data fields for story generation
    focuses: v.array(v.string()), // Focus areas for the story
    tone: v.optional(v.string()), // e.g., "Direct, actionable, focused on operational sustainability"
    exampleOpening: v.optional(v.string()), // Example opening paragraph
    icon: v.optional(v.string()), // Icon name (e.g., "BookOpen", "Building2", "TrendingUp")
    // Metric calculation hints
    keyMetricsToCalculate: v.optional(v.array(v.string())), // e.g., ["burnRate", "runway", "cashFlow"]
    // Legacy fields (kept for backward compatibility)
    templateBody: v.optional(v.string()), // Template with variable placeholders
    variables: v.optional(v.array(v.string())), // List of available variables
    config: v.optional(v.any()),
    industry: v.optional(v.string()),
    stage: v.optional(v.string()),
    // Ordering and visibility
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_addon", ["addonId"])
    .index("by_story_type", ["storyType"])
    .index("by_story_type_period", ["storyType", "periodType"]),

  // Report Templates (Micro Add-On System: Report Add-On Templates)
  report_templates: defineTable({
    addonId: v.id("addons"),
    title: v.string(),
    slug: v.string(),
    reportType: v.string(), // "profit-loss", "balance-sheet", etc.
    config: v.object({
      metrics: v.array(v.string()),
      description: v.optional(v.string()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      category: v.optional(v.string()),
      filters: v.optional(v.any()),
      layout: v.optional(v.any()),
    }),
    industry: v.optional(v.string()),
    stage: v.optional(v.string()),
    order: v.optional(v.number()), // GAP-007: Display order for reports
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_addon", ["addonId"])
    .index("by_report_type", ["reportType"]),

  // Vendors (Bill Pay)
  vendors: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    defaultCategoryId: v.optional(v.id("accounts")),
    defaultPaymentAccountId: v.optional(v.id("accounts")),
    metadata: v.optional(v.any()), // JSON storage for extra fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_name", ["orgId", "name"]),

  // Bills (Bill Pay)
  bills: defineTable({
    orgId: v.id("organizations"),
    vendorId: v.id("vendors"),
    amount: v.number(),
    currency: v.string(), // "USD"
    dueDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("scheduled"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    frequency: v.union(
      v.literal("one_time"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    autoPay: v.boolean(),
    paymentAccountId: v.optional(v.id("accounts")), // Source of funds
    transactionId: v.optional(v.id("transactions_raw")), // Link to paid transaction
    // Accounting
    glDebitAccountId: v.optional(v.id("accounts")), // Expense account
    glCreditAccountId: v.optional(v.id("accounts")), // AP or Bank account
    // Metadata
    notes: v.optional(v.string()),
    attachmentUrls: v.optional(v.array(v.string())),
    createdByUserId: v.id("users"),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_vendor", ["vendorId"])
    .index("by_status", ["status"])
    .index("by_org_status", ["orgId", "status"])
    .index("by_due_date", ["dueDate"]),

  // Subscriptions (Bill Pay)
  subscriptions_billpay: defineTable({
    orgId: v.id("organizations"),
    vendorId: v.id("vendors"),
    name: v.string(), // e.g. "Pro Plan"
    amount: v.number(),
    currency: v.string(),
    interval: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("custom")
    ),
    nextRunDate: v.number(),
    lastRunDate: v.optional(v.number()),
    isActive: v.boolean(),
    defaultCategoryId: v.optional(v.id("accounts")),
    defaultPaymentAccountId: v.optional(v.id("accounts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_vendor", ["vendorId"])
    .index("by_active", ["isActive"]),

  // Business Type Configurations (GAP-002: Move from hardcoded onboarding)
  business_type_configs: defineTable({
    slug: v.string(), // e.g., "creator", "tradesperson", "wellness"
    displayName: v.string(), // Human-readable name
    description: v.optional(v.string()), // Extended description
    defaultAccountTemplate: v.optional(v.string()), // Template ID for default chart of accounts
    defaultCategories: v.optional(v.array(v.string())), // Default categories for this business type
    recommendedAddons: v.optional(v.array(v.id("addons"))), // Recommended addons
    icon: v.optional(v.string()), // Icon name
    order: v.number(), // Display order
    isActive: v.boolean(), // Whether to show in onboarding
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_slug", ["slug"]),

  // Default Category Sets (GAP-003: Move from hardcoded CategorySelector)
  default_category_sets: defineTable({
    name: v.string(), // e.g., "General", "Creator", "Tradesperson"
    categories: v.array(v.string()), // Array of category names
    businessTypes: v.optional(v.array(v.string())), // Business types this set applies to, null = all
    isDefault: v.boolean(), // Whether this is the default fallback set
    order: v.optional(v.number()), // Display order of categories
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_default", ["isDefault"]),

  // ==========================================
  // CORE PRODUCT: Invoices (Simple Invoicing)
  // ==========================================
  invoices: defineTable({
    orgId: v.id("organizations"),
    customerId: v.optional(v.id("vendors")), // Re-use vendors for customers
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    invoiceNumber: v.string(), // e.g., "INV-001"
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("void")
    ),
    issueDate: v.number(),
    dueDate: v.number(),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      amount: v.number(),
      taxRate: v.optional(v.number()),
    })),
    subtotal: v.number(),
    taxAmount: v.optional(v.number()),
    total: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    // Link to paid transaction
    paidTransactionId: v.optional(v.id("transactions_raw")),
    paidAt: v.optional(v.number()),
    // Metadata
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"])
    .index("by_customer", ["customerId"])
    .index("by_due_date", ["dueDate"]),

  // ==========================================
  // ADD-ON MODULE: Projects (Project Profitability)
  // ==========================================
  projects: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    clientId: v.optional(v.id("vendors")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("cancelled")
    ),
    budgetAmount: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()), // For UI tagging
    description: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"])
    .index("by_client", ["clientId"]),

  // Junction table for project-transaction relationships
  project_transactions: defineTable({
    projectId: v.id("projects"),
    transactionId: v.id("transactions_raw"),
    allocatedAmount: v.optional(v.number()), // For partial allocation
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_transaction", ["transactionId"]),

  // ==========================================
  // ADD-ON MODULE: Time Tracking
  // ==========================================
  time_entries: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    description: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    durationMinutes: v.number(),
    hourlyRate: v.optional(v.number()),
    isBillable: v.boolean(),
    status: v.union(v.literal("running"), v.literal("stopped")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_org_user", ["orgId", "userId"]),

  // ==========================================
  // ADD-ON MODULE: Contractor Management
  // ==========================================
  contractors: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    taxId: v.optional(v.string()), // W-9 / SSN (should be encrypted in production)
    address: v.optional(v.string()),
    defaultRate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive")
    ),
    isW9OnFile: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"]),
});
