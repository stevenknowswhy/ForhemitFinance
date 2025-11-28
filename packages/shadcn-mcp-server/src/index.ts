#!/usr/bin/env node

/**
 * shadcn/ui MCP Server
 * 
 * Provides tools for scaffolding and managing shadcn/ui components
 * through the Model Context Protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listComponents } from "./tools/list-components.js";
import { init } from "./tools/init.js";
import { addComponent } from "./tools/add-component.js";
import { checkDependencies } from "./tools/check-dependencies.js";
import { updateComponent } from "./tools/update-component.js";
import { logger } from "./utils/logger.js";

const SERVER_NAME = "shadcn-mcp-server";
const SERVER_VERSION = "0.1.0";

async function main() {
  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "shadcn_list_components",
          description:
            "List all available shadcn/ui components from the registry. Can filter by category.",
          inputSchema: {
            type: "object",
            properties: {
              registry: {
                type: "string",
                description:
                  "Optional custom registry URL. Defaults to shadcn/ui GitHub registry.",
              },
              category: {
                type: "string",
                description:
                  "Optional category filter (e.g., 'forms', 'display', 'layout').",
              },
            },
          },
        },
        {
          name: "shadcn_init",
          description:
            "Initialize shadcn/ui in a project. Creates components.json, installs dependencies, and sets up Tailwind config.",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the project root directory.",
              },
              style: {
                type: "string",
                enum: ["default", "new-york"],
                description: "Component style variant.",
              },
              baseColor: {
                type: "string",
                enum: ["slate", "gray", "zinc", "neutral", "stone"],
                description: "Base color for the theme.",
              },
              cssVariables: {
                type: "boolean",
                description: "Use CSS variables for theming.",
              },
              componentsPath: {
                type: "string",
                description: "Custom path for components directory.",
              },
              utilsPath: {
                type: "string",
                description: "Custom path for utils file.",
              },
            },
            required: ["projectPath"],
          },
        },
        {
          name: "shadcn_add_component",
          description:
            "Add a shadcn/ui component to the project. Fetches from registry and installs dependencies.",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the project root directory.",
              },
              componentName: {
                type: "string",
                description: "Name of the component to add (e.g., 'button', 'card').",
              },
              overwrite: {
                type: "boolean",
                description: "Overwrite existing component files if they exist.",
              },
            },
            required: ["projectPath", "componentName"],
          },
        },
        {
          name: "shadcn_check_dependencies",
          description:
            "Check if all required dependencies for components are installed. Can check specific component or all components.",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the project root directory.",
              },
              componentPath: {
                type: "string",
                description: "Optional path to specific component file to check.",
              },
            },
            required: ["projectPath"],
          },
        },
        {
          name: "shadcn_update_component",
          description:
            "Update an existing component to the latest version from the registry. Can show diff with dryRun option.",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the project root directory.",
              },
              componentName: {
                type: "string",
                description: "Name of the component to update (e.g., 'button', 'card').",
              },
              dryRun: {
                type: "boolean",
                description: "If true, show what would be changed without applying updates.",
              },
            },
            required: ["projectPath", "componentName"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "shadcn_list_components": {
          const result = await listComponents(args as any);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "shadcn_init": {
          const result = await init(args as any);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "shadcn_add_component": {
          const result = await addComponent(args as any);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "shadcn_check_dependencies": {
          const result = await checkDependencies(args as any);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "shadcn_update_component": {
          const result = await updateComponent(args as any);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error executing tool ${name}:`, errorMessage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: "TOOL_EXECUTION_ERROR",
                  message: errorMessage,
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`${SERVER_NAME} v${SERVER_VERSION} started`);
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});

