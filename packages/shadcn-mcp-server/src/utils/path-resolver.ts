/**
 * Path resolution utilities for project structure
 */

import { join, resolve } from "path";
import { existsSync } from "fs";
import { logger } from "./logger.js";

/**
 * Resolves the project root path
 */
export function resolveProjectPath(projectPath: string): string {
  const resolved = resolve(projectPath);
  if (!existsSync(resolved)) {
    throw new Error(`Project path does not exist: ${resolved}`);
  }
  return resolved;
}

/**
 * Finds or creates components directory path
 */
export function getComponentsPath(
  projectPath: string,
  componentsPath?: string
): string {
  const resolved = resolveProjectPath(projectPath);
  
  if (componentsPath) {
    return resolve(resolved, componentsPath);
  }
  
  // Default locations to check
  const defaultPaths = [
    join(resolved, "components", "ui"),
    join(resolved, "src", "components", "ui"),
    join(resolved, "app", "components", "ui"),
    join(resolved, "components"),
  ];

  for (const path of defaultPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Return default if none exist (will be created)
  return join(resolved, "components", "ui");
}

/**
 * Finds or creates lib/utils.ts path
 */
export function getUtilsPath(projectPath: string, utilsPath?: string): string {
  const resolved = resolveProjectPath(projectPath);
  
  if (utilsPath) {
    return resolve(resolved, utilsPath);
  }
  
  // Default locations to check
  const defaultPaths = [
    join(resolved, "lib", "utils.ts"),
    join(resolved, "src", "lib", "utils.ts"),
    join(resolved, "utils", "utils.ts"),
  ];

  for (const path of defaultPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Return default if none exist (will be created)
  return join(resolved, "lib", "utils.ts");
}

/**
 * Finds tailwind.config.js path
 */
export function getTailwindConfigPath(projectPath: string): string | null {
  const resolved = resolveProjectPath(projectPath);
  
  const configPaths = [
    join(resolved, "tailwind.config.js"),
    join(resolved, "tailwind.config.ts"),
    join(resolved, "tailwind.config.mjs"),
    join(resolved, "tailwind.config.cjs"),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

