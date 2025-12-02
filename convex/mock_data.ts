/**
 * Mock Data Generation
 * Generates 3 months of business and personal transactions with proper double-entry accounting
 */

import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Personal accounts template
const PERSONAL_ACCOUNTS = {
  assets: [
    { name: "Personal Checking", type: "asset" as const, isBusiness: false },
    { name: "Personal Savings", type: "asset" as const, isBusiness: false },
  ],
  liabilities: [
    { name: "Personal Credit Card", type: "liability" as const, isBusiness: false },
  ],
  income: [
    { name: "Salary", type: "income" as const, isBusiness: false },
    { name: "Other Income", type: "income" as const, isBusiness: false },
  ],
  expenses: [
    { name: "Groceries", type: "expense" as const, isBusiness: false },
    { name: "Restaurants", type: "expense" as const, isBusiness: false },
    { name: "Gas", type: "expense" as const, isBusiness: false },
    { name: "Entertainment", type: "expense" as const, isBusiness: false },
    { name: "Shopping", type: "expense" as const, isBusiness: false },
    { name: "Utilities", type: "expense" as const, isBusiness: false },
    { name: "Healthcare", type: "expense" as const, isBusiness: false },
    { name: "Transportation", type: "expense" as const, isBusiness: false },
  ],
};

// Business transaction categories
const BUSINESS_CATEGORIES = [
  { name: "Revenue", merchants: ["Client Payment", "Invoice Payment", "Service Revenue"], avgAmount: 2500, isIncome: true },
  { name: "Service Revenue", merchants: ["Consulting Fee", "Project Payment", "Retainer"], avgAmount: 1500, isIncome: true },
  { name: "Product Sales", merchants: ["Product Sale", "Online Sale", "Wholesale"], avgAmount: 500, isIncome: true },
  { name: "Office Supplies", merchants: ["Staples", "Office Depot", "Amazon Business"], avgAmount: 75, isIncome: false },
  { name: "Software & Subscriptions", merchants: ["Adobe", "Microsoft", "Slack", "Zoom"], avgAmount: 120, isIncome: false },
  { name: "Marketing & Advertising", merchants: ["Google Ads", "Facebook Ads", "LinkedIn Ads"], avgAmount: 500, isIncome: false },
  { name: "Meals & Entertainment", merchants: ["Restaurant", "Catering", "Client Dinner"], avgAmount: 85, isIncome: false },
  { name: "Travel", merchants: ["Airline", "Hotel", "Uber Business"], avgAmount: 350, isIncome: false },
  { name: "Professional Services", merchants: ["Legal Services", "Accounting", "Consulting"], avgAmount: 400, isIncome: false },
  { name: "Rent", merchants: ["Office Rent", "Co-working Space"], avgAmount: 2000, isIncome: false },
  { name: "Utilities", merchants: ["Electric", "Internet", "Phone"], avgAmount: 200, isIncome: false },
  { name: "Insurance", merchants: ["Business Insurance", "Liability Insurance"], avgAmount: 300, isIncome: false },
];

// Personal transaction categories
const PERSONAL_CATEGORIES = [
  { name: "Salary", merchants: ["Payroll Deposit", "Direct Deposit", "Salary"], avgAmount: 4500, isIncome: true },
  { name: "Other Income", merchants: ["Freelance", "Side Hustle", "Investment"], avgAmount: 500, isIncome: true },
  { name: "Groceries", merchants: ["Whole Foods", "Trader Joe's", "Safeway", "Kroger"], avgAmount: 85, isIncome: false },
  { name: "Restaurants", merchants: ["Chipotle", "Starbucks", "McDonald's", "Subway"], avgAmount: 28, isIncome: false },
  { name: "Gas", merchants: ["Shell", "Chevron", "BP", "Exxon"], avgAmount: 55, isIncome: false },
  { name: "Entertainment", merchants: ["Netflix", "Spotify", "AMC Theaters", "iTunes"], avgAmount: 40, isIncome: false },
  { name: "Shopping", merchants: ["Amazon", "Target", "Walmart", "Costco"], avgAmount: 130, isIncome: false },
  { name: "Utilities", merchants: ["PG&E", "Comcast", "AT&T", "Water District"], avgAmount: 160, isIncome: false },
  { name: "Healthcare", merchants: ["CVS Pharmacy", "Walgreens", "Kaiser", "LabCorp"], avgAmount: 90, isIncome: false },
  { name: "Transportation", merchants: ["Uber", "Lyft", "BART", "Parking"], avgAmount: 35, isIncome: false },
];

const CITIES = [
  { city: "San Francisco", state: "CA" },
  { city: "New York", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Chicago", state: "IL" },
  { city: "Austin", state: "TX" },
];

/**
 * Create personal accounts if they don't exist
 */
async function ensurePersonalAccounts(
  ctx: any,
  userId: Id<"users">
): Promise<Record<string, Id<"accounts">>> {
  const existingAccounts = await ctx.db
    .query("accounts")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const accountMap: Record<string, Id<"accounts">> = {};
  const existingNames = new Set(existingAccounts.map((a: any) => a.name));

  // Create all personal accounts
  for (const account of [
    ...PERSONAL_ACCOUNTS.assets,
    ...PERSONAL_ACCOUNTS.liabilities,
    ...PERSONAL_ACCOUNTS.income,
    ...PERSONAL_ACCOUNTS.expenses,
  ]) {
    if (!existingNames.has(account.name)) {
      const accountId = await ctx.db.insert("accounts", {
        userId,
        name: account.name,
        type: account.type,
        isBusiness: account.isBusiness,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      accountMap[account.name] = accountId;
    } else {
      const existing = existingAccounts.find((a: any) => a.name === account.name);
      if (existing) {
        accountMap[account.name] = existing._id;
      }
    }
  }

  return accountMap;
}

/**
 * Find account by name and type
 */
function findAccount(
  accounts: any[],
  name: string,
  type?: string
): any | undefined {
  return accounts.find(
    (a: any) => a.name === name && (type === undefined || a.type === type)
  );
}

/**
 * Find account by category name (fuzzy match)
 */
function findAccountByCategory(
  accounts: any[],
  accountType: string,
  categoryNames: string[],
  isBusiness: boolean
): any | undefined {
  // Try exact match first
  for (const categoryName of categoryNames) {
    const exact = accounts.find(
      (a: any) =>
        a.type === accountType &&
        a.isBusiness === isBusiness &&
        a.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (exact) return exact;
  }

  // Try partial match
  for (const categoryName of categoryNames) {
    const partial = accounts.find(
      (a: any) =>
        a.type === accountType &&
        a.isBusiness === isBusiness &&
        a.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    if (partial) return partial;
  }

  // Fallback to first account of type
  return accounts.find(
    (a: any) => a.type === accountType && a.isBusiness === isBusiness
  );
}

/**
 * Generate double-entry suggestion for a transaction
 */
function suggestDoubleEntry(
  transaction: {
    amount: number;
    category: string;
    isBusiness: boolean;
    description: string;
  },
  accounts: any[]
): { debitAccountId: Id<"accounts">; creditAccountId: Id<"accounts"> } | null {
  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  // Find bank account (checking preferred)
  const bankAccount = accounts.find(
    (a: any) =>
      a.type === "asset" &&
      a.isBusiness === transaction.isBusiness &&
      a.name.toLowerCase().includes("checking")
  ) ||
    accounts.find(
      (a: any) => a.type === "asset" && a.isBusiness === transaction.isBusiness
    );

  if (!bankAccount) {
    return null;
  }

  if (isIncome) {
    // Income: Debit asset (bank), Credit income account
    const incomeAccount = findAccountByCategory(
      accounts,
      "income",
      [transaction.category],
      transaction.isBusiness
    );

    if (incomeAccount) {
      return {
        debitAccountId: bankAccount._id,
        creditAccountId: incomeAccount._id,
      };
    }
  } else if (isExpense) {
    // Expense: Debit expense account, Credit asset (bank) or liability (credit card)
    const expenseAccount = findAccountByCategory(
      accounts,
      "expense",
      [transaction.category],
      transaction.isBusiness
    );

    // Prefer credit card for expenses if available
    const creditCardAccount = accounts.find(
      (a: any) =>
        a.type === "liability" &&
        a.isBusiness === transaction.isBusiness &&
        a.name.toLowerCase().includes("credit")
    );

    const creditAccount = creditCardAccount || bankAccount;

    if (expenseAccount) {
      return {
        debitAccountId: expenseAccount._id,
        creditAccountId: creditAccount._id,
      };
    }
  }

  return null;
}

/**
 * Generate date ranges for mock data generation.
 * Ports logic from scripts/generate-mock-data.py
 */
function generateDateRanges(
  months: number = 3,
  includeBusinessHours: boolean = true,
  includePersonalHours: boolean = true
) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - months * 30);

  const dates: any[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= now) {
    // Business hours: 9 AM - 5 PM (9:00 - 17:00)
    // Personal hours: 6 AM - 11 PM (6:00 - 23:00)

    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // Adjust to match Python's weekday() where 0=Monday, 6=Sunday if needed, 
    // but standard JS getDay() is fine as long as we check for Sat/Sun correctly.
    // JS: 0=Sun, 6=Sat. Python: 0=Mon, 6=Sun.
    // We'll stick to JS standard: Weekend is 0 (Sun) or 6 (Sat).

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let businessHours: number[] = [];
    // Business transactions: Monday-Friday (1-5), 9 AM - 5 PM
    if (includeBusinessHours && !isWeekend) {
      businessHours = Array.from({ length: 8 }, (_, i) => i + 9); // 9, 10, ... 16
    }

    let personalHours: number[] = [];
    // Personal transactions: All days, 6 AM - 11 PM
    if (includePersonalHours) {
      personalHours = Array.from({ length: 17 }, (_, i) => i + 6); // 6, 7, ... 22
    }

    dates.push({
      date: currentDate.toISOString().split("T")[0],
      timestamp: currentDate.getTime(),
      dayOfWeek,
      isWeekend,
      businessHours,
      personalHours,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Generate specific transaction time for a given date info
 */
function generateTransactionTime(
  dateInfo: any,
  transactionType: "business" | "personal" | "mixed"
): Date {
  const baseDate = new Date(dateInfo.timestamp);
  let hour: number | undefined;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  if (transactionType === "business") {
    if (dateInfo.businessHours.length > 0) {
      hour = dateInfo.businessHours[Math.floor(Math.random() * dateInfo.businessHours.length)];
    }
  } else if (transactionType === "personal") {
    if (dateInfo.personalHours.length > 0) {
      hour = dateInfo.personalHours[Math.floor(Math.random() * dateInfo.personalHours.length)];
    }
  } else {
    // Mixed
    if (!dateInfo.isWeekend && dateInfo.businessHours.length > 0) {
      // 70% business hours on weekdays
      if (Math.random() < 0.7) {
        hour = dateInfo.businessHours[Math.floor(Math.random() * dateInfo.businessHours.length)];
      } else {
        hour = dateInfo.personalHours[Math.floor(Math.random() * dateInfo.personalHours.length)];
      }
    } else {
      // Weekend or no business hours
      if (dateInfo.personalHours.length > 0) {
        hour = dateInfo.personalHours[Math.floor(Math.random() * dateInfo.personalHours.length)];
      }
    }
  }

  // Fallback
  if (hour === undefined) {
    hour = Math.floor(Math.random() * (23 - 6 + 1)) + 6; // 6 AM to 11 PM
  }

  baseDate.setHours(hour, minute, second, 0);
  return baseDate;
}

/**
 * Generate transactions and create double-entry entries
 */
async function generateTransactionsAndEntries(
  ctx: any,
  args: {
    userId: Id<"users">;
    accountIds: Id<"accounts">[];
    categories: typeof BUSINESS_CATEGORIES | typeof PERSONAL_CATEGORIES;
    isBusiness: boolean;
    daysBack: number;
  }
): Promise<{
  transactionsGenerated: number;
  entriesCreated: number;
}> {
  let transactionCount = 0;
  let entryCount = 0;

  // Get all accounts for this user
  const allAccounts = await ctx.db
    .query("accounts")
    .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
    .collect();

  const relevantAccounts = allAccounts.filter(
    (a: any) => a.isBusiness === args.isBusiness
  );

  // Generate date ranges with realistic hours
  const dateRanges = generateDateRanges(
    Math.ceil(args.daysBack / 30), // approx months
    args.isBusiness, // include business hours if generating business data
    !args.isBusiness // include personal hours if generating personal data
  );

  // Filter to requested daysBack
  const cutoffTime = Date.now() - args.daysBack * 24 * 60 * 60 * 1000;
  const activeDates = dateRanges.filter((d) => d.timestamp >= cutoffTime);

  for (const accountId of args.accountIds) {
    const account = await ctx.db.get(accountId);
    if (!account || account.isBusiness !== args.isBusiness) continue;

    // Generate transactions for each day
    for (const dateInfo of activeDates) {
      // Vary transaction frequency: 0-4 per day (slightly lower than before to avoid clutter)
      // Higher chance of 0 transactions on weekends for business
      let maxTransactions = 4;
      if (args.isBusiness && dateInfo.isWeekend) maxTransactions = 1;
      
      const numTransactions = Math.floor(Math.random() * (maxTransactions + 1));

      for (let i = 0; i < numTransactions; i++) {
        const category =
          args.categories[
            Math.floor(Math.random() * args.categories.length)
          ];
        
        // 10% pending for very recent transactions (last 2 days)
        const isRecent = (Date.now() - dateInfo.timestamp) < 2 * 24 * 60 * 60 * 1000;
        const isPending = isRecent && Math.random() < 0.1;
        const status = isPending ? "pending" : "posted";
        const now = Date.now();

        // Calculate transaction time
        const transactionDateObj = generateTransactionTime(
          dateInfo,
          args.isBusiness ? "business" : "personal"
        );
        
        const transactionDate = transactionDateObj.getTime();

        // Calculate amount with variance
        const variance = 0.3;
        const baseAmount = category.avgAmount;
        const amount =
          baseAmount * (1 + (Math.random() * variance * 2 - variance));
        const roundedAmount = Math.round(amount * 100) / 100;
        const signedAmount = category.isIncome
          ? roundedAmount
          : -roundedAmount;

        const merchant =
          category.merchants[
            Math.floor(Math.random() * category.merchants.length)
          ];
        const location = CITIES[Math.floor(Math.random() * CITIES.length)];

        // Create transaction_raw
        const transactionId = await ctx.db.insert("transactions_raw", {
          userId: args.userId,
          accountId,
          transactionId: `mock_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          amount: signedAmount,
          currency: "USD",
          date: transactionDateObj.toISOString().split("T")[0],
          dateTimestamp: transactionDate,
          description: `${merchant} - ${location.city}`,
          merchant: merchant,
          merchantName: merchant,
          category: [category.name],
          categoryName: category.name,
          status: status,
          postedAt: status === "posted" ? now : undefined,
          isBusiness: args.isBusiness,
          source: "mock",
          transactionType: category.isIncome ? "credit" : "debit",
          location: {
            city: location.city,
            state: location.state,
          },
          createdAt: Date.now(),
        });

        transactionCount++;

        // Generate double-entry suggestion
        const entrySuggestion = suggestDoubleEntry(
          {
            amount: signedAmount,
            category: category.name,
            isBusiness: args.isBusiness,
            description: `${merchant} - ${location.city}`,
          },
          relevantAccounts
        );

        if (entrySuggestion) {
          // Create entries_proposed
          const proposedEntryId = await ctx.db.insert("entries_proposed", {
            userId: args.userId,
            transactionId,
            date: transactionDate,
            memo: `${merchant} - ${location.city}`,
            debitAccountId: entrySuggestion.debitAccountId,
            creditAccountId: entrySuggestion.creditAccountId,
            amount: roundedAmount,
            currency: "USD",
            confidence: 0.9,
            source: "ai_model",
            explanation: `Auto-generated from ${category.name} transaction`,
            isBusiness: args.isBusiness,
            status: "pending",
            createdAt: Date.now(),
          });

          // Auto-approve and create entries_final
          const finalEntryId = await ctx.db.insert("entries_final", {
            userId: args.userId,
            date: transactionDate,
            memo: `${merchant} - ${location.city}`,
            source: "manual",
            status: "posted",
            createdAt: Date.now(),
            approvedAt: Date.now(),
            approvedBy: args.userId,
          });

          // Create entry_lines (debit and credit)
          await ctx.db.insert("entry_lines", {
            entryId: finalEntryId,
            accountId: entrySuggestion.debitAccountId,
            side: "debit",
            amount: roundedAmount,
            currency: "USD",
          });

          await ctx.db.insert("entry_lines", {
            entryId: finalEntryId,
            accountId: entrySuggestion.creditAccountId,
            side: "credit",
            amount: roundedAmount,
            currency: "USD",
          });

          // Mark proposed entry as approved
          await ctx.db.patch(proposedEntryId, {
            status: "approved",
          });

          entryCount++;
        }
      }
    }
  }

  return { transactionsGenerated: transactionCount, entriesCreated: entryCount };
}

/**
 * Generate 3 months of mock data (action)
 */
export const generateThreeMonthsMockData = action({
  args: {
    includeBusiness: v.optional(v.boolean()),
    includePersonal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const includeBusiness = args.includeBusiness !== false; // Default true
    const includePersonal = args.includePersonal !== false; // Default true

    let results = {
      business: { transactionsGenerated: 0, entriesCreated: 0 },
      personal: { transactionsGenerated: 0, entriesCreated: 0 },
    };

    // Ensure personal accounts exist
    if (includePersonal) {
      await ctx.runMutation(api.mock_data.ensurePersonalAccountsMutation, {
        userId: user._id,
      });
    }

    // Get org context for this action
    const orgContext = await ctx.runQuery(api.helpers.index.getOrgContextQuery, {});
    if (!orgContext.orgId) {
      throw new Error("No organization context available");
    }
    const orgId = orgContext.orgId;
    
    // Get all accounts
    const allAccounts = await ctx.runQuery(api.accounts.getAll, { orgId });

    // Generate business transactions
    if (includeBusiness) {
      const businessAccounts = allAccounts.filter((a: any) => a.isBusiness === true);
      const assetAccounts = businessAccounts
        .filter((a: any) => a.type === "asset")
        .map((a: any) => a._id);

      if (assetAccounts.length > 0) {
        const businessResult = await ctx.runMutation(
          api.mock_data.generateTransactions,
          {
            userId: user._id,
            accountIds: assetAccounts,
            isBusiness: true,
            daysBack: 90, // 3 months
          }
        );
        results.business = businessResult;
      }
    }

    // Generate personal transactions
    if (includePersonal) {
      const personalAccounts = allAccounts.filter((a: any) => a.isBusiness === false);
      const assetAccounts = personalAccounts
        .filter((a: any) => a.type === "asset")
        .map((a: any) => a._id);

      if (assetAccounts.length > 0) {
        const personalResult = await ctx.runMutation(
          api.mock_data.generateTransactions,
          {
            userId: user._id,
            accountIds: assetAccounts,
            isBusiness: false,
            daysBack: 90, // 3 months
          }
        );
        results.personal = personalResult;
      }
    }

    return {
      success: true,
      results,
      message: `Generated ${results.business.transactionsGenerated + results.personal.transactionsGenerated} transactions and ${results.business.entriesCreated + results.personal.entriesCreated} double-entry entries`,
    };
  },
});

/**
 * Ensure personal accounts exist (mutation)
 */
export const ensurePersonalAccountsMutation = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ensurePersonalAccounts(ctx, args.userId);
  },
});

/**
 * Generate transactions and entries (mutation)
 */
export const generateTransactions = mutation({
  args: {
    userId: v.id("users"),
    accountIds: v.array(v.id("accounts")),
    isBusiness: v.boolean(),
    daysBack: v.number(),
  },
  handler: async (ctx, args) => {
    const categories = args.isBusiness
      ? BUSINESS_CATEGORIES
      : PERSONAL_CATEGORIES;

    return await generateTransactionsAndEntries(ctx, {
      userId: args.userId,
      accountIds: args.accountIds,
      categories,
      isBusiness: args.isBusiness,
      daysBack: args.daysBack,
    });
  },
});

/**
 * Query to check mock data status
 */
export const getMockDataStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const transactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const entries = await ctx.db
      .query("entries_final")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const businessTransactions = transactions.filter(
      (t: any) => t.isBusiness === true
    );
    const personalTransactions = transactions.filter(
      (t: any) => t.isBusiness === false
    );

    return {
      totalTransactions: transactions.length,
      businessTransactions: businessTransactions.length,
      personalTransactions: personalTransactions.length,
      totalEntries: entries.length,
      hasData: transactions.length > 0,
    };
  },
});
