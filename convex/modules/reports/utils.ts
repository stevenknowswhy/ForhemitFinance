/**
 * Shared utility functions for reports
 */

/**
 * Helper function to get user and authenticate
 */
export async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
    .first();

  return user;
}

/**
 * Check if reports module is enabled for an organization
 * Returns true if enabled, false if disabled or not set
 */
export async function isReportsModuleEnabled(ctx: any, orgId?: string): Promise<boolean> {
  if (!orgId) {
    // If no orgId provided, assume enabled for backward compatibility
    return true;
  }

  const enablement = await ctx.db
    .query("module_enablements")
    .withIndex("by_org_module", (q: any) =>
      q.eq("orgId", orgId).eq("moduleId", "reports")
    )
    .first();

  return enablement?.enabled ?? false;
}

/**
 * Helper function to calculate account balance from entry lines
 * Optimized to avoid reading too many documents
 */
export async function calculateAccountBalanceFromEntries(
  ctx: any,
  userId: string,
  accountId: string,
  asOfDate?: number
): Promise<number> {
  let balance = 0;

  // Optimized query using denormalized fields and composite index
  let query = ctx.db
    .query("entry_lines")
    .withIndex("by_user_account_date", (q: any) =>
      q.eq("userId", userId).eq("accountId", accountId)
    );

  // Apply date filter if provided
  if (asOfDate) {
    query = query.filter((q: any) => q.lte(q.field("date"), asOfDate));
  }

  const lines = await query.collect();

  // Get account type once
  const account = await ctx.db.get(accountId);
  if (!account) return 0;

  // Calculate balance based on account type
  for (const line of lines) {
    if (account.type === "asset" || account.type === "expense") {
      if (line.side === "debit") {
        balance += line.amount;
      } else {
        balance -= line.amount;
      }
    } else {
      // liability, equity, income
      if (line.side === "credit") {
        balance += line.amount;
      } else {
        balance -= line.amount;
      }
    }
  }

  return balance;
}

