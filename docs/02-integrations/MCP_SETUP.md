# MCP Server Setup Guide

## Installation

Once dependencies are installed (when network is available):

```bash
cd packages/shadcn-mcp-server
pnpm install
pnpm build
```

## Configuration for Cursor

Create or update `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "node",
      "args": [
        "/Users/stephenstokes/Downloads/Projects/EZ Financial/packages/shadcn-mcp-server/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

**Note**: Use absolute path to the built `index.js` file.

## Testing the Server

### Manual Test

1. Build the server:
   ```bash
   cd packages/shadcn-mcp-server
   pnpm build
   ```

2. Run the server directly (it will use stdio):
   ```bash
   node dist/index.js
   ```

3. The server will wait for MCP protocol messages on stdin.

### Unit Tests

```bash
pnpm test
```

### Testing in Cursor

1. Ensure the server is built
2. Add configuration to `.cursor/mcp.json`
3. Restart Cursor
4. Try asking: "List all available shadcn/ui components"

## Available Tools

### `shadcn_list_components`

Lists all available shadcn/ui components from the registry.

**Parameters:**
- `category` (optional): Filter by category (e.g., "forms", "display")

**Example usage in Cursor:**
- "List all shadcn/ui components"
- "Show me all form components from shadcn/ui"
- "What components are available in the display category?"

## Troubleshooting

### Server not starting
- Check that `dist/index.js` exists (run `pnpm build`)
- Verify Node.js version is 18+
- Check file permissions

### Connection errors
- Verify the path in `mcp.json` is absolute and correct
- Check Cursor logs for MCP server errors
- Ensure the server has proper permissions

### Component listing fails
- Check internet connection (fetches from GitHub)
- Verify GitHub API is accessible
- Check for rate limiting (GitHub API has rate limits)

