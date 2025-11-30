# PRD — EZ Financial Phase 1 MVP: AI Accounting & Simplicity Layer

## 1. Purpose

Define the features, behaviors, flows, and technical requirements required to deliver the Phase 1 MVP: AI-powered double-entry accounting with radical simplicity.

## 2. Problem Statement

Startups and solopreneurs avoid bookkeeping because it's complex, jargon-filled, and time-consuming. EZ Financial must eliminate friction with AI-powered accounting that users can approve in seconds.

## 3. Core Features (MVP Scope)

### 3.1 AI Double-Entry Preview (CRITICAL)

**User Story:**
"When I enter or import a transaction, the AI shows me the recommended double-entry with a simple explanation."

**Requirements:**
- Suggested debit account
- Suggested credit account
- Amount
- Confidence score (0-100)
- Plain-language reasoning ("I chose this because…")
- Alternative suggestions if low confidence
- Backed by `packages/accounting-engine` + OpenRouter LLM

**Technical Implementation:**
- **Backend**: `convex/ai_entries.ts`
  - Function: `suggestDoubleEntry(transaction, context)`
  - Integrate `packages/accounting-engine/src/engine.ts` for suggestions
  - OpenRouter API integration for explanations
  - Store suggestions in `entries_proposed` table
- **Frontend**: `apps/web/app/dashboard/components/EntryPreview.tsx`
  - Display suggested entry with explanation
  - Approve/Edit/Reject buttons
  - Mobile-first swipe gestures

**Acceptance Criteria:**
- AI suggestions appear for every transaction
- Explanations are clear and helpful
- Confidence scores are accurate
- Alternative suggestions shown when confidence < 70%

### 3.2 AI Explanation System

**User Story:**
"I want to understand why the AI picked these accounts."

**Requirements:**
- Natural-language explanation
- "I chose this because…" format
- Merchant pattern references
- Historical user preferences
- Confidence-based messaging

**Technical Implementation:**
- Part of `convex/ai_entries.ts`
- Displayed in `EntryPreview.tsx`
- Used throughout approval workflow

**Acceptance Criteria:**
- Every AI decision has an explanation
- Explanations reference user's own patterns when available
- Low confidence entries explain uncertainty

### 3.3 Transaction Approval Workflow UI

**User Story:**
"I should be able to approve, reject, or edit any entry with one tap."

**Requirements:**
- Pending approval queue
- One-tap approve
- Swipe-to-approve (mobile)
- Edit modal (change category, accounts, amount)
- Bulk approval
- Real-time Convex updates

**Technical Implementation:**
- **Backend**: Use existing `convex/transactions.ts` functions:
  - `getPendingTransactions()` query
  - `approveEntry(entryId)` mutation
  - `rejectEntry(entryId)` mutation
  - `editEntry(entryId, changes)` mutation
- **Frontend**: `apps/web/app/dashboard/components/ApprovalQueue.tsx`
  - List of pending entries with AI previews
  - Swipe-to-approve (mobile-first)
  - Approve/Reject buttons (desktop)
  - Edit entry modal
  - Bulk approve actions
  - Real-time updates via Convex

**Acceptance Criteria:**
- Users can approve transactions with one tap
- Swipe works on mobile devices
- Bulk actions available for similar entries
- Real-time updates without refresh
- Approved entries move to `entries_final` table

### 3.4 Personal / Business Tagging

**User Story:**
"Let me easily categorize each transaction as business or personal."

**Requirements:**
- Toggle on card: Personal / Business / Mixed
- Filters: All / Business / Personal
- Default smart tagging rules

**Technical Implementation:**
- **Schema**: Already supports `isBusiness` flag in:
  - `accounts.isBusiness`
  - `entries_proposed.isBusiness`
  - `transactions_raw.isBusiness`
- **Frontend**: Update `apps/web/app/dashboard/page.tsx`
  - Add Personal/Business/Mixed toggle to transaction cards
  - Add filter buttons: "All", "Business", "Personal"
  - Update `filteredTransactions` logic
  - Smart default rules (optional for MVP)

**Acceptance Criteria:**
- Transactions can be tagged easily
- Filters work correctly
- Views are distinct (Business vs Personal)
- Default rules apply when available

### 3.5 Real Plaid Integration

**User Story:**
"I should be able to sync real bank accounts."

**Requirements:**
- Replace mock data with live Plaid API
- Link token flow
- Token exchange
- Transaction sync
- Webhooks
- Error/retry logic

**Technical Implementation:**
- **Backend**: Update `convex/plaid.ts`
  - Replace mock functions with real Plaid API calls:
    - `createLinkToken()` - Real Plaid Link token
    - `exchangePublicToken()` - Real token exchange
    - `syncTransactions()` - Real transaction sync
  - Webhook handlers for transaction updates
  - Error handling and retry logic
- **Frontend**: Update Plaid Link component
  - Use real Plaid Link SDK
  - Status indicators for sync issues

**Acceptance Criteria:**
- Users can connect real bank accounts
- Transactions sync automatically
- Webhooks update transactions in real-time
- Error states are handled gracefully
- Mock data available as fallback for development

## 4. Out of Scope (Phase 2+)

The following features are explicitly **NOT** in Phase 1 MVP scope:

- AI Monthly Summaries
- Goal-Based Budgeting
- Forecasting
- Tax prep views
- Accountant collaboration
- Receipt OCR

**Rationale:** Phase 1 is ONLY about making it effortless to get clean books. Everything else must wait until the approval system works perfectly.

## 5. User Flows

### 5.1 First-Time Onboarding + Plaid Connect

1. User signs up
2. User connects bank account via Plaid Link
3. Plaid syncs initial transactions
4. User sees approval queue with AI previews
5. User approves/rejects entries
6. Books are clean

### 5.2 Transaction Import → AI Preview → Approval → Ledger

1. Transaction syncs from Plaid (or manual entry)
2. AI generates double-entry preview with explanation
3. User sees preview in approval queue
4. User approves (one tap) OR edits OR rejects
5. Approved entry moves to `entries_final`
6. Books update in real-time

### 5.3 Editing an Entry

1. User clicks "Edit" on pending entry
2. Modal opens with editable fields:
   - Debit account
   - Credit account
   - Amount
   - Category
   - Personal/Business tag
3. User makes changes
4. User approves edited entry
5. Entry moves to `entries_final` with user's changes

### 5.4 Filtering Business vs Personal

1. User clicks filter: "Business" / "Personal" / "All"
2. Transaction list updates to show filtered view
3. Charts and KPIs update to reflect filtered view
4. User can switch views instantly

## 6. Technical Requirements

### 6.1 Convex Functions to Implement

**New Functions:**
- `convex/ai_entries.ts`
  - `suggestDoubleEntry(transaction, context)` - Generate AI preview
  - `generateExplanation(entry, context)` - Generate plain-language explanation
  - `calculateConfidence(entry, context)` - Calculate confidence score

**Existing Functions to Use:**
- `convex/transactions.ts`
  - `getPendingTransactions()` - Get queue
  - `approveEntry(entryId)` - Approve entry
  - `rejectEntry(entryId)` - Reject entry
  - `editEntry(entryId, changes)` - Edit entry

**Functions to Update:**
- `convex/plaid.ts`
  - Replace mock functions with real Plaid API calls

### 6.2 UI Components to Build

**New Components:**
- `apps/web/app/dashboard/components/EntryPreview.tsx`
  - Display AI suggestion with explanation
  - Approve/Edit/Reject buttons
  - Confidence score display
- `apps/web/app/dashboard/components/ApprovalQueue.tsx`
  - List of pending entries
  - Swipe-to-approve (mobile)
  - Bulk actions
  - Edit modal

**Components to Update:**
- `apps/web/app/dashboard/page.tsx`
  - Add Personal/Business toggle to transaction cards
  - Add filter buttons
  - Update filtering logic
- Plaid Link component
  - Replace mock with real Plaid Link SDK

### 6.3 Data Schema References

**Tables Used:**
- `entries_proposed` - Pending AI suggestions
- `entries_final` - Approved ledger entries
- `entry_lines` - Debit/credit lines
- `transactions_raw` - Raw transaction data
- `accounts` - Chart of accounts
- `institutions` - Plaid bank connections

**Key Fields:**
- `entries_proposed.isBusiness` - Personal/Business flag
- `entries_proposed.confidence` - AI confidence score
- `entries_proposed.explanation` - AI explanation text

### 6.4 OpenRouter API Interface

**Configuration:**
- API Key: `OPENROUTER_API_KEY` in `.env.local`
- Primary Model: `x-ai/grok-4.1-fast:free`
- Fallback 1: `z-ai/glm-4.5-air:free`
- Fallback 2: `openai/gpt-oss-20b:free`

**Integration Points:**
- `convex/ai_entries.ts` - Use OpenRouter for explanations
- Prompt template: "Explain why this double-entry is correct: [entry details]. Use plain language."

### 6.5 Integration Points with Accounting Engine

**Package:** `packages/accounting-engine/`

**Functions to Use:**
- `suggestEntry(transaction, rules)` - Get entry suggestions
- `calculateConfidence(entry, context)` - Calculate confidence
- `getAlternatives(entry, context)` - Get alternative suggestions

**Integration:**
- Import into `convex/ai_entries.ts`
- Use for initial suggestions before AI explanation

## 7. Acceptance Criteria

### 7.1 AI Preview Output Correctness

- [ ] AI suggests correct debit/credit accounts for 90%+ of transactions
- [ ] Explanations are clear and helpful
- [ ] Confidence scores are accurate (high confidence = correct suggestions)
- [ ] Alternative suggestions appear when confidence < 70%

### 7.2 UI Interactions

- [ ] One-tap approval works on desktop
- [ ] Swipe-to-approve works on mobile
- [ ] Edit modal opens and saves correctly
- [ ] Bulk approval works for similar entries
- [ ] Real-time updates without page refresh

### 7.3 Approval Flow

- [ ] Pending entries appear in queue
- [ ] Approved entries move to `entries_final`
- [ ] Rejected entries are removed from queue
- [ ] Edited entries save user changes
- [ ] Books update correctly after approval

### 7.4 Tagging

- [ ] Personal/Business toggle works on transactions
- [ ] Filters show correct views
- [ ] Default rules apply when available
- [ ] Views are distinct and accurate

### 7.5 Plaid Sync

- [ ] Real bank accounts can be connected
- [ ] Transactions sync automatically
- [ ] Webhooks update transactions in real-time
- [ ] Error states are handled gracefully
- [ ] Mock data available as fallback

## 8. Release Plan

### Sprint 1: AI Preview + Explanations (Weeks 1-3)

**Goal:** Build the core differentiator - AI suggests entries with explanations

**Tasks:**
1. Create `convex/ai_entries.ts`
   - `suggestDoubleEntry()` function
   - Integrate `packages/accounting-engine`
   - OpenRouter API integration
   - Generate explanations
   - Calculate confidence scores
2. Create `apps/web/app/dashboard/components/EntryPreview.tsx`
   - Display suggested entry
   - Show explanation
   - Show confidence score
   - Approve/Edit/Reject buttons
3. Integrate into transaction flow
   - Show preview for each transaction
   - Connect to approval backend

**Success Criteria:**
- Users see AI suggestions for every transaction
- Explanations are clear and helpful
- One tap to approve
- Users never need to learn accounting

### Sprint 2: Approval UI + Tagging (Weeks 4-5)

**Goal:** Complete the approval system

**Tasks:**
1. Create `apps/web/app/dashboard/components/ApprovalQueue.tsx`
   - List of pending entries
   - Swipe-to-approve (mobile)
   - Approve/Reject buttons (desktop)
   - Edit entry modal
   - Bulk approve actions
2. Connect to existing backend
   - Use `convex/transactions.ts` functions
   - Real-time updates via Convex
3. Add Personal/Business tagging
   - Toggle on transaction cards
   - Filter views
   - Smart default rules

**Success Criteria:**
- Users can approve transactions with one tap
- Swipe works on mobile
- Bulk actions available
- Tagging works correctly
- Books are perfect after approval

### Sprint 3: Plaid + Polish (Week 6)

**Goal:** Production-ready Plaid integration

**Tasks:**
1. Replace mock Plaid with real API
   - Update `convex/plaid.ts`
   - Real Link token flow
   - Real transaction sync
   - Webhook handlers
2. Error handling and retry logic
3. Polish and testing
   - End-to-end testing
   - Mobile testing
   - Error state testing

**Success Criteria:**
- Real bank accounts can be connected
- Transactions sync automatically
- Webhooks work correctly
- Error states handled gracefully
- MVP is production-ready

## 9. Terminology & Naming Conventions

**Core Feature Names:**
- **AI Double-Entry Preview** - The main feature (not "AI Double-Entry Preview System" or "AI Double-Entry Suggestion & Explanation")
- **AI Explanation** - The explanation component (not "AI Explanation System")
- **Monthly AI Financial Narrative** - Phase 2 feature (not "AI Monthly Narrative" or "AI Monthly Financial Narratives" or "AI Narratives")

**Consistent Usage:**
- Always use "AI Double-Entry Preview" when referring to the core feature
- Always use "AI Explanation" when referring to the explanation component
- Always use "Monthly AI Financial Narrative" when referring to Phase 2 narratives

## 10. Phase 1 Priority Order (Single Source of Truth)

**Phase 1 MVP Features (in order):**

1. **AI Double-Entry Preview** - Core differentiator
2. **Transaction Approval Workflow UI** - Core MVP feature
3. **Personal/Business Tagging** - Important differentiator
4. **Real Plaid Integration** - Production readiness

**Phase 2 Features (explicitly deferred):**

- Monthly AI Financial Narrative
- Goal-Based Budgeting
- Forecasting
- Tax prep views
- Accountant collaboration
- Receipt OCR

**Rule:** Phase 1 is ONLY about making it effortless to get clean books. Everything else is Phase 2+.

