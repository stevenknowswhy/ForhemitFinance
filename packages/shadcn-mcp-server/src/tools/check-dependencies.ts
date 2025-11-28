/**
 * Tool: shadcn_check_dependencies
 * 
 * Checks if all required dependencies for components are installed.
 */

import { z } from "zod";
import { readFile } from "fs/promises";
import { join } from "path";
import { readComponentsConfig } from "../file-system/config-manager.js";
import { getComponentsPath } from "../utils/path-resolver.js";
import { glob } from "glob";
import { logger } from "../utils/logger.js";
import { fetchComponentMetadata } from "../registry/fetcher.js";

const CheckDependenciesArgsSchema = z.object({
  projectPath: z.string(),
  componentPath: z.string().optional(),
});

type CheckDependenciesArgs = z.infer<typeof CheckDependenciesArgsSchema>;

/**
 * Parses package.json to get installed dependencies
 */
async function getInstalledDependencies(
  projectPath: string
): Promise<{ dependencies: Map<string, string>; devDependencies: Map<string, string> }> {
  const packageJsonPath = join(projectPath, "package.json");
  
  try {
    const content = await readFile(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content);
    
    return {
      dependencies: new Map(Object.entries(pkg.dependencies || {})),
      devDependencies: new Map(Object.entries(pkg.devDependencies || {})),
    };
  } catch (error) {
    logger.error("Failed to read package.json:", error);
    throw new Error("Could not read package.json");
  }
}

/**
 * Extracts component name from file path
 */
function extractComponentName(filePath: string): string {
  const fileName = filePath.split("/").pop() || "";
  return fileName.replace(/\.tsx?$/, "");
}

/**
 * Checks dependencies for a specific component or all components
 */
export async function checkDependencies(args: unknown): Promise<{
  missing: Array<{
    package: string;
    version?: string;
    requiredBy: string[];
  }>;
  outdated: Array<{
    package: string;
    current: string;
    required: string;
  }>;
  allInstalled: boolean;
}> {
  // Validate arguments
  const validatedArgs = CheckDependenciesArgsSchema.parse(args);
  const { projectPath, componentPath } = validatedArgs;

  logger.info("Checking dependencies for project:", projectPath);

  try {
    // 1. Read components.json
    const config = await readComponentsConfig(projectPath);
    if (!config) {
      throw new Error("components.json not found. Run shadcn_init first.");
    }

    // 2. Get installed dependencies
    const installed = await getInstalledDependencies(projectPath);
    const allInstalled = new Map([
      ...installed.dependencies,
      ...installed.devDependencies,
    ]);

    // 3. Find components to check
    let componentsToCheck: string[] = [];
    
    if (componentPath) {
      // Check specific component
      const componentName = extractComponentName(componentPath);
      componentsToCheck = [componentName];
    } else {
      // Check all components
      const componentsDir = getComponentsPath(
        projectPath,
        config.aliases.ui.replace("@/", "")
      );
      const componentFiles = await glob("**/*.tsx", {
        cwd: componentsDir,
        absolute: false,
      });
      componentsToCheck = componentFiles.map(extractComponentName);
    }

    // 4. Check dependencies for each component
    const missing: Map<string, { version?: string; requiredBy: string[] }> = new Map();
    const outdated: Array<{ package: string; current: string; required: string }> = [];

    for (const componentName of componentsToCheck) {
      try {
        const metadata = await fetchComponentMetadata(componentName);
        
        for (const dep of metadata.dependencies) {
          // Parse package name and version
          const [pkgName, version] = dep.includes("@") 
            ? dep.split("@").slice(-2)
            : [dep, undefined];
          
          if (!allInstalled.has(pkgName)) {
            // Missing dependency
            const existing = missing.get(pkgName);
            if (existing) {
              existing.requiredBy.push(componentName);
            } else {
              missing.set(pkgName, {
                version,
                requiredBy: [componentName],
              });
            }
          } else {
            // Check if version matches (simplified - just check if installed)
            const installedVersion = allInstalled.get(pkgName);
            if (version && installedVersion && version !== installedVersion) {
              outdated.push({
                package: pkgName,
                current: installedVersion,
                required: version,
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Could not check dependencies for ${componentName}:`, error);
      }
    }

    return {
      missing: Array.from(missing.entries()).map(([pkg, info]) => ({
        package: pkg,
        version: info.version,
        requiredBy: info.requiredBy,
      })),
      outdated,
      allInstalled: missing.size === 0 && outdated.length === 0,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error("Failed to check dependencies:", errorMessage);
    throw new Error(`Failed to check dependencies: ${errorMessage}`);
  }
}

