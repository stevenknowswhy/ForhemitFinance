# Convex Array Limits - Developer Guide

## Overview

Convex has a **hard limit of 8192 items** for arrays returned from query functions. This is a platform constraint that cannot be bypassed. Exceeding this limit will cause runtime errors.

## The Problem

When a query function returns an array with more than 8192 items, Convex will throw an error:
```
Function return value invalid: Array length is too long (9154 > maximum length 8192)
```

## Solution: Use Helper Functions

We've created helper functions in `convex/helpers/convexLimits.ts` to safely handle array limits:

### Constants

- `MAX_CONVEX_ARRAY_LENGTH = 8192` - The maximum allowed array length
- `DEFAULT_QUERY_LIMIT = 100` - Default limit for general queries

### Helper Functions

#### `limitArray<T>(array, requestedLimit?, defaultLimit?)`

Safely limits an array to the maximum allowed by Convex.

```typescript
import { limitArray, normalizeLimit, MAX_CONVEX_ARRAY_LENGTH } from "../helpers/convexLimits";

// Example: Limit transactions
const transactions = await ctx.db.query("transactions").collect();
return limitArray(transactions, args.limit, MAX_CONVEX_ARRAY_LENGTH);
```

#### `normalizeLimit(limit?, defaultLimit?)`

Validates and normalizes a limit parameter, ensuring it's within Convex's constraints.

```typescript
const safeLimit = normalizeLimit(args.limit, 100);
```

## Best Practices

### 1. Always Use Limits in Query Functions

**❌ Bad:**
```typescript
export const getTransactions = query({
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .collect();
    return transactions; // Could exceed 8192!
  },
});
```

**✅ Good:**
```typescript
import { limitArray, DEFAULT_QUERY_LIMIT } from "../helpers/convexLimits";

export const getTransactions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .collect();
    return limitArray(transactions, args.limit, DEFAULT_QUERY_LIMIT);
  },
});
```

### 2. Use `.take()` When Possible

For queries where you know you only need a limited number of items, use `.take()` instead of `.collect()`:

**✅ Better:**
```typescript
const transactions = await ctx.db
  .query("transactions")
  .order("desc")
  .take(100); // Only fetch what you need
```

### 3. Add Limit Parameters to Query Args

Always allow callers to specify a limit:

```typescript
export const getItems = query({
  args: {
    limit: v.optional(v.number()),
    // ... other args
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("items").collect();
    const safeLimit = normalizeLimit(args.limit, DEFAULT_QUERY_LIMIT);
    return limitArray(items, safeLimit);
  },
});
```

### 4. Use Appropriate Default Limits

- **Small collections** (accounts, notifications): `DEFAULT_QUERY_LIMIT` (100)
- **Large collections** (transactions, entries): `MAX_CONVEX_ARRAY_LENGTH` (8192) for export scenarios
- **Search/autocomplete**: 10-50 items

## Common Patterns

### Pattern 1: Pagination

For large datasets, implement pagination:

```typescript
export const getTransactions = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = normalizeLimit(args.limit, 50);
    const offset = args.offset || 0;
    
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(limit + offset);
    
    return transactions.slice(offset, offset + limit);
  },
});
```

### Pattern 2: Filtered Queries

Apply filters before limiting:

```typescript
export const getFilteredTransactions = query({
  args: {
    startDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("transactions")
      .collect();
    
    // Apply filters
    if (args.startDate) {
      transactions = transactions.filter(t => t.date >= args.startDate!);
    }
    
    // Sort
    transactions.sort((a, b) => b.date - a.date);
    
    // Apply safe limit
    return limitArray(transactions, args.limit, DEFAULT_QUERY_LIMIT);
  },
});
```

### Pattern 3: Export Scenarios

For export functionality where you need maximum data:

```typescript
export const getTransactionsForExport = query({
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .collect();
    
    // Use max limit for exports, but still cap it
    return limitArray(transactions, MAX_CONVEX_ARRAY_LENGTH);
  },
});
```

## Files Already Protected

The following files have been updated with safeguards:

- ✅ `convex/plaid/mock.ts` - `getMockTransactions`
- ✅ `convex/transactions/queries.ts` - All query functions
- ✅ `convex/notifications.ts` - All query functions
- ✅ `convex/accounts.ts` - All query functions

## Checklist for New Query Functions

When creating a new query function that returns an array:

- [ ] Import helper functions from `convex/helpers/convexLimits`
- [ ] Add optional `limit` parameter to args
- [ ] Use `limitArray()` before returning
- [ ] Use `normalizeLimit()` to validate limit parameter
- [ ] Choose appropriate default limit based on use case
- [ ] Consider using `.take()` instead of `.collect()` when possible
- [ ] Test with large datasets to ensure limits work

## Testing

When testing query functions:

1. **Test with large datasets**: Create test data that exceeds 8192 items
2. **Verify limits are applied**: Check that returned arrays never exceed 8192
3. **Test default behavior**: Ensure default limits work when no limit is provided
4. **Test edge cases**: Very large limits, negative limits, zero limits

## Related Documentation

- [Convex Query Limits](https://docs.convex.dev/functions/query-limits)
- [Convex Best Practices](https://docs.convex.dev/functions/best-practices)

## Questions?

If you're unsure about whether a query needs limits, ask:
1. Could this query return more than 100 items in normal usage?
2. Could this query return more than 8192 items in edge cases?
3. Is this used for export or bulk operations?

If the answer to any is "yes", add limits!

