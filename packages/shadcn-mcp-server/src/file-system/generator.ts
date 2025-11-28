/**
 * File generation utilities for components
 */

import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { existsSync } from "fs";
import { logger } from "../utils/logger.js";

/**
 * Generates the cn() utility function
 */
export async function generateUtilsFile(filePath: string): Promise<void> {
  const content = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, content);
  logger.info("Generated utils file at:", filePath);
}

/**
 * Generates a component file from template
 */
export async function generateComponentFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, content);
  logger.info("Generated component file at:", filePath);
}

