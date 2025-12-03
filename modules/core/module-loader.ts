/**
 * Module Loader
 * Handles dynamic loading of modules (for future npm package support)
 */

import { ModuleManifest, ModuleId } from "./types";
import { moduleRegistry } from "./module-registry";

/**
 * Load a module dynamically
 * Currently loads from local modules, but can be extended for npm packages
 */
export async function loadModule(moduleId: ModuleId): Promise<ModuleManifest | null> {
  // Check if already registered
  const existing = moduleRegistry.getModuleManifest(moduleId);
  if (existing) {
    return existing;
  }

  // For now, modules are statically imported
  // In the future, this could:
  // 1. Load from npm package
  // 2. Load from remote CDN
  // 3. Load from database config
  
  try {
    // Try to import the module's manifest
    // This assumes modules are in the codebase
    const modulePath = `../${moduleId}/manifest`;
    const module = await import(modulePath);
    
    if (module.default || module.manifest) {
      const manifest = module.default || module.manifest;
      moduleRegistry.registerModule(manifest);
      return manifest;
    }
  } catch (error) {
    console.warn(`Failed to load module ${moduleId}:`, error);
  }

  return null;
}

/**
 * Load all available modules
 * This is called at app startup
 */
export async function loadAllModules(): Promise<void> {
  // For now, modules are registered statically
  // In the future, this could scan a directory or load from config
  
  // Modules will be registered when their manifest files are imported
  // This is handled by the module registration in the app initialization
}

/**
 * Check if a module can be loaded
 */
export function canLoadModule(moduleId: ModuleId): boolean {
  // For now, all registered modules can be loaded
  return moduleRegistry.getModuleManifest(moduleId) !== undefined;
}

