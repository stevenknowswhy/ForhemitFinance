# @ez-financial/shared-models

Shared TypeScript types and validation schemas used across web, mobile, and backend.

## Usage

```typescript
import type { ProposedEntry, RawTransaction } from "@ez-financial/shared-models";
import { ProposedEntrySchema } from "@ez-financial/shared-models";

// Type checking
const entry: ProposedEntry = { ... };

// Runtime validation
const result = ProposedEntrySchema.parse(data);
```

## Structure

- `types/accounting.ts` - Double-entry accounting types
- `types/transactions.ts` - Transaction and receipt types
- `types/user.ts` - User and business profile types
- `types/goals.ts` - Financial goals and budgets
- `validation.ts` - Zod schemas for runtime validation

## Building

```bash
pnpm build
```

This generates TypeScript declaration files in `dist/` that can be imported by other packages.

