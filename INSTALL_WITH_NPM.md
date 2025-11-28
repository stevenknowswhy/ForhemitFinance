# Installation Using npm (Alternative)

Since pnpm 8.0.0 has compatibility issues with Node.js 25.x, you can use npm instead.

## Quick Install Commands

Run these commands one at a time (don't copy the comments):

```bash
# Install MCP Server dependencies
cd packages/shadcn-mcp-server
npm install
npm run build

# Install Dashboard dependencies  
cd ../../apps/web
npm install

# Start dashboard (from project root)
cd ../..
cd apps/web
npm run dev
```

## Or Use npm Workspace (Recommended)

From the project root:

```bash
# Install all dependencies
npm install

# Build MCP server
cd packages/shadcn-mcp-server
npm run build

# Start dashboard
cd ../../apps/web
npm run dev
```

## Fix pnpm Later

To fix pnpm for future use:

```bash
# Remove old pnpm
npm uninstall -g pnpm

# Use corepack (comes with Node.js)
corepack enable
corepack prepare pnpm@latest --activate

# Verify
pnpm --version  # Should show 9.x or 10.x
```

## Note

The `package.json` files use `pnpm` but npm will work fine. The workspace structure is compatible with both.

