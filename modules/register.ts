/**
 * Module Registration
 * Registers all available modules with the module registry
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
}

// Auto-register on import (for server-side)
if (typeof window === "undefined") {
  registerAllModules();
}

