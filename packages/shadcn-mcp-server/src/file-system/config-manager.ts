/**
 * Manages components.json configuration file
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { logger } from "../utils/logger.js";

export interface ComponentsConfig {
  $schema?: string;
  style: "default" | "new-york";
  rsc: boolean;
  tsx: boolean;
  tailwind: {
    config: string;
    css: string;
    baseColor: string;
    cssVariables: boolean;
    prefix: string;
  };
  aliases: {
    components: string;
    utils: string;
    ui: string;
    lib: string;
    hooks: string;
  };
}

export const DEFAULT_CONFIG: ComponentsConfig = {
  style: "default",
  rsc: true,
  tsx: true,
  tailwind: {
    config: "tailwind.config.js",
    css: "app/globals.css",
    baseColor: "slate",
    cssVariables: true,
    prefix: "",
  },
  aliases: {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  },
};

/**
 * Reads components.json from project
 */
export async function readComponentsConfig(
  projectPath: string
): Promise<ComponentsConfig | null> {
  const configPath = join(projectPath, "components.json");
  
  try {
    if (existsSync(configPath)) {
      const content = await readFile(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    logger.warn("Could not read components.json:", error);
  }
  
  return null;
}

/**
 * Writes components.json to project
 */
export async function writeComponentsConfig(
  projectPath: string,
  config: Partial<ComponentsConfig>
): Promise<string> {
  const configPath = join(projectPath, "components.json");
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(configPath, JSON.stringify(fullConfig, null, 2));
  
  logger.info("Created components.json at:", configPath);
  return configPath;
}

