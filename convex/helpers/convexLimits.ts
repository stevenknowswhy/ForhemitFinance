/**
 * Convex Platform Limits
 * 
 * This file defines constants and utilities for enforcing Convex platform limits
 * to prevent runtime errors.
 * 
 * IMPORTANT: Convex has a maximum array length of 8192 for query return values.
 * Any query that returns an array must ensure it doesn't exceed this limit.
 * 
 * @see https://docs.convex.dev/functions/query-limits
 */

/**
 * Maximum array length allowed by Convex for query return values
 * This is a hard limit enforced by the Convex platform
 */
export const MAX_CONVEX_ARRAY_LENGTH = 8192;

/**
 * Default limit for queries that return arrays
 * Use this when you want to return a reasonable number of items
 * but don't have a specific limit requirement
 */
export const DEFAULT_QUERY_LIMIT = 100;

/**
 * Safely limits an array to the maximum allowed by Convex
 * 
 * @param array - The array to limit
 * @param requestedLimit - Optional limit requested by the caller
 * @param defaultLimit - Optional default limit if none requested (defaults to MAX_CONVEX_ARRAY_LENGTH)
 * @returns The array limited to a safe size
 * 
 * @example
 * ```ts
 * const transactions = await ctx.db.query("transactions").collect();
 * return limitArray(transactions, args.limit, 100);
 * ```
 */
export function limitArray<T>(
  array: T[],
  requestedLimit?: number,
  defaultLimit: number = MAX_CONVEX_ARRAY_LENGTH
): T[] {
  // If array is already within limits and no limit requested, return as-is
  if (!requestedLimit && array.length <= MAX_CONVEX_ARRAY_LENGTH) {
    return array;
  }

  // Determine the effective limit
  let limit = requestedLimit ?? defaultLimit;

  // Cap at maximum allowed
  if (limit > MAX_CONVEX_ARRAY_LENGTH) {
    limit = MAX_CONVEX_ARRAY_LENGTH;
  }

  // Apply limit
  return array.slice(0, limit);
}

/**
 * Validates and normalizes a limit parameter
 * Ensures the limit is within Convex's constraints
 * 
 * @param limit - The requested limit
 * @param defaultLimit - Default if limit is not provided
 * @returns A safe limit value
 */
export function normalizeLimit(
  limit: number | undefined,
  defaultLimit: number = MAX_CONVEX_ARRAY_LENGTH
): number {
  if (!limit) {
    return defaultLimit;
  }

  // Ensure limit is positive
  if (limit <= 0) {
    return defaultLimit;
  }

  // Cap at maximum allowed
  return Math.min(limit, MAX_CONVEX_ARRAY_LENGTH);
}

/**
 * Warns if an array exceeds the safe limit
 * Useful for logging/debugging when arrays might grow too large
 * 
 * @param array - The array to check
 * @param context - Context string for the warning message
 */
export function warnIfArrayTooLarge<T>(array: T[], context: string): void {
  if (array.length > MAX_CONVEX_ARRAY_LENGTH) {
    console.warn(
      `[Convex Limit Warning] Array in ${context} has ${array.length} items, ` +
      `which exceeds the maximum of ${MAX_CONVEX_ARRAY_LENGTH}. ` +
      `The array will be truncated.`
    );
  }
}

