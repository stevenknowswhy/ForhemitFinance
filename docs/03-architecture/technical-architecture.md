# Technical Architecture: EZ Financial Bookkeeping App

## Overview

A mobile-first financial bookkeeping application that combines simplicity with robust double-entry accounting. The backend handles complex accounting logic while presenting users with simple approval workflows.

## Core Principles

1. **Backend-Heavy**: Complex accounting logic runs server-side
2. **Transparent**: Users see what's happening but don't need to understand it
3. **Fast**: Sub-second response times for core interactions
4. **Mobile-First**: Optimized for mobile, works on web
5. **Real-Time**: Live updates across all platforms

## Technology Stack

### Frontend
- **Web**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Mobile**: React Native + Expo (iOS + Android)
- **State Management**: React Query + Convex real-time subscriptions
- **UI Components**: React Native Paper / shadcn/ui (web)

### Backend
- **Database & Backend**: Convex (real-time database + functions)
- **Bank Integration**: Plaid API
- **AI/ML**: OpenAI GPT-4 / Anthropic Claude (categorization + narratives)
- **Storage**: Cloudflare R2 or AWS S3 (receipts/images)
- **OCR**: AWS Textract or Google Vision API

### Infrastructure
- **Auth**: Clerk or Auth0
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Monitoring**: Convex dashboard + custom metrics

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
├──────────────────┬──────────────────┬───────────────────────┤
│   Web (Next.js)  │  iOS (Expo)      │  Android (Expo)       │
└────────┬─────────┴────────┬─────────┴───────────┬───────────┘
         │                   │                     │
         └───────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Convex API    │
                    │  (Real-time DB) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Accounting    │  │  Plaid Service  │  │  AI Service    │
│  Engine        │  │  (Actions)      │  │  (Actions)     │
│  (Pure TS)     │  │                 │  │                │
└────────────────┘  └─────────────────┘  └────────────────┘
                             │
                    ┌────────▼────────┐
                    │  External APIs   │
                    │  - Plaid        │
                    │  - OpenAI/Claude│
                    │  - OCR Service  │
                    └─────────────────┘
```

## Data Model

### Core Tables (Convex Schema)

#### `users`
- User profile, preferences, subscription tier
- Chart of accounts template based on business type

#### `institutions`
- Plaid institution connections
- Encrypted access tokens

#### `accounts`
- Bank accounts (from Plaid)
- Credit cards
- Internal ledger accounts (Chart of Accounts)

#### `transactions_raw`
- Raw transactions from Plaid
- Receipt uploads
- Manual entries

#### `entries_proposed`
- AI/rule-generated double-entry suggestions
- Waiting for user approval

#### `entries_final`
- Approved ledger entries
- Append-only audit trail

#### `entry_lines`
- Debit/credit lines for each entry
- Links to accounts

#### `categories`
- Chart of accounts
- Tax categories
- Business vs personal tags

#### `goals`
- Financial goals
- Budget targets
- Progress tracking

#### `ai_insights`
- Monthly narratives
- Cached AI analysis
- Recommendations

## Key Flows

### 1. Transaction Approval Flow

```
User Action → Plaid Sync → Raw Transaction
    ↓
Rule Engine (merchant mapping, user rules)
    ↓
AI Categorization (if low confidence)
    ↓
Accounting Engine → Generate Double-Entry Suggestion
    ↓
Store in entries_proposed
    ↓
UI Shows Snapshot Card
    ↓
User Approves/Edits
    ↓
Move to entries_final + entry_lines
    ↓
Real-time UI Update
```

### 2. Expense Upload Flow

```
User Uploads Receipt Photo
    ↓
Store in R2/S3
    ↓
OCR Extraction (async)
    ↓
Match to Plaid Transaction (if exists)
    ↓
Generate Proposed Entry
    ↓
Show in Approval Queue
```

### 3. Monthly Narrative Generation

```
End of Month Trigger (Cron)
    ↓
Aggregate Transactions
    ↓
Generate AI Narrative (async)
    ↓
Store in ai_insights
    ↓
Notify User
```

## Performance Optimizations

1. **Pre-computed Aggregates**: Daily/weekly summaries for fast dashboards
2. **Optimistic UI**: Immediate local updates before server confirmation
3. **Pagination**: Infinite scroll for transaction lists
4. **Background Processing**: AI/OCR jobs run async, don't block UI
5. **Caching**: AI insights cached, only regenerate on new data
6. **Indexing**: Convex indexes on user_id, date, status

## Security Considerations

1. **Encryption**: Plaid tokens encrypted at rest
2. **Audit Trail**: Append-only ledger, never delete entries
3. **Access Control**: Row-level security via Convex auth
4. **Data Export**: Full export capability for user trust
5. **Compliance**: SOC 2 considerations for financial data

## Scalability Plan

### Phase 1 (MVP)
- Single Convex instance
- Direct AI API calls
- Basic OCR

### Phase 2 (Growth)
- Separate AI worker service (if needed)
- Queue system for heavy processing
- CDN for receipt images

### Phase 3 (Scale)
- Multi-region Convex deployment
- Dedicated AI inference infrastructure
- Advanced caching layers

## Development Workflow

1. **Monorepo**: pnpm + Turborepo
2. **Shared Types**: packages/shared-models
3. **Testing**: Vitest for accounting engine, Playwright for E2E
4. **CI/CD**: GitHub Actions
5. **Deployment**: Vercel (web), EAS (mobile), Convex (backend)

