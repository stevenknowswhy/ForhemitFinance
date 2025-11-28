/**
 * Tool: shadcn_update_component
 * 
 * Updates an existing component to the latest version from the registry.
 */

import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { readComponentsConfig } from "../file-system/config-manager.js";
import { getComponentsPath } from "../utils/path-resolver.js";
import { fetchComponentFiles, fetchComponentMetadata } from "../registry/fetcher.js";
import { logger } from "../utils/logger.js";
import { installPackages } from "../utils/package-manager.js";

const UpdateComponentArgsSchema = z.object({
  projectPath: z.string(),
  componentName: z.string(),
  dryRun: z.boolean().optional(),
});

type UpdateComponentArgs = z.infer<typeof UpdateComponentArgsSchema>;

/**
 * Compares two file contents and returns differences
 */
function compareFiles(
  oldContent: string,
  newContent: string
): { added: string[]; removed: string[]; modified: string[] } {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  
  // Simple line-by-line comparison
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  
  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (i >= oldLines.length) {
      added.push(`+${i + 1}: ${newLines[i]}`);
    } else if (i >= newLines.length) {
      removed.push(`-${i + 1}: ${oldLines[i]}`);
    } else if (oldLines[i] !== newLines[i]) {
      modified.push(`${i + 1}: ${oldLines[i]} → ${newLines[i]}`);
    }
  }
  
  return { added, removed, modified };
}

/**
 * Resolves component file path
 */
function resolveComponentFilePath(
  componentsPath: string,
  fileName: string
): string {
  const baseName = fileName.replace(/\.tsx?$/, "");
  return join(componentsPath, `${baseName}.tsx`);
}

/**
 * Updates a component to the latest version
 */
export async function updateComponent(args: unknown): Promise<{
  success: boolean;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  dependenciesUpdated: string[];
  message: string;
}> {
  // Validate arguments
  const validatedArgs = UpdateComponentArgsSchema.parse(args);
  const { projectPath, componentName, dryRun = false } = validatedArgs;

  logger.info(`Updating component ${componentName} in project:`, projectPath);

  try {
    // 1. Read components.json
    const config = await readComponentsConfig(projectPath);
    if (!config) {
      throw new Error("components.json not found. Run shadcn_init first.");
    }

    // 2. Fetch latest component from registry
    const latestMetadata = await fetchComponentMetadata(componentName);
    const latestFiles = await fetchComponentFiles(componentName);

    // 3. Resolve components path
    const componentsPath = getComponentsPath(
      projectPath,
      config.aliases.ui.replace("@/", "")
    );

    // 4. Read existing files and compare
    const changes = {
      added: [] as string[],
      removed: [] as string[],
      modified: [] as string[],
    };

    const existingFiles = new Set<string>();
    
    // Check existing files
    for (const fileName of latestMetadata.files) {
      const filePath = resolveComponentFilePath(componentsPath, fileName);
      existingFiles.add(fileName);
      
      if (existsSync(filePath)) {
        const existingContent = await readFile(filePath, "utf-8");
        const latestContent = latestFiles.get(fileName) || "";
        
        const fileChanges = compareFiles(existingContent, latestContent);
        if (fileChanges.added.length > 0 || fileChanges.removed.length > 0 || fileChanges.modified.length > 0) {
          changes.modified.push(fileName);
        }
      } else {
        changes.added.push(fileName);
      }
    }

    // Check for files that exist locally but not in registry (removed)
    // This is a simplified check - in reality, we'd need to track all component files
    // For now, we'll just note if files are added/modified

    // 5. If dry run, return changes without applying
    if (dryRun) {
      return {
        success: true,
        changes,
        dependenciesUpdated: [],
        message: `Dry run: Would update ${componentName}. ${changes.added.length} files added, ${changes.modified.length} files modified.`,
      };
    }

    // 6. Apply updates
    const filesUpdated: string[] = [];
    for (const [fileName, content] of latestFiles) {
      const filePath = resolveComponentFilePath(componentsPath, fileName);
      await writeFile(filePath, content);
      filesUpdated.push(filePath);
    }

    // 7. Update dependencies
    const dependenciesToInstall = latestMetadata.dependencies.filter(
      (dep) => !dep.startsWith("@types/")
    );
    
    const dependenciesUpdated: string[] = [];
    if (dependenciesToInstall.length > 0) {
      try {
        await installPackages(projectPath, dependenciesToInstall);
        dependenciesUpdated.push(...dependenciesToInstall);
      } catch (error) {
        logger.warn("Some dependencies may not have been updated:", error);
      }
    }

    // Install dev dependencies
    const devDependencies = latestMetadata.dependencies.filter((dep) =>
      dep.startsWith("@types/")
    );
    
    if (devDependencies.length > 0) {
      try {
        await installPackages(projectPath, devDependencies, true);
        dependenciesUpdated.push(...devDependencies);
      } catch (error) {
        logger.warn("Some dev dependencies may not have been updated:", error);
      }
    }

    return {
      success: true,
      changes: {
        added: changes.added,
        removed: changes.removed,
        modified: changes.modified,
      },
      dependenciesUpdated,
      message: `Component ${componentName} updated successfully. ${filesUpdated.length} files updated.`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(`Failed to update component ${componentName}:`, errorMessage);
    throw new Error(`Failed to update component: ${errorMessage}`);
  }
}

