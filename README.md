# EZ Financial - Personal Finance Management App

A modern, full-stack financial management application built with Next.js, Convex, and Clerk. Features real-time transaction tracking, bank account integration, comprehensive financial insights, and an intuitive dashboard.

## 🚀 Features

### Core Functionality
- **Bank Account Integration**: Connect multiple bank accounts via Plaid (mock integration available)
- **Transaction Management**: View, search, and filter all transactions with advanced filtering
- **Financial Insights**: Interactive charts and graphs for cash flow, spending by category, income vs expenses, and monthly trends
- **Account Overview**: Real-time balance tracking across all connected accounts
- **KPI Dashboard**: Key performance indicators including Total Income, Total Spent, Net Cash Flow, and Average Daily Spending
- **Dark Mode**: Full light/dark theme support with system preference detection

### Recent Enhancements
- ✅ **Advanced Transaction Search**: Live search across merchant names, descriptions, categories, and dates
- ✅ **Multi-Filter System**: Filter by income/expense, category, date range, and sort by amount
- ✅ **Responsive Account Cards**: Multi-column grid layout that adapts to screen size
- ✅ **Financial Charts**: Beautiful Recharts visualizations for financial data analysis
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
│   └── web/              # Next.js web application
│       ├── app/          # App Router pages and components
│       │   ├── dashboard/    # Main dashboard with charts and transactions
│       │   ├── components/   # Reusable UI components
│       │   └── ...
│       ├── lib/          # Utilities (cn helper, etc.)
│       └── types/        # TypeScript type definitions
├── convex/               # Convex backend functions
│   ├── plaid.ts          # Plaid integration (mock)
│   ├── transactions.ts    # Transaction management
│   ├── accounts.ts       # Account management
│   └── schema.ts         # Database schema
├── packages/
│   ├── shadcn-mcp-server/    # MCP server for shadcn/ui components
│   ├── accounting-engine/    # Double-entry accounting logic
│   └── shared-models/        # Shared TypeScript types
└── README.md
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Convex (real-time, type-safe)
- **Authentication**: Clerk
- **Bank Integration**: Plaid API (mock implementation)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes

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

### Account Cards
- Responsive grid layout (1-3 columns based on screen size)
- Real-time balance display
- Account type and bank information
- Available balance tracking

### Financial Insights
- **Cash Flow Chart**: Daily cash flow over time
- **Spending by Category**: Pie chart of spending distribution
- **Income vs Expenses**: Monthly comparison
- **Monthly Trends**: Net cash flow and balance trends

### Transaction Management
- **Search Bar**: Live search across all transaction fields
- **Sort**: Toggle between high-to-low and low-to-high by amount
- **Income Filter**: Show only positive transactions
- **Expense Filter**: Show only negative transactions
- **Category Filter**: Filter by transaction category
- **Date Range Filter**: Filter transactions by date range
- All filters are composable and work together

### KPI Cards
- Total Income
- Total Spent
- Net Cash Flow
- Average Daily Spending

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

- `apps/web/app/dashboard/page.tsx` - Main dashboard with all features
- `apps/web/app/components/` - Reusable UI components
- `convex/plaid.ts` - Plaid integration and mock data
- `convex/schema.ts` - Database schema definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Convex](https://www.convex.dev/) for the real-time backend
- [Clerk](https://clerk.com/) for authentication
- [Recharts](https://recharts.org/) for chart visualizations

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, Convex, and modern web technologies**
