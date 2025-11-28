# Convex CLI and MCP Server Setup

## Convex CLI

The Convex CLI is already available via `npx convex`. Here are the most useful commands:

### Common Commands

```bash
# Start development server (watches for changes, generates types)
npx convex dev

# Deploy to production
npx convex deploy

# Run a function
npx convex run <functionName> [args]

# View logs
npx convex logs

# Open dashboard
npx convex dashboard

# Generate TypeScript types
npx convex codegen

# View/manage environment variables
npx convex env

# View data
npx convex data [table]
```

### Setup

1. **Initialize Convex** (if not already done):
   ```bash
   cd /Users/stephenstokes/Downloads/Projects/EZ\ Financial
   npx convex dev
   ```
   This will:
   - Prompt you to log in/create account
   - Create a Convex project
   - Generate `convex/_generated` files
   - Start watching for changes

2. **Environment Variables**:
   Make sure you have `.env.local` in the `convex/` directory with:
   ```env
   CLERK_JWT_ISSUER_DOMAIN=https://allowing-cow-9.clerk.accounts.dev
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENV=sandbox
   ```

## Convex MCP Server

The MCP server allows AI agents (like Cursor) to interact with your Convex deployment directly.

### Setup for Cursor

1. **Create MCP Configuration**:
   Create or update `.cursor/mcp.json` in your project root:

   ```json
   {
     "mcpServers": {
       "convex": {
         "command": "npx",
         "args": [
           "-y",
           "convex@latest",
           "mcp",
           "start"
         ],
         "env": {
           "CONVEX_DEPLOYMENT": "your-deployment-url"
         }
       }
     }
   }
   ```

2. **Get Your Deployment URL**:
   ```bash
   npx convex dashboard
   ```
   Or check your `convex/.env.local` for `CONVEX_URL`

3. **Enable in Cursor**:
   - Go to Cursor Settings > Tools & Integrations
   - Enable the Convex MCP server
   - Restart Cursor

### MCP Server Capabilities

Once set up, the MCP server allows:
- **Introspect deployment**: View tables, functions, and schema
- **Execute functions**: Run queries, mutations, and actions
- **Read/write data**: Query and modify database records
- **View logs**: Access function execution logs
- **Manage environment variables**: View and set env vars

### Usage Example

Once configured, you can ask Cursor things like:
- "Show me all users in the database"
- "Run the getCurrentUser query"
- "What tables are in my Convex deployment?"
- "Show me the schema for the users table"

## Troubleshooting

### Issue: `_generated` files not updating

**Solution**: Run `npx convex dev` in the root directory. This will:
- Watch for changes
- Regenerate `convex/_generated/api.d.ts` and `server.d.ts`
- Keep types in sync

### Issue: Build errors with Convex imports

**Solution**: The `convex/_generated` files need to be accessible to the Next.js app. Options:

1. **Symlink approach** (current):
   ```bash
   cd apps/web
   ln -sf ../../convex convex
   ```

2. **Copy approach** (for builds):
   Add to `apps/web/package.json`:
   ```json
   {
     "scripts": {
       "prebuild": "cp -r ../convex/_generated ./convex/_generated"
     }
   }
   ```

3. **Use Convex codegen**:
   ```bash
   npx convex codegen --output apps/web/convex/_generated
   ```

### Issue: MCP server not connecting

1. Check that `npx convex mcp start` works in terminal
2. Verify deployment URL is correct
3. Ensure you're logged in: `npx convex dashboard`
4. Check Cursor MCP server logs

## Next Steps

1. **Run Convex Dev Server**:
   ```bash
   npx convex dev
   ```
   This will generate the proper `_generated` files and fix build issues.

2. **Set Up MCP Server**:
   - Create `.cursor/mcp.json` with the configuration above
   - Restart Cursor
   - Test by asking Cursor to query your Convex database

3. **Update Build Script**:
   Consider adding a prebuild script to ensure `_generated` files are up to date:
   ```json
   {
     "scripts": {
       "prebuild": "cd ../.. && npx convex codegen --output apps/web/convex/_generated"
     }
   }
   ```

