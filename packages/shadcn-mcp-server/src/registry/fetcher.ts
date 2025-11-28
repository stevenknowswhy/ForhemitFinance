/**
 * Fetches components from shadcn/ui registry
 */

import { logger } from "../utils/logger.js";

const REGISTRY_BASE = "https://ui.shadcn.com/r";

/**
 * Fetches component metadata from shadcn/ui registry API
 */
export async function fetchComponentMetadata(
  componentName: string,
  style: string = "default"
): Promise<{
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  files: string[];
}> {
  const fetchFn = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;
  const url = `${REGISTRY_BASE}/styles/${style}/${componentName}.json`;
  
  try {
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Component ${componentName} not found in registry`);
    }
    const data = await response.json();
    
    // Extract category from files or use default
    let category = "uncategorized";
    if (data.files && Array.isArray(data.files)) {
      const filePath = data.files[0]?.path || "";
      if (filePath.includes("form")) category = "forms";
      else if (filePath.includes("chart")) category = "display";
      else if (filePath.includes("layout")) category = "layout";
      else if (filePath.includes("navigation")) category = "navigation";
    }
    
    return {
      name: data.name || componentName,
      description: data.description || `${componentName} component`,
      category: data.category || category,
      dependencies: data.dependencies || [],
      files: data.files?.map((f: any) => f.path || f.name || f) || [],
    };
  } catch (error) {
    logger.error(`Error fetching metadata for ${componentName}:`, error);
    throw error;
  }
}

/**
 * Fetches all files for a component
 */
export async function fetchComponentFiles(
  componentName: string,
  style: string = "default"
): Promise<Map<string, string>> {
  const fetchFn = typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;
  const url = `${REGISTRY_BASE}/styles/${style}/${componentName}.json`;
  
  try {
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Component ${componentName} not found in registry`);
    }
    
    const componentData = await response.json();
    const files = new Map<string, string>();

    if (componentData.files && Array.isArray(componentData.files)) {
      for (const file of componentData.files) {
        const filePath = file.path || file.name;
        const content = file.content || "";
        if (filePath && content) {
          files.set(filePath, content);
        }
      }
    }

    return files;
  } catch (error) {
    logger.error(`Error fetching files for ${componentName}:`, error);
    throw error;
  }
}

