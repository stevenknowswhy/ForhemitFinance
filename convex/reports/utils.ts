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
 * Helper function to calculate account balance from entry lines
 */
export async function calculateAccountBalanceFromEntries(
  ctx: any,
  userId: string,
  accountId: string,
  asOfDate?: number
): Promise<number> {
  let balance = 0;

  // Get all entries up to the date (if provided)
  const allEntries = await ctx.db
    .query("entries_final")
    .withIndex("by_user", (q: any) => q.eq("userId", userId as any))
    .collect();

  const entries = asOfDate
    ? allEntries.filter((e: any) => e.date <= asOfDate)
    : allEntries;

  // Get all entry lines for this account
  for (const entry of entries) {
    const lines = await ctx.db
      .query("entry_lines")
      .withIndex("by_entry", (q: any) => q.eq("entryId", entry._id))
      .filter((q: any) => q.eq(q.field("accountId"), accountId))
      .collect();

    for (const line of lines) {
      // For assets and expenses: debit increases, credit decreases
      // For liabilities, equity, and income: credit increases, debit decreases
      const account = await ctx.db.get(accountId);
      if (!account) continue;

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
  }

  return balance;
}

