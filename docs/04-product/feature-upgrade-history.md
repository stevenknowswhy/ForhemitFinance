# "Upgrade Your History" Feature Specification

## Problem Statement

Users onboard with 30-60 days of banking data, then want to pull in 1-2 years of history without breaking what they've already categorized and reconciled.

## Core Concept: "Upgrade Your History" (Not "Redo Everything")

**Principle**: First 30–60 days = sandbox / trial period. Once they trust the app, they hit "Upgrade history" and the system adds older data without blowing up what they already did.

## User-Facing Objects

- **Accounts** (from Plaid)
- **Sync windows per account** - e.g., "This account is synced from 2024-09-01 → today"
- **Backfill jobs** - expand the window backward in time

## UX Flow

### Entry Point
From Settings → Bank Connections and/or friendly dashboard nudge:
- "Loving the app? Pull in your last 12–24 months so we can show real trends."
- Button: **[Import Past Transactions]**

### Step 1: Choose Accounts
- "Which accounts do you want to expand?"
- Checkbox list:
  - ☑ Chase Checking
  - ☑ Chase Savings
  - ☐ Amex Personal
  - ☐ Amex Business
- Show current sync window: "Synced from Sep 1, 2024 → Today"
- **Next** button

### Step 2: Choose Time Range
- "How far back should we go?"
- Smart presets:
  - (Recommended) Last 12 months
  - Last 24 months
  - Custom: [ 01 / 01 / 2023 ] → [ Today ]
- Explainer text:
  - "We'll add older transactions and avoid duplicates. Everything you've already categorized stays the same unless you choose to update it."

### Step 3: Dry-Run Summary
**Before committing, show exactly what will happen:**

```
Here's what we're about to import

3 accounts selected
Date range: Jan 1, 2023 → Aug 31, 2024

We found:
2,316 total transactions in that range
2,080 new (not in your books yet)
236 matching transactions already in your books

We will:
✅ Add the 2,080 new transactions
✅ Skip duplicates we already have
✅ Not change anything you've already categorized or reconciled

Toggle (advanced):
[ ] Allow updates to past transactions that are not reconciled 
    (recommended for most people)

[Looks good – Import]
```

### Step 4: Progress + Clear Messaging
```
Importing your history…

Chase Checking: 1,203 / 1,390
Chase Savings: 611 / 690
Amex: 246 / 236 (duplicates skipped)

Your existing categories and reconciled months are safe.
You can keep using the app while we finish.
```

**When done:**
```
✅ History upgraded

2,080 new transactions added
236 duplicates skipped
0 reconciled entries changed

[Review new months] → takes them to earliest month just added
```

## Technical Implementation

### Idempotent Imports (No Double-Booking)

Every Plaid transaction has an ID. Store:
- `plaidTransactionId`
- `accountId`
- `date`
- `amount`
- `merchant` / `name`
- Hash: `account_id + date + amount + normalized_name` (backup dedupe key)

**Import Rule:**
- If `plaidTransactionId` already exists → treat as same transaction
- If not → create new transaction
- **Never create a new transaction if you already have that external ID**

### Respect "Locked" / Reconciled Periods

Each transaction has flags:
- `is_reconciled` (true/false)
- `is_user_edited` (true/false)
- `lock_version` or timestamp

**When a second import sees a "changed" Plaid record:**
- If reconciled → do not auto-update; mark as "changed in bank" and surface alert
- If unreconciled and not heavily user-edited → safe to update description / category suggestion

**Promise**: "We won't mess with what you've already finalized."

### Transparent "What Changed?" After Backfill

After import, show mini-change-log:
```
We updated your books

2,080 new transactions added
32 transactions re-labeled as "Restaurants" (you can review)
0 reconciled transactions modified

[Review new transactions]
[Review auto-label changes] (optional advanced view)
```

## Ongoing Sync & Re-downloads

**Per account display:**
- Status: Connected / Needs reauth / Disconnected
- "Synced from: [date] → [date] (last sync: 3 hours ago)"
- Actions:
  - [Reconnect]
  - [Expand history]
  - [Re-scan last 30 days] (for missed/edited transactions)

**Re-scan logic:**
- Pull last 30–90 days
- Match on `plaidTransactionId` first
- Add missing ones, update non-reconciled ones, never duplicate

## Microcopy + Explanation Layer

**Repeatedly reinforce:**
- "We add history, we don't blow up your work"
- "You can always review what changed"
- "Reconciled months are protected"

**Example inline copy:**
- On "Expand History" button: "Add older transactions (we'll skip duplicates)"
- Tooltip: "If a transaction is already in your books, we leave it as-is. No double-entries"

**"What's happening?" side panel:**
```
What we're doing

✓ Talking to your bank via Plaid
✓ Finding all transactions between Jan 1, 2023 and today
✓ Adding only the ones you don't already have
✓ Keeping your existing categories and reconciled months intact
```

## Files to Create/Update

### New Components
- `apps/web/app/dashboard/components/UpgradeHistory.tsx` - Entry point
- `apps/web/app/dashboard/components/ImportHistoryModal.tsx` - Main 4-step modal
- `apps/web/app/dashboard/components/AccountSyncStatus.tsx` - Per-account status
- `apps/web/app/settings/page.tsx` - Settings page with bank connections

### Backend Updates
- `convex/plaid.ts` - Add `expandHistory()` action with idempotent logic
- `convex/schema.ts` - Add `is_reconciled`, `is_user_edited` flags if needed

## Success Criteria

- [ ] Users can expand history without breaking existing work
- [ ] Duplicates are prevented (idempotent imports)
- [ ] Reconciled transactions are protected
- [ ] Clear dry-run summary before import
- [ ] Progress tracking during import
- [ ] Change log after import
- [ ] Users understand exactly what changed
- [ ] Easy to review and undo if needed

