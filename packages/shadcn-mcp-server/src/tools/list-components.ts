/**
 * Tool: shadcn_list_components
 * 
 * Lists all available shadcn/ui components from the registry.
 */

import { logger } from "../utils/logger.js";

interface ListComponentsArgs {
  registry?: string;
  category?: string;
}

interface ComponentInfo {
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  files: string[];
}

// Use the official shadcn/ui registry API
const REGISTRY_BASE = "https://ui.shadcn.com/r";
const REGISTRY_INDEX_URL = `${REGISTRY_BASE}/index.json`;

// Known component list (fallback if index doesn't work)
const KNOWN_COMPONENTS = [
  "accordion", "alert", "alert-dialog", "aspect-ratio", "avatar", "badge",
  "breadcrumb", "button", "calendar", "card", "carousel", "chart", "checkbox",
  "collapsible", "command", "context-menu", "dialog", "drawer", "dropdown-menu",
  "form", "hover-card", "input", "label", "menubar", "navigation-menu",
  "popover", "progress", "radio-group", "resizable", "scroll-area", "select",
  "separator", "sheet", "skeleton", "slider", "sonner", "switch", "table",
  "tabs", "textarea", "toast", "toggle", "toggle-group", "tooltip"
];

/**
 * Fetches component registry index from shadcn/ui API
 */
async function fetchRegistryIndex(): Promise<string[]> {
  try {
    // Use native fetch (Node 18+) or require node-fetch
    const fetchFn = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;
    const response = await fetchFn(REGISTRY_INDEX_URL);
    
    if (response.ok) {
      const data = await response.json();
      // If it's an array of component objects, extract names
      if (Array.isArray(data)) {
        return data.map((item: any) => typeof item === "string" ? item : item.name).filter(Boolean);
      }
      // If it's an object with components, extract them
      if (data.components && Array.isArray(data.components)) {
        return data.components.map((item: any) => typeof item === "string" ? item : item.name).filter(Boolean);
      }
    }
    
    // Fallback to known components if index doesn't work
    logger.warn("Registry index not available, using known components list");
    return KNOWN_COMPONENTS;
  } catch (error) {
    logger.warn("Error fetching registry index, using known components:", error);
    // Fallback to known components
    return KNOWN_COMPONENTS;
  }
}

/**
 * Fetches component metadata from shadcn/ui registry API
 */
async function fetchComponentMetadata(
  componentName: string,
  style: string = "default"
): Promise<ComponentInfo | null> {
  try {
    // Use native fetch (Node 18+) or require node-fetch
    const fetchFn = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;
    const metaUrl = `${REGISTRY_BASE}/styles/${style}/${componentName}.json`;
    const response = await fetchFn(metaUrl);
    
    if (!response.ok) {
      // Return basic info if component not found
      return {
        name: componentName,
        description: `${componentName} component`,
        category: "uncategorized",
        dependencies: [],
        files: [],
      };
    }

    const componentData = await response.json();

    // Extract category from files or use default
    let category = "uncategorized";
    if (componentData.files && Array.isArray(componentData.files)) {
      // Try to infer category from file path
      const filePath = componentData.files[0]?.path || "";
      if (filePath.includes("form")) category = "forms";
      else if (filePath.includes("chart")) category = "display";
      else if (filePath.includes("layout")) category = "layout";
      else if (filePath.includes("navigation")) category = "navigation";
    }

    return {
      name: componentData.name || componentName,
      description: componentData.description || `${componentName} component`,
      category: componentData.category || category,
      dependencies: componentData.dependencies || [],
      files: componentData.files?.map((f: any) => f.path || f.name || f) || [],
    };
  } catch (error) {
    logger.warn(`Error fetching metadata for ${componentName}:`, error);
    // Return basic info even if metadata fetch fails
    return {
      name: componentName,
      description: `${componentName} component`,
      category: "uncategorized",
      dependencies: [],
      files: [],
    };
  }
}

/**
 * Lists all available components from the registry
 */
export async function listComponents(
  args: ListComponentsArgs
): Promise<{ components: ComponentInfo[] }> {
  const categoryFilter = args.category?.toLowerCase();

  logger.info("Fetching components from shadcn/ui registry");

  try {
    // Fetch registry index (list of component names)
    const componentNames = await fetchRegistryIndex();

    logger.info(`Found ${componentNames.length} components in registry`);

    // Fetch metadata for each component
    const components: ComponentInfo[] = [];

    for (const componentName of componentNames) {
      // Skip internal components
      if (componentName.startsWith("_")) {
        continue;
      }
      
      const metadata = await fetchComponentMetadata(componentName);
      
      if (metadata) {
        // Apply category filter if specified
        if (categoryFilter) {
          if (metadata.category.toLowerCase() === categoryFilter) {
            components.push(metadata);
          }
        } else {
          components.push(metadata);
        }
      }
    }

    // Sort by name
    components.sort((a, b) => a.name.localeCompare(b.name));

    logger.info(`Returning ${components.length} components`);

    return { components };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error("Error listing components:", errorMessage);
    throw new Error(`Failed to list components: ${errorMessage}`);
  }
}
