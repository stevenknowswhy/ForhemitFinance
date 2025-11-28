# Installation Guide

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed (`npm install -g pnpm`)

## Installation Steps

### 1. Install MCP Server Dependencies

From the project root:

```bash
cd packages/shadcn-mcp-server
pnpm install
pnpm build
```

This will install:
- `@modelcontextprotocol/sdk`
- `fs-extra`, `glob`, `zod`, `execa`, `node-fetch`
- TypeScript and Vitest for development

### 2. Install Dashboard Dependencies

From the project root:

```bash
cd apps/web
pnpm install
```

This will install:
- shadcn/ui dependencies (`class-variance-authority`, `clsx`, `tailwind-merge`)
- `recharts` for charts
- `lucide-react` for icons
- `tailwindcss-animate` for animations
- `@radix-ui/react-slot` for UI primitives

### 3. Build MCP Server

```bash
cd packages/shadcn-mcp-server
pnpm build
```

This creates the `dist/` directory with the compiled server.

### 4. Configure MCP Server in Cursor

Create or update `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "node",
      "args": [
        "/Users/stephenstokes/Downloads/Projects/EZ Financial/packages/shadcn-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important**: Use the absolute path to the built `index.js` file.

### 5. Start Dashboard

```bash
cd apps/web
pnpm dev
```

Then visit: `http://localhost:3000/dashboard-demo`

## Troubleshooting

### Network Issues

If you see `ERR_INVALID_THIS` or network errors:

1. Check your internet connection
2. Try using npm instead:
   ```bash
   npm install
   ```
3. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```

### Build Errors

If TypeScript compilation fails:

1. Check Node.js version: `node --version` (should be 18+)
2. Check pnpm version: `pnpm --version` (should be 8+)
3. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### MCP Server Not Connecting

1. Verify the server builds successfully
2. Check the path in `.cursor/mcp.json` is absolute and correct
3. Restart Cursor after configuration changes
4. Check Cursor logs for MCP server errors

## Quick Test Commands

### Test MCP Server Build
```bash
cd packages/shadcn-mcp-server
pnpm build
node dist/index.js
# Should start and wait for MCP protocol messages
```

### Test Dashboard
```bash
cd apps/web
pnpm dev
# Open http://localhost:3000/dashboard-demo
```

## What's Already Done

✅ All code is written and ready
✅ TypeScript configuration complete
✅ No linter errors
✅ All components implemented
✅ Documentation complete

**You just need to install dependencies and build!**

