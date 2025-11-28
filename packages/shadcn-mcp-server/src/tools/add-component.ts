/**
 * Tool: shadcn_add_component
 * 
 * Adds a component from the registry to the project.
 */

import { z } from "zod";
import { readComponentsConfig } from "../file-system/config-manager.js";
import { generateComponentFile } from "../file-system/generator.js";
import { getComponentsPath } from "../utils/path-resolver.js";
import { installPackages } from "../utils/package-manager.js";
import { fetchComponentFiles, fetchComponentMetadata } from "../registry/fetcher.js";
import { logger } from "../utils/logger.js";
import { existsSync } from "fs";
import { join } from "path";

const AddComponentArgsSchema = z.object({
  projectPath: z.string(),
  componentName: z.string(),
  overwrite: z.boolean().optional(),
  registry: z.string().optional(),
});

type AddComponentArgs = z.infer<typeof AddComponentArgsSchema>;

/**
 * Resolves component file path based on components.json config
 */
function resolveComponentFilePath(
  componentsPath: string,
  fileName: string
): string {
  // Remove .tsx extension if present, we'll add it
  const baseName = fileName.replace(/\.tsx?$/, "");
  return join(componentsPath, `${baseName}.tsx`);
}

/**
 * Adds a component to the project
 */
export async function addComponent(args: unknown): Promise<{
  success: boolean;
  componentPath: string;
  dependenciesAdded: string[];
  filesCreated: string[];
  message: string;
}> {
  // Validate arguments
  const validatedArgs = AddComponentArgsSchema.parse(args);
  const { projectPath, componentName, overwrite = false } = validatedArgs;

  logger.info(`Adding component ${componentName} to project:`, projectPath);

  try {
    // 1. Read components.json to get configuration
    const config = await readComponentsConfig(projectPath);
    if (!config) {
      throw new Error(
        "components.json not found. Run shadcn_init first."
      );
    }

    // 2. Fetch component metadata and files
    const metadata = await fetchComponentMetadata(componentName);
    const componentFiles = await fetchComponentFiles(componentName);

    // 3. Resolve components path
    const componentsPath = getComponentsPath(
      projectPath,
      config.aliases.ui.replace("@/", "")
    );

    // 4. Check for existing files
    const filesCreated: string[] = [];
    for (const [fileName] of componentFiles) {
      const filePath = resolveComponentFilePath(componentsPath, fileName);
      if (existsSync(filePath) && !overwrite) {
        throw new Error(
          `Component file already exists: ${filePath}. Use overwrite=true to replace.`
        );
      }
    }

    // 5. Generate component files
    for (const [fileName, content] of componentFiles) {
      const filePath = resolveComponentFilePath(componentsPath, fileName);
      await generateComponentFile(filePath, content);
      filesCreated.push(filePath);
    }

    // 6. Install dependencies
    const dependenciesToInstall = metadata.dependencies.filter(
      (dep) => !dep.startsWith("@types/")
    );
    
    if (dependenciesToInstall.length > 0) {
      await installPackages(projectPath, dependenciesToInstall);
    }

    // Install dev dependencies (type definitions)
    const devDependencies = metadata.dependencies.filter((dep) =>
      dep.startsWith("@types/")
    );
    
    if (devDependencies.length > 0) {
      await installPackages(projectPath, devDependencies, true);
    }

    return {
      success: true,
      componentPath: componentsPath,
      dependenciesAdded: metadata.dependencies,
      filesCreated,
      message: `Component ${componentName} added successfully`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(`Failed to add component ${componentName}:`, errorMessage);
    throw new Error(`Failed to add component: ${errorMessage}`);
  }
}

