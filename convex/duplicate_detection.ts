/**
 * Duplicate transaction detection
 * Identifies similar transactions that might be duplicates
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

interface DuplicateMatch {
  transactionId: string;
  amount: number;
  merchant?: string;
  date: string;
  daysAgo: number;
  matchScore: number;
}

/**
 * Find potential duplicate transactions
 * Threshold: same vendor, amount within $0.50, date within 7 days
 */
export const findDuplicates = query({
  args: {
    merchant: v.string(),
    amount: v.number(),
    date: v.string(), // ISO date string
    excludeTransactionId: v.optional(v.id("transactions_raw")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return null;
    }

    const email = identity.email;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return null;
    }

    const searchDate = new Date(args.date);
    const searchAmount = Math.abs(args.amount);
    const searchMerchant = args.merchant.toLowerCase().trim();

    // Get all user transactions from the last 30 days
    const thirtyDaysAgo = new Date(searchDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();
    
    // Get all transactions and filter in JavaScript (Convex doesn't support Date conversion in filters)
    const allTransactions = await ctx.db
      .query("transactions_raw")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Filter by date and exclude transaction in JavaScript
    const recentTransactions = allTransactions.filter((tx: any) => {
      const txDate = new Date(tx.date);
      const txTimestamp = txDate.getTime();
      const isRecent = txTimestamp >= thirtyDaysAgoTimestamp;
      const isNotExcluded = !args.excludeTransactionId || tx._id !== args.excludeTransactionId;
      return isRecent && isNotExcluded;
    });

    const matches: DuplicateMatch[] = [];

    for (const tx of recentTransactions) {
      const txAmount = Math.abs(tx.amount);
      const txMerchant = (tx.merchant || tx.description || "").toLowerCase().trim();
      const txDate = new Date(tx.date);
      
      // Calculate days difference
      const daysDiff = Math.abs((searchDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if within 7 days
      if (daysDiff > 7) continue;
      
      // Check amount similarity (within $0.50)
      const amountDiff = Math.abs(searchAmount - txAmount);
      if (amountDiff > 0.50) continue;
      
      // Check merchant similarity
      let merchantMatch = false;
      if (searchMerchant && txMerchant) {
        // Exact match
        if (txMerchant === searchMerchant) {
          merchantMatch = true;
        }
        // Partial match (one contains the other)
        else if (txMerchant.includes(searchMerchant) || searchMerchant.includes(txMerchant)) {
          merchantMatch = true;
        }
        // Similar words (fuzzy match for common variations)
        else {
          const searchWords = searchMerchant.split(/\s+/);
          const txWords = txMerchant.split(/\s+/);
          const commonWords = searchWords.filter(word => 
            word.length > 3 && txWords.some(txWord => 
              txWord.includes(word) || word.includes(txWord)
            )
          );
          if (commonWords.length >= Math.min(2, searchWords.length / 2)) {
            merchantMatch = true;
          }
        }
      }
      
      if (!merchantMatch) continue;
      
      // Calculate match score (higher = more likely duplicate)
      let matchScore = 100;
      
      // Penalize for amount difference
      matchScore -= amountDiff * 20; // -20 points per cent difference
      
      // Penalize for date difference
      matchScore -= daysDiff * 5; // -5 points per day difference
      
      // Bonus for exact merchant match
      if (txMerchant === searchMerchant) {
        matchScore += 10;
      }
      
      matches.push({
        transactionId: tx._id,
        amount: tx.amount,
        merchant: tx.merchant || tx.description,
        date: tx.date,
        daysAgo: Math.round(daysDiff),
        matchScore: Math.max(0, Math.min(100, matchScore)),
      });
    }

    // Sort by match score (highest first) and return best match
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Only return if match score is high enough (>= 70)
    if (matches.length > 0 && matches[0].matchScore >= 70) {
      return matches[0];
    }
    
    return null;
  },
});

