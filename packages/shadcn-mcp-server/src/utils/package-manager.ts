/**
 * Package manager detection and execution utilities
 */

import { execa } from "execa";
import { existsSync } from "fs";
import { join } from "path";
import { logger } from "./logger.js";

export type PackageManager = "pnpm" | "npm" | "yarn";

/**
 * Detects the package manager used in a project
 */
export function detectPackageManager(projectPath: string): PackageManager {
  if (existsSync(join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(projectPath, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(join(projectPath, "package-lock.json"))) {
    return "npm";
  }
  // Default to npm if no lock file found
  return "npm";
}

/**
 * Installs packages using the detected package manager
 */
export async function installPackages(
  projectPath: string,
  packages: string[],
  dev: boolean = false
): Promise<void> {
  const pm = detectPackageManager(projectPath);
  const args = dev ? ["add", "-D", ...packages] : ["add", ...packages];

  logger.info(`Installing packages with ${pm}:`, packages);

  try {
    if (pm === "pnpm") {
      await execa("pnpm", args, { cwd: projectPath });
    } else if (pm === "yarn") {
      await execa("yarn", args, { cwd: projectPath });
    } else {
      await execa("npm", ["install", ...packages, dev ? "--save-dev" : "--save"], {
        cwd: projectPath,
      });
    }
    logger.info("Packages installed successfully");
  } catch (error) {
    logger.error("Failed to install packages:", error);
    throw new Error(`Failed to install packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

