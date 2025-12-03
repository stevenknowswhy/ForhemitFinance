/**
 * Module Registry
 * Central registry for all available modules in the system
 */

import { ModuleManifest, ModuleId, ModuleEnablement, ModuleAccessResult } from "./types";

/**
 * In-memory module registry
 * In production, this could be loaded from a database or config file
 */
class ModuleRegistry {
  private modules: Map<ModuleId, ModuleManifest> = new Map();
  private enablements: Map<string, Map<ModuleId, ModuleEnablement>> = new Map(); // orgId -> moduleId -> enablement

  /**
   * Register a module with the registry
   */
  registerModule(manifest: ModuleManifest): void {
    // Validate manifest
    if (!manifest.id || !manifest.version || !manifest.name) {
      throw new Error("Module manifest must have id, version, and name");
    }

    // Check for duplicate IDs
    if (this.modules.has(manifest.id)) {
      console.warn(`Module ${manifest.id} is already registered. Overwriting...`);
    }

    this.modules.set(manifest.id, manifest);
  }

  /**
   * Get a module manifest by ID
   */
  getModuleManifest(moduleId: ModuleId): ModuleManifest | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get enabled modules for an organization
   * This is a client-side helper - actual enablement is checked server-side
   */
  getEnabledModulesForOrg(orgId: string, enablements: ModuleEnablement[]): ModuleManifest[] {
    const enabledModuleIds = new Set(
      enablements
        .filter(e => e.enabled)
        .map(e => e.moduleId)
    );

    return this.getAllModules().filter(m => enabledModuleIds.has(m.id));
  }

  /**
   * Check if a module is enabled for an org
   */
  isModuleEnabled(orgId: string, moduleId: ModuleId, enablements: ModuleEnablement[]): boolean {
    const enablement = enablements.find(e => e.moduleId === moduleId);
    return enablement?.enabled ?? false;
  }

  /**
   * Check if user has access to a module (considering user overrides)
   */
  checkUserModuleAccess(
    orgId: string,
    moduleId: ModuleId,
    userId: string,
    enablements: ModuleEnablement[]
  ): ModuleAccessResult {
    const enablement = enablements.find(e => e.moduleId === moduleId);
    
    if (!enablement) {
      return { hasAccess: false, reason: "Module not enabled for organization" };
    }

    if (!enablement.enabled) {
      return { hasAccess: false, reason: "Module is disabled" };
    }

    // Check user-level override
    if (enablement.userOverrides) {
      const userOverride = enablement.userOverrides.find(uo => uo.userId === userId);
      if (userOverride && !userOverride.enabled) {
        return { hasAccess: false, reason: "Module hidden by user preference" };
      }
    }

    return { hasAccess: true };
  }

  /**
   * Resolve module dependencies
   */
  resolveDependencies(moduleId: ModuleId): ModuleId[] {
    const manifest = this.getModuleManifest(moduleId);
    if (!manifest || !manifest.dependencies) {
      return [];
    }

    const resolved: ModuleId[] = [];
    const visited = new Set<ModuleId>();

    const resolve = (id: ModuleId) => {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);

      const depManifest = this.getModuleManifest(id);
      if (depManifest?.dependencies) {
        depManifest.dependencies.forEach(dep => resolve(dep.moduleId));
      }

      resolved.push(id);
    };

    manifest.dependencies.forEach(dep => resolve(dep.moduleId));
    return resolved;
  }

  /**
   * Get modules that depend on a given module
   */
  getDependentModules(moduleId: ModuleId): ModuleId[] {
    return this.getAllModules()
      .filter(m => 
        m.dependencies?.some(dep => dep.moduleId === moduleId)
      )
      .map(m => m.id);
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();

/**
 * Register a module (convenience function)
 */
export function registerModule(manifest: ModuleManifest): void {
  moduleRegistry.registerModule(manifest);
}

/**
 * Get module manifest (convenience function)
 */
export function getModuleManifest(moduleId: ModuleId): ModuleManifest | undefined {
  return moduleRegistry.getModuleManifest(moduleId);
}

/**
 * Get all modules (convenience function)
 */
export function getAllModules(): ModuleManifest[] {
  return moduleRegistry.getAllModules();
}

