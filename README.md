# EZ Financial - Personal Finance Management App

A modern, full-stack financial management application built with Next.js, Convex, and Clerk. Features AI-powered double-entry accounting, real-time transaction tracking, bank account integration, comprehensive financial insights, and an intuitive dashboard.

**Core Philosophy:** *"Founders shouldn't need to learn accounting to have excellent accounting."*

## 🚀 Features

### Core Functionality
- **AI-Powered Double-Entry Accounting**: Automatic accounting entry suggestions with plain-language explanations
- **Transaction Approval Workflow**: Review and approve AI-suggested accounting entries with one-tap approval
- **Bank Account Integration**: Connect multiple bank accounts via Plaid (mock integration available)
- **Transaction Management**: View, search, and filter all transactions with advanced filtering
- **Financial Insights**: Interactive charts and graphs for cash flow, spending by category, income vs expenses, and monthly trends
- **Account Overview**: Real-time balance tracking across all connected accounts
- **Simplified Dashboard**: Clean 3-card layout (Total Income, Total Expenses, Burn Rate) for first-time users
- **Receipt Management**: Upload, view, and manage receipts with image support
- **Dark Mode**: Full light/dark theme support with system preference detection

### AI Features
- ✅ **AI Double-Entry Preview**: Automatic accounting entry suggestions using intelligent rules engine
- ✅ **Plain-Language Explanations**: AI-generated explanations for why each entry was suggested
- ✅ **Confidence Scoring**: Confidence ratings (0-100) for each suggestion
- ✅ **Alternative Suggestions**: Multiple entry options when confidence is below threshold
- ✅ **OpenRouter Integration**: Powered by advanced AI models for natural language explanations

### Recent Enhancements
- ✅ **Simplified Dashboard**: 3-card essential view for new users (charts moved to Analytics page)
- ✅ **Universal Add Button**: Floating action button for quick transaction entry
- ✅ **Approval Queue**: Dedicated UI for reviewing and approving pending transactions
- ✅ **Entry Preview Component**: Visual preview of AI-suggested accounting entries
- ✅ **Receipt Upload & Viewer**: Upload and view receipt images with gallery support
- ✅ **Advanced Transaction Search**: Live search across merchant names, descriptions, categories, and dates
- ✅ **Multi-Filter System**: Filter by income/expense, category, date range, and sort by amount
- ✅ **Responsive Account Cards**: Multi-column grid layout that adapts to screen size
- ✅ **Financial Charts**: Beautiful Recharts visualizations for financial data analysis
- ✅ **Analytics Page with Tabbed Navigation**: 
  - **Business Tab**: Analytics filtered to business-tagged accounts and transactions only
  - **Personal Tab**: Analytics filtered to personal-tagged financial data only
  - **Blended Tab**: Combined view with toggle controls to show/hide business or personal data
  - Progress indicators showing classification completion percentage
  - Local storage to remember last viewed tab
  - Side-by-side comparison cards in blended view
  - Business-specific KPIs: Burn Rate, Runway calculation
- ✅ **Theme Toggle**: Easy switching between light, dark, and system themes

## 🏗️ Architecture

This is a monorepo built with:
- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **Package Manager**: pnpm (workspace)

## 📁 Project Structure

```
EZ Financial/
├── apps/
│   └── web/                          # Next.js web application
│       ├── app/                      # App Router pages and components
│       │   ├── dashboard/            # Main dashboard (3-card simplified view)
│       │   │   └── components/       # Dashboard-specific components
│       │   │       ├── AddTransactionButton.tsx    # Universal FAB
│       │   │       ├── AddTransactionModal.tsx    # Transaction entry form
│       │   │       ├── ApprovalQueue.tsx          # Pending entries review
│       │   │       ├── EntryPreview.tsx           # AI entry preview
│       │   │       ├── ReceiptUploadModal.tsx     # Receipt upload
│       │   │       └── ReceiptViewer.tsx          # Receipt display
│       │   ├── analytics/            # Advanced charts and insights
│       │   ├── transactions/         # Transaction list and management
│       │   ├── settings/             # User settings
│       │   ├── stories/              # AI-generated financial narratives
│       │   └── components/          # Reusable UI components
│       ├── lib/                      # Utilities (cn helper, uploadthing, etc.)
│       └── types/                    # TypeScript type definitions
├── convex/                           # Convex backend functions
│   ├── ai_entries.ts                 # AI double-entry suggestions & explanations
│   ├── plaid.ts                      # Plaid integration (mock)
│   ├── transactions.ts               # Transaction management & approval
│   ├── accounts.ts                   # Account management
│   ├── subscriptions.ts              # Subscription management
│   ├── investor_reports.ts           # Investor report generation
│   └── schema.ts                     # Database schema
├── packages/
│   ├── shadcn-mcp-server/            # MCP server for shadcn/ui components
│   ├── accounting-engine/            # Double-entry accounting logic
│   └── shared-models/                # Shared TypeScript types
└── README.md
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Convex (real-time, type-safe)
- **Authentication**: Clerk
- **Bank Integration**: Plaid API (mock implementation)
- **AI Integration**: OpenRouter API (Grok models for explanations)
- **File Upload**: UploadThing
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes
- **Monorepo**: pnpm workspaces + Turbo

## 📦 Prerequisites

- Node.js 18+ (or Node.js 25+)
- pnpm 8+ (or pnpm 9+)
- Convex account
- Clerk account

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/stevenknowswhy/ForhemitFinance.git
cd ForhemitFinance

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env.local and fill in your keys
```

### Environment Variables

Create a `.env.local` file in `apps/web/` with:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_convex_deployment

# Plaid (optional, mock available)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# AI Explanations (OpenRouter)
# Set in Convex dashboard: Settings → Environment Variables
OPENROUTER_API_KEY=your_openrouter_api_key

# UploadThing (for receipt uploads)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
NEXT_PUBLIC_UPLOADTHING_URL=your_uploadthing_url
```

### Development

```bash
# Start Convex dev server (in one terminal)
cd convex
npx convex dev

# Start Next.js dev server (in another terminal)
cd apps/web
pnpm dev
```

The app will be available at `http://localhost:3000`

## 📊 Dashboard Features

### Simplified Dashboard (Default View)
- **3 Essential Cards**: Clean, focused view for new users
  - Total Income (This Month)
  - Total Expenses (This Month)
  - Burn Rate (with runway calculation)
- **Tooltips**: Plain-English explanations for each metric
- **Universal Add Button**: Floating action button for quick transaction entry

### AI Double-Entry Preview
- **Automatic Suggestions**: AI generates accounting entries for every transaction
- **Plain-Language Explanations**: "I chose this because..." explanations
- **Confidence Scores**: 0-100 rating for each suggestion
- **Alternative Options**: Multiple suggestions when confidence is low
- **One-Tap Approval**: Approve, edit, or reject entries with a single click

### Approval Queue
- **Pending Transactions**: Review all transactions awaiting approval
- **Entry Previews**: See AI suggestions before approving
- **Bulk Actions**: Approve or reject multiple entries
- **Real-Time Updates**: Live sync via Convex subscriptions

### Account Cards
- Responsive grid layout (1-3 columns based on screen size)
- Real-time balance display
- Account type and bank information
- Available balance tracking

### Financial Insights (Analytics Page)
- **Tabbed Navigation**: Switch between Business, Personal, and Blended views
- **Business Analytics**: 
  - Business-only KPIs (Revenue, Expenses, Net Cash Flow, Burn Rate)
  - Runway calculation (months until $0 at current burn rate)
  - Business category breakdowns
  - All charts filtered to business transactions
- **Personal Analytics**:
  - Personal-only KPIs (Income, Spending, Net Cash Flow, Avg Daily Spending)
  - Personal category breakdowns
  - All charts filtered to personal transactions
- **Blended Analytics**:
  - Combined financial picture across all accounts
  - Toggle controls to show/hide business or personal data
  - Side-by-side comparison cards
  - Unified charts with visual indicators
- **Charts**: Cash Flow, Spending by Category, Income vs Expenses, Monthly Trends
- **Progress Indicators**: Shows classification completion percentage on tabs
- **Persistent State**: Remembers last viewed tab via localStorage

### Transaction Management
- **Search Bar**: Live search across all transaction fields
- **Sort**: Toggle between high-to-low and low-to-high by amount
- **Income Filter**: Show only positive transactions
- **Expense Filter**: Show only negative transactions
- **Category Filter**: Filter by transaction category
- **Date Range Filter**: Filter transactions by date range
- All filters are composable and work together

### Receipt Management
- **Upload Receipts**: Drag-and-drop or click to upload receipt images
- **Receipt Gallery**: View all uploaded receipts
- **Receipt Viewer**: Full-screen receipt viewing with zoom
- **Transaction Linking**: Link receipts to transactions

## 🎨 UI/UX

- **Responsive Design**: Mobile-first approach, works on all screen sizes
- **Dark Mode**: Full dark mode support with smooth transitions
- **Accessibility**: ARIA labels, keyboard navigation support
- **Modern UI**: Clean, professional design using shadcn/ui components

## 🔧 Development

### Building

```bash
# Build the web app
cd apps/web
pnpm build

# Build all packages
pnpm build --filter "./packages/*"
```

### Testing

```bash
# Run tests (if available)
pnpm test
```

## 📝 Key Files

### Frontend
- `apps/web/app/dashboard/page.tsx` - Simplified 3-card dashboard
- `apps/web/app/dashboard/components/AddTransactionModal.tsx` - Transaction entry form
- `apps/web/app/dashboard/components/ApprovalQueue.tsx` - Pending entries review
- `apps/web/app/dashboard/components/EntryPreview.tsx` - AI entry preview component
- `apps/web/app/analytics/page.tsx` - Tabbed analytics (Business/Personal/Blended views)
- `apps/web/app/dashboard/utils/chartData.ts` - Chart data utilities with filtering support
- `apps/web/app/transactions/page.tsx` - Transaction list and management

### Backend
- `convex/ai_entries.ts` - AI double-entry suggestions and explanations
- `convex/transactions.ts` - Transaction management and approval workflow
- `convex/plaid.ts` - Plaid integration and mock data
- `convex/schema.ts` - Database schema definitions
- `packages/accounting-engine/` - Double-entry accounting rules engine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎯 Project Status

**Phase 1 MVP: ~80% Complete**

### ✅ Completed
- Infrastructure (Next.js, Convex, Clerk, schema)
- Simplified dashboard with 3-card layout
- AI double-entry preview system
- Approval workflow UI
- Receipt upload and management
- Transaction search and filtering
- **Analytics page with tabbed navigation (Business/Personal/Blended)**
- **Business vs Personal classification and filtering**
- **Client-side analytics filtering (server-side ready when Convex syncs)**
- Personal/Business tagging UI
- Chart data utilities with filtering support

### 🚧 In Progress
- Real Plaid integration (currently using mock data)
- Server-side filtered analytics queries (ready, needs Convex sync)
- Mobile swipe-to-approve gestures (nice-to-have)

### 📋 Roadmap
See [ROADMAP.md](./ROADMAP.md) for detailed feature roadmap including:
- Phase 3: Multiple businesses per user
- Phase 3: Teams & multi-user collaboration
- Phase 3: Super admin panel with user and subscription management

See [PHASE_1_PROGRESS_CHECKLIST.md](./PHASE_1_PROGRESS_CHECKLIST.md) for detailed progress tracking.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Convex](https://www.convex.dev/) for the real-time backend
- [Clerk](https://clerk.com/) for authentication
- [Recharts](https://recharts.org/) for chart visualizations
- [OpenRouter](https://openrouter.ai/) for AI-powered explanations
- [UploadThing](https://uploadthing.com/) for file uploads

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, Convex, and modern web technologies**
