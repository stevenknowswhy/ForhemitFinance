# Implementation Guide

This guide walks through the key implementation details for building the EZ Financial app.

## Setup Steps

### 1. Initialize Convex

```bash
cd convex
npx convex dev
```

This will:
- Create a Convex project
- Generate type definitions
- Set up the development environment

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- **Convex**: Get from Convex dashboard
- **Plaid**: Sign up at https://plaid.com (start with sandbox)
- **AI**: Get API keys from OpenAI or Anthropic
- **Storage**: Set up Cloudflare R2 or AWS S3 for receipts

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Build Shared Packages

```bash
cd packages/shared-models && pnpm build
cd ../accounting-engine && pnpm build
```

## Key Implementation Details

### Transaction Approval Flow

The core user experience revolves around approving proposed entries:

1. **Plaid Sync** (`convex/plaid.ts`)
   - Fetches transactions from Plaid
   - Creates `transactions_raw` records

2. **Processing** (`convex/transactions.ts`)
   - `processTransaction` mutation generates proposed entry
   - Uses `@ez-financial/accounting-engine` to suggest double-entry

3. **User Approval** (`convex/transactions.ts`)
   - `getPendingTransactions` query shows approval queue
   - `approveEntry` mutation moves to final ledger
   - `rejectEntry` marks for manual review

### Accounting Engine

The `@ez-financial/accounting-engine` package contains pure TypeScript logic:

- **`suggestEntry()`**: Main function that generates double-entry suggestions
- **Rule Matching**: Checks user rules, merchant patterns, Plaid categories
- **Confidence Scoring**: Calculates how confident the suggestion is

### Adding Plaid Integration

1. Install Plaid SDK:
```bash
cd convex
pnpm add @plaid/plaid-node
```

2. Update `convex/plaid.ts`:
   - Replace mock code with actual Plaid API calls
   - Add encryption for access tokens (use Convex secrets)
   - Implement webhook handling for transaction updates

3. Set up Plaid Link in frontend:
   - Use `react-plaid-link` or Plaid's web component
   - On success, call `exchangePublicToken` action

### Adding AI Categorization

1. Create `convex/ai.ts`:
```typescript
export const categorizeTransaction = action({
  args: { transactionId: v.id("transactions_raw") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    // Call OpenAI/Claude API
    // Return enhanced categorization
  },
});
```

2. Integrate into `processTransaction`:
   - If confidence < 0.7, call AI service
   - Enhance suggestion with AI insights

### Adding Monthly Narratives

1. Create `convex/ai-narratives.ts`:
```typescript
export const generateMonthlyNarrative = action({
  args: { userId: v.id("users"), period: v.string() },
  handler: async (ctx, args) => {
    // Aggregate transactions for period
    // Generate narrative with LLM
    // Store in ai_insights table
  },
});
```

2. Schedule with Convex cron:
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";

const crons = cronJobs();

crons.monthly(
  "generateMonthlyNarratives",
  { dayOfMonth: 1, hourUTC: 9 },
  "ai-narratives:generateForAllUsers"
);
```

## Frontend Implementation (Next Steps)

### Web App Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── goals/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── TransactionCard.tsx
│   ├── ApprovalQueue.tsx
│   ├── MonthlyNarrative.tsx
│   └── GoalCard.tsx
└── lib/
    └── convex.ts
```

### Key Components

1. **ApprovalQueue**: Shows pending transactions
2. **TransactionCard**: Displays proposed entry with approve/edit options
3. **MonthlyNarrative**: Renders AI-generated financial story
4. **GoalTracker**: Visual progress for financial goals

### Mobile App Structure

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx  # Dashboard
│   │   ├── transactions.tsx
│   │   ├── goals.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
├── components/
│   └── [same as web]
└── lib/
    └── convex.ts
```

## Testing Strategy

### Unit Tests

Test the accounting engine thoroughly:

```typescript
// packages/accounting-engine/src/engine.test.ts
import { describe, it, expect } from "vitest";
import { suggestEntry } from "./engine";

describe("suggestEntry", () => {
  it("creates correct double-entry for expense", () => {
    const suggestion = suggestEntry(
      { amount: -50, merchant: "Starbucks", ... },
      accounts
    );
    expect(suggestion.debitAccountId).toBe("meals-entertainment");
    expect(suggestion.creditAccountId).toBe("checking");
  });
});
```

### Integration Tests

Test Convex functions with Convex testing utilities.

### E2E Tests

Use Playwright for web, Detox for mobile.

## Performance Optimization

1. **Pre-compute Aggregates**: Create materialized views for P&L, cash flow
2. **Pagination**: Use Convex pagination for large lists
3. **Optimistic UI**: Update UI immediately, sync in background
4. **Caching**: Cache AI insights, only regenerate on new data

## Security Considerations

1. **Encrypt Plaid Tokens**: Use Convex secrets or external encryption
2. **Row-Level Security**: Ensure users can only access their data
3. **Audit Trail**: Never delete entries, only append corrections
4. **Rate Limiting**: Limit AI API calls to prevent abuse

## Next Steps

1. ✅ Set up project structure
2. ✅ Create Convex schema
3. ✅ Build accounting engine
4. ⏭️ Implement Plaid integration (replace mocks)
5. ⏭️ Add AI categorization
6. ⏭️ Build web frontend
7. ⏭️ Build mobile app
8. ⏭️ Add monthly narrative generation
9. ⏭️ Implement goal tracking
10. ⏭️ Add export functionality

