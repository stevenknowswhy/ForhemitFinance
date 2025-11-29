# Changelog

All notable changes to EZ Financial will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Real Plaid integration (currently using mock data)
- Webhook handlers for real-time transaction updates
- Swipe-to-approve gestures for mobile devices
- Bulk approval actions for similar entries
- Smart default tagging rules (auto-detect business vs personal)
- "Upgrade Your History" feature for backfilling historical data
- Account sync status indicators
- Customizable dashboard cards

## [0.2.0] - 2024-12-XX

### Added - AI Double-Entry Preview System
- **AI-Powered Accounting Suggestions**: Automatic double-entry accounting suggestions for every transaction
  - **Why**: Core differentiator - enables users to have proper accounting without learning accounting principles
  - **Implementation**: `convex/ai_entries.ts` with OpenRouter API integration
  - **Models**: Uses `x-ai/grok-4.1-fast:free` for plain-language explanations
- **Plain-Language Explanations**: AI-generated "I chose this because..." explanations for each suggestion
  - **Why**: Reduces cognitive load - users understand why entries are suggested without accounting knowledge
  - **Implementation**: `generateExplanation` action with OpenRouter API
- **Confidence Scoring**: 0-100 confidence ratings for each AI suggestion
  - **Why**: Helps users understand suggestion quality and when to review alternatives
- **Alternative Suggestions**: Multiple entry options when confidence is below 70%
  - **Why**: Gives users options when AI is uncertain, improving trust and accuracy
  - **Implementation**: Dynamic fetching in `ApprovalQueue` component (not stored, reduces database size)
- **Entry Preview Component**: Visual preview of AI-suggested accounting entries
  - **Why**: Clear visualization of debit/credit accounts before approval
  - **Implementation**: `apps/web/app/dashboard/components/EntryPreview.tsx`

### Added - Approval Workflow
- **Approval Queue**: Dedicated UI for reviewing and approving pending transactions
  - **Why**: Centralized location for reviewing AI suggestions before they enter final books
  - **Implementation**: `apps/web/app/dashboard/components/ApprovalQueue.tsx`
  - **Features**: Real-time updates via Convex subscriptions, checkbox selection
- **One-Tap Approval**: Approve, edit, or reject entries with single click
  - **Why**: Reduces friction in the approval process
- **Edit Entry Modal**: Ability to modify AI suggestions before approval
  - **Why**: Users maintain control while benefiting from AI suggestions
- **Transaction CRUD**: Full create, read, update, delete operations for transactions
  - **Why**: Users need to manage their transactions throughout their lifecycle

### Added - Simplified Dashboard Experience
- **3-Card Essential View**: Clean dashboard with only Total Income, Total Expenses, and Burn Rate
  - **Why**: Reduces cognitive load for new users - "radical simplicity" principle
  - **Implementation**: `apps/web/app/dashboard/page.tsx` with `DashboardCard.tsx` component
- **Tooltips with Plain English**: Explanations for each metric
  - **Why**: Users understand what they're looking at without financial expertise
- **Analytics Page**: Moved advanced charts to dedicated `/analytics` page
  - **Why**: Keeps main dashboard simple while providing advanced features for power users
- **Universal Add Button**: Floating action button (FAB) for quick transaction entry
  - **Why**: Always accessible, consistent UX across all pages
  - **Implementation**: `apps/web/app/dashboard/components/AddTransactionButton.tsx`
  - **Integration**: Works on Home, Transactions, and Analytics tabs

### Added - Transaction Entry Improvements
- **Progressive Reveal Modal**: Multi-step form (Income/Expense → Business/Personal → Full form)
  - **Why**: Reduces form complexity, guides users through entry process
  - **Implementation**: `apps/web/app/dashboard/components/AddTransactionModal.tsx`
- **AI Category Suggestions**: Smart category detection with refresh button
  - **Why**: Reduces manual categorization work, learns from past transactions
  - **Enhancement**: AI avoids "uncategorized expense" by using smart heuristics
- **Account Selection Rules**: Enhanced logic preferring credit cards for expenses, checking for income
  - **Why**: Reduces user decision-making, improves accuracy
  - **Feature**: Refresh buttons for debit/credit to get alternative account suggestions
- **Transaction Memory**: Auto-populate from similar past transactions
  - **Why**: Speeds up data entry, learns user patterns
- **Manual AI Trigger**: Button to override memory lookup and get fresh AI suggestions
  - **Why**: Gives users control when they want different categorization

### Added - Personal/Business Tagging
- **Transaction Tagging**: Mark transactions as Personal, Business, or Mixed
  - **Why**: Essential for proper accounting separation
  - **Implementation**: `isBusiness` field in `transactions_raw` and `entries_proposed` schema
- **Filtering UI**: Filter buttons for "All", "Business", "Personal"
  - **Why**: Users can focus on specific transaction types
  - **Implementation**: Integrated into transaction list and dashboard

### Added - Receipt Management
- **Receipt Upload**: Drag-and-drop or click to upload receipt images
  - **Why**: Users need to attach receipts to transactions for record-keeping
  - **Implementation**: UploadThing integration in `apps/web/lib/uploadthing.ts`
- **Receipt Gallery**: View all uploaded receipts
  - **Implementation**: `apps/web/app/dashboard/components/ReceiptsGallery.tsx`
- **Receipt Viewer**: Full-screen receipt viewing with zoom
  - **Implementation**: `apps/web/app/dashboard/components/ReceiptViewer.tsx`
- **Receipt Upload Modal**: Integrated upload flow
  - **Implementation**: `apps/web/app/dashboard/components/ReceiptUploadModal.tsx`

### Added - Business Branding
- **Business Icon Upload**: Upload and store business/website icon for branding
  - **Why**: Users need to brand their financial reports and documents with their business logo
  - **Implementation**: 
    - UploadThing endpoint: `businessIconUploader` in `apps/web/app/api/uploadthing/core.ts`
    - Schema: `businessIcon` field in `business_profiles` table
    - UI: Icon upload section in Business Profile Settings
  - **Features**:
    - Upload business/website icon (max 2MB, images only)
    - Preview uploaded icon in settings
    - Remove icon functionality
    - Icon URL stored in database for reuse in reports
  - **Use Case**: Icon will be used in generated reports, investor packs, and other branded documents

### Added - Navigation Improvements
- **Mobile-First Navigation**: Bottom navigation for mobile, top navigation for desktop
  - **Why**: Better mobile UX, follows platform conventions
  - **Implementation**: `apps/web/app/components/BottomNavigation.tsx` and `DesktopNavigation.tsx`
- **Settings Page**: Dedicated settings page for user preferences
  - **Implementation**: `apps/web/app/settings/` directory
- **Stories Page**: Placeholder for AI-generated financial narratives (Phase 2)
  - **Implementation**: `apps/web/app/stories/` directory

### Fixed - Technical Improvements
- **Convex Plaid Import Fix**: Resolved bundling issues with Plaid SDK
  - **Problem**: `npx convex dev` hung because Convex tried to bundle Plaid at build time
  - **Solution**: Switched to dynamic imports (`await import("plaid")`)
  - **Why**: Allows Convex to bundle code without requiring package at build time
  - **Implementation**: Updated `convex/plaid.ts` with dynamic imports
- **Category Display Fix**: Transaction list now shows actual category instead of "Uncategorized"
  - **Why**: Users need to see proper categorization in transaction lists
- **TypeScript Errors**: Fixed various type errors in build process
  - Fixed: `Parameter 'acc' implicitly has an 'any' type`
  - Fixed: `'updatedAt' does not exist in type`
  - Fixed: `Property 'isBusiness' does not exist on transaction type`

### Changed - Backend Architecture
- **AI Entries Backend**: Complete AI system with OpenRouter integration
  - **Implementation**: `convex/ai_entries.ts` with inlined accounting engine logic
  - **Functions**: `suggestDoubleEntry`, `generateExplanation`, `createProposedEntry`, `getAlternativeSuggestions`
- **Transaction Processing**: Updated to schedule AI suggestions automatically
  - **Implementation**: `convex/transactions.ts` - `processTransaction` function
- **Schema Updates**: Added support for proposed entries and business tagging
  - **Tables**: `entries_proposed` table for AI suggestions
  - **Fields**: `isBusiness` flag in transactions and entries

### Changed - Project Structure
- **Monorepo Setup**: Added Turbo for build orchestration
  - **Implementation**: `turbo.json` configuration
- **Package Organization**: Separated concerns into packages
  - `packages/accounting-engine/` - Double-entry accounting logic
  - `packages/shadcn-mcp-server/` - MCP server for shadcn/ui components
  - `packages/shared-models/` - Shared TypeScript types

## [0.1.0] - 2024-XX-XX

### Added - Initial Release
- **Dashboard**: Main dashboard with KPI cards and financial insights
  - Total Income, Total Spent, Net Cash Flow, Average Daily Spending
  - Cash flow charts, spending by category, income vs expenses
- **Transaction Management**: View, search, and filter transactions
  - Live search across merchant names, descriptions, categories, and dates
  - Multi-filter system (income/expense, category, date range, sort)
- **Account Integration**: Bank account connection via Plaid (mock implementation)
  - Account cards with responsive grid layout
  - Real-time balance tracking
- **Dark Mode**: Full light/dark theme support with system preference detection
- **Authentication**: Clerk integration for user authentication
- **Real-Time Updates**: Convex backend with live data synchronization

### Technical Foundation
- **Next.js 14+**: App Router with TypeScript
- **Convex**: Real-time database and serverless functions
- **Clerk**: Authentication and user management
- **Tailwind CSS + shadcn/ui**: Modern UI components
- **Recharts**: Financial data visualizations

---

## Change Categories

### Added
New features and functionality

### Changed
Changes to existing functionality

### Deprecated
Features that will be removed in future versions

### Removed
Features that have been removed

### Fixed
Bug fixes and error corrections

### Security
Security improvements and vulnerability fixes

---

## Notes

- **Version Format**: We use semantic versioning (MAJOR.MINOR.PATCH)
- **Unreleased Section**: Contains planned features and changes not yet released
- **Why Sections**: Each major feature includes a "Why" explanation to document the reasoning behind the change
- **Implementation Notes**: Technical details about how features were implemented

---

**Legend:**
- ✅ Complete
- ⚠️ Partial/In Progress
- ❌ Not Started
- 🎯 Planned

