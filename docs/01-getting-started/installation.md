# EZ Financial - Installation Guide

Complete installation guide for setting up the EZ Financial development environment.

---

## Prerequisites

- **Node.js**: 18+ (or Node.js 20.x LTS recommended)
- **Package Manager**: pnpm 8+ (recommended), npm, or yarn
- **Convex Account**: Sign up at https://convex.dev (free tier available)
- **Clerk Account**: Sign up at https://clerk.com (free tier available)

---

## Quick Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd EZ-Financial
```

### 2. Install Dependencies

From the project root:

```bash
# Install all workspace dependencies
pnpm install
```

This installs dependencies for:
- `apps/web` - Next.js web application
- `packages/shadcn-mcp-server` - MCP server (optional)
- `packages/accounting-engine` - Accounting logic
- `packages/shared-models` - Shared TypeScript types

### 3. Set Up Convex Backend

```bash
cd convex
npx convex dev
```

This will:
- Prompt you to log in to Convex (or create account)
- Create a Convex project
- Generate TypeScript types in `convex/_generated/`
- Start syncing your backend functions
- Give you a deployment URL (e.g., `https://silent-reindeer-986.convex.cloud`)

**Important:** Keep this terminal running. It syncs your backend code to Convex.

### 4. Configure Environment Variables

Create `apps/web/.env.local`:

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

# Stripe (optional, for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See [Environment Variables Setup](#environment-variables) for detailed instructions.

### 5. Start Development Server

In a new terminal (keep Convex dev running):

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

---

## Detailed Setup Steps

### Step 1: Install Package Manager

#### Option A: pnpm (Recommended)

```bash
# Using npm
npm install -g pnpm

# Or using corepack (comes with Node.js)
corepack enable
corepack prepare pnpm@latest --activate

# Verify
pnpm --version
```

#### Option B: npm

```bash
# npm comes with Node.js
npm --version
```

#### Option C: yarn

```bash
npm install -g yarn
yarn --version
```

### Step 2: Install Project Dependencies

From project root:

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Step 3: Set Up Convex Backend

1. **Navigate to convex directory:**
   ```bash
   cd convex
   ```

2. **Run Convex dev:**
   ```bash
   npx convex dev
   ```

3. **Follow prompts:**
   - Log in to Convex (or create account)
   - Create a new project (or select existing)
   - Note your deployment URL

4. **Keep terminal running** - This syncs your backend code

### Step 4: Configure Environment Variables

#### Clerk Authentication

1. Sign up at https://clerk.com
2. Create a new application
3. Get your keys from **API Keys** section:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

4. **Set up JWT Template** (required for Convex):
   - See [JWT Template Setup](../02-integrations/jwt-template-setup.md)

#### Convex

1. Get your deployment URL from `npx convex dev` output
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```

#### Plaid (Optional - Mock Available)

1. Sign up at https://dashboard.plaid.com
2. Create application
3. Get credentials:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV=sandbox` (for testing)

#### OpenRouter AI (Optional)

1. Sign up at https://openrouter.ai
2. Get API key
3. Add to Convex Dashboard → Settings → Environment Variables:
   - `OPENROUTER_API_KEY`

#### UploadThing (Optional)

1. Sign up at https://uploadthing.com
2. Create app
3. Get credentials:
   - `UPLOADTHING_SECRET`
   - `UPLOADTHING_APP_ID`
   - `NEXT_PUBLIC_UPLOADTHING_URL`

### Step 5: Start Development Servers

**Terminal 1 - Convex (keep running):**
```bash
cd convex
npx convex dev
```

**Terminal 2 - Next.js:**
```bash
cd apps/web
pnpm dev
```

Visit http://localhost:3000

---

## Optional: MCP Server Setup

If you want to use the shadcn/ui MCP server:

### 1. Build MCP Server

```bash
cd packages/shadcn-mcp-server
pnpm install
pnpm build
```

### 2. Configure in Cursor

Create `.cursor/mcp.json` in project root:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "node",
      "args": [
        "/absolute/path/to/packages/shadcn-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important**: Use the absolute path to the built `index.js` file.

### 3. Restart Cursor

After configuration, restart Cursor to load the MCP server.

---

## Verification

After installation, verify everything works:

1. **Convex Connection:**
   - Check browser console for connection errors
   - Verify Convex dev terminal shows "Connected"

2. **Authentication:**
   - Visit http://localhost:3000
   - Click "Sign In" or "Get Started"
   - Complete sign-up flow

3. **Dashboard:**
   - Visit http://localhost:3000/dashboard
   - Should see dashboard with cards and charts

4. **Convex Queries:**
   - Check browser console for query errors
   - Verify data loads from Convex

---

## Troubleshooting

### Package Manager Issues

**Problem**: pnpm incompatible with Node.js version

**Solution**:
```bash
# Use Node.js 20.x LTS
nvm install 20
nvm use 20

# Or update pnpm via corepack
corepack enable
corepack prepare pnpm@latest --activate
```

See [Package Manager Troubleshooting](./package-manager-troubleshooting.md) for more details.

### "NEXT_PUBLIC_CONVEX_URL is not defined"

**Solution**:
- Make sure `.env.local` exists in `apps/web/`
- Variable name must start with `NEXT_PUBLIC_`
- Restart Next.js dev server after adding env variables

### "Cannot connect to Convex"

**Solution**:
- Make sure `npx convex dev` is running
- Check deployment URL in `.env.local` matches your Convex project
- Verify Convex project is active in dashboard

### Type Errors

**Solution**:
- Run `npx convex dev` to regenerate types
- Make sure `convex/_generated/api.d.ts` exists
- Restart TypeScript server in IDE

### Network Issues

**Solution**:
- Check internet connection
- Try clearing package manager cache:
  ```bash
  pnpm store prune  # for pnpm
  npm cache clean --force  # for npm
  ```
- Check for proxy settings

### Build Errors

**Solution**:
- Check Node.js version: `node --version` (should be 18+)
- Check package manager version
- Try deleting `node_modules` and reinstalling:
  ```bash
  rm -rf node_modules
  pnpm install
  ```

---

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Convex dev output |

### Optional Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PLAID_CLIENT_ID` | Plaid client ID | Plaid Dashboard |
| `PLAID_SECRET` | Plaid secret | Plaid Dashboard |
| `PLAID_ENV` | Plaid environment | `sandbox` for testing |
| `OPENROUTER_API_KEY` | OpenRouter API key | OpenRouter Dashboard (set in Convex) |
| `UPLOADTHING_SECRET` | UploadThing secret | UploadThing Dashboard |
| `UPLOADTHING_APP_ID` | UploadThing app ID | UploadThing Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard |

---

## Next Steps

After installation:

1. **Set up Clerk JWT Template** - See [JWT Template Setup](../02-integrations/jwt-template-setup.md)
2. **Configure Integrations** - See [Integration Guides](../02-integrations/)
3. **Review Architecture** - See [Technical Architecture](../03-architecture/technical-architecture.md)
4. **Start Development** - See [Implementation Guide](../03-architecture/implementation-guide.md)

---

## Related Documentation

- [Quick Start Guide](./quick-start.md) - Condensed setup guide
- [Setup Guide](./setup-guide.md) - Convex-specific setup
- [Package Manager Troubleshooting](./package-manager-troubleshooting.md) - Fix package manager issues
- [Integration Guides](../02-integrations/) - Set up third-party services

---

**Last Updated**: December 2024
