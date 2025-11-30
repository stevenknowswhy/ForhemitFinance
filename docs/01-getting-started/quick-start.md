# Quick Start Guide

## What We've Built

This technical architecture provides:

1. ✅ **Complete Database Schema** (`convex/schema.ts`)
   - Users, accounts, transactions, entries, goals, AI insights
   - Properly indexed for fast queries

2. ✅ **Double-Entry Accounting Engine** (`packages/accounting-engine/`)
   - Pure TypeScript, no dependencies
   - Suggests debit/credit entries for transactions
   - Rule-based + AI-ready categorization

3. ✅ **Transaction Processing** (`convex/transactions.ts`)
   - Process raw transactions → generate proposed entries
   - Approval/rejection workflow
   - Moves approved entries to final ledger

4. ✅ **Plaid Integration Skeleton** (`convex/plaid.ts`)
   - Structure for bank connections
   - Transaction syncing framework
   - Ready to plug in real Plaid API

5. ✅ **Shared Type System** (`packages/shared-models/`)
   - TypeScript types shared across web/mobile/backend
   - Zod validation schemas

## Architecture Highlights

### Backend-Heavy Processing

The backend (Convex) does all the heavy lifting:

- **Transaction Processing**: When Plaid syncs a transaction, `processTransaction` automatically generates a double-entry suggestion
- **Accounting Logic**: The accounting engine determines which accounts to debit/credit
- **AI Integration**: Ready for AI categorization and narrative generation

### Transparent Approval Flow

Users see exactly what's happening:

1. Transaction appears in approval queue
2. Shows: "We think this is: Meals & Entertainment $42.91 from Chase Checking"
3. User can approve, edit, or reject
4. On approve, entry moves to final ledger

### Real-Time Updates

Convex provides instant sync:
- Approve an entry → UI updates immediately
- No page refreshes needed
- Works across web and mobile simultaneously

## Next Steps

### 1. Set Up Convex

```bash
cd convex
npx convex dev
```

This will:
- Create your Convex project
- Generate TypeScript types
- Set up development environment

### 2. Install Plaid SDK

```bash
cd convex
pnpm add @plaid/plaid-node
```

Then update `convex/plaid.ts` to replace mock code with real Plaid API calls.

### 3. Build Frontend

Create the web app (`apps/web/`) and mobile app (`apps/mobile/`):

**Web (Next.js)**:
```bash
npx create-next-app@latest apps/web --typescript --tailwind --app
cd apps/web
pnpm add convex react-convex
```

**Mobile (Expo)**:
```bash
npx create-expo-app@latest apps/mobile --template
cd apps/mobile
pnpm add convex react-convex
```

### 4. Connect Frontend to Convex

```typescript
// apps/web/lib/convex.ts
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
```

```typescript
// Example: Approval Queue Component
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ApprovalQueue() {
  const pending = useQuery(api.transactions.getPendingTransactions);
  const approveEntry = useMutation(api.transactions.approveEntry);

  return (
    <div>
      {pending?.map((entry) => (
        <TransactionCard
          key={entry._id}
          entry={entry}
          onApprove={() => approveEntry({ entryId: entry._id })}
        />
      ))}
    </div>
  );
}
```

### 5. Add AI Integration

Create `convex/ai.ts`:

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const categorizeWithAI = action({
  args: { transactionId: v.id("transactions_raw") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    // Call OpenAI/Claude API
    // Return enhanced categorization
  },
});
```

### 6. Add Monthly Narratives

Create `convex/ai-narratives.ts`:

```typescript
import { action } from "./_generated/server";
import { cronJobs } from "convex/server";

export const generateMonthlyNarrative = action({
  args: { userId: v.id("users"), period: v.string() },
  handler: async (ctx, args) => {
    // Aggregate transactions
    // Generate narrative with LLM
    // Store in ai_insights table
  },
});

// Schedule monthly
const crons = cronJobs();
crons.monthly(
  "generateMonthlyNarratives",
  { dayOfMonth: 1, hourUTC: 9 },
  "ai-narratives:generateForAllUsers"
);
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definition |
| `convex/transactions.ts` | Transaction processing & approval |
| `convex/plaid.ts` | Bank integration (needs real API) |
| `packages/accounting-engine/src/engine.ts` | Double-entry logic |
| `packages/shared-models/src/types/` | Shared TypeScript types |
| `TECHNICAL_ARCHITECTURE.md` | Full architecture docs |
| `IMPLEMENTATION_GUIDE.md` | Detailed implementation steps |

## Testing the Flow

1. **Create a user** (via auth system)
2. **Connect a bank** (via Plaid Link → `exchangePublicToken`)
3. **Sync transactions** (`syncTransactions` action)
4. **View pending entries** (`getPendingTransactions` query)
5. **Approve entry** (`approveEntry` mutation)
6. **View final ledger** (query `entries_final` + `entry_lines`)

## Performance Tips

- Use Convex pagination for large lists
- Pre-compute aggregates (P&L, cash flow) in separate tables
- Cache AI insights, only regenerate on new data
- Use optimistic UI updates for instant feedback

## Security Checklist

- ✅ Row-level security (users can only access their data)
- ⏭️ Encrypt Plaid access tokens (use Convex secrets)
- ⏭️ Rate limit AI API calls
- ⏭️ Audit trail (append-only ledger)
- ⏭️ Data export functionality

## Questions?

See `IMPLEMENTATION_GUIDE.md` for detailed explanations of each component.

