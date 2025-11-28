# @ez-financial/accounting-engine

Pure TypeScript double-entry accounting engine. No dependencies on Convex or external services.

## Core Function

### `suggestEntry(transaction, accounts, userRules?)`

Generates a double-entry suggestion for a transaction.

```typescript
import { suggestEntry } from "@ez-financial/accounting-engine";

const suggestion = suggestEntry(
  {
    amount: -42.91,
    merchant: "Starbucks",
    description: "Starbucks Store #1234",
    category: ["Food and Drink"],
    date: "2024-01-15",
    isBusiness: true,
    userId: "user_123",
  },
  accounts, // Array of Account objects
  userRules // Optional user-defined rules
);

// Returns:
// {
//   debitAccountId: "meals-entertainment",
//   creditAccountId: "chase-checking",
//   amount: 42.91,
//   memo: "Starbucks Store #1234",
//   confidence: 0.85,
//   explanation: "Expense: Meals & Entertainment (from Food and Drink)"
// }
```

## How It Works

1. **User Rules First**: Checks user-defined categorization rules (highest confidence)
2. **Standard Rules**: Applies merchant mappings and Plaid category rules
3. **Fallback**: Creates generic expense/income entry if no match

## Confidence Scoring

- **0.95+**: User-defined rule matched
- **0.85-0.94**: Strong merchant/category match
- **0.70-0.84**: Standard category match
- **0.50-0.69**: Generic entry, needs review

## Testing

```bash
pnpm test
```

The engine is designed to be thoroughly unit tested since it handles critical financial logic.

## Integration

This package is used by:
- Convex backend (`convex/transactions.ts`) to generate proposed entries
- Can be used in frontend for preview/validation (though backend is source of truth)

