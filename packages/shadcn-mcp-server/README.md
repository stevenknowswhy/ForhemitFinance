# shadcn/ui MCP Server

MCP (Model Context Protocol) server for scaffolding and managing shadcn/ui components.

## Features

- List available shadcn/ui components from the registry
- Initialize shadcn/ui in a project
- Add components to your project
- Update existing components
- Check component dependencies

## Installation

```bash
pnpm install
pnpm build
```

## Development

```bash
pnpm dev  # Watch mode
pnpm build  # Build
pnpm test  # Run tests
```

## Usage

### As MCP Server

Configure in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "node",
      "args": ["packages/shadcn-mcp-server/dist/index.js"]
    }
  }
}
```

### As CLI

```bash
node dist/index.js
```

## Tools

### `shadcn_list_components`

List all available components from the registry.

**Parameters:**
- `registry` (optional): Custom registry URL
- `category` (optional): Filter by category

**Example:**
```json
{
  "category": "forms"
}
```

## License

MIT

