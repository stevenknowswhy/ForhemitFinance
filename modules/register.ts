/**
 * Module Registration
 * Registers all available modules with the module registry
 * 
 * IMPORTANT: When adding a new module here, you MUST also:
 * 1. Add the module manifest to convex/moduleManifests.ts
 * 2. Include it in getAllModuleManifests() in that file
 * 
 * Otherwise, the module will be registered client-side but won't appear
 * in the Insights tab or other server-side queries.
 */

import { registerModule } from "./core/module-registry";
import { storiesManifest } from "./stories/manifest";
import { reportsManifest } from "./reports/manifest";

/**
 * Register all modules
 * This should be called at app startup
 */
export function registerAllModules() {
  // Register Stories module
  registerModule(storiesManifest);
  
  // Register Reports module
  registerModule(reportsManifest);
  
  // TODO: When adding new modules, also update:
  // - convex/moduleManifests.ts > getAllModuleManifests()
  // - modules/core/constants.ts > MODULE_IDS (optional but recommended)
}

// Auto-register on import (for server-side)
if (typeof window === "undefined") {
  registerAllModules();
}

