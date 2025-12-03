# Module Core System

This directory contains the core infrastructure for the modular add-on system.

## Files

- **types.ts**: TypeScript type definitions for modules, manifests, enablements, and entitlements
- **module-registry.ts**: Central registry for all available modules with registration and lookup functions
- **module-loader.ts**: Dynamic module loading system (currently supports local modules, extensible for npm packages)

## Usage

### Registering a Module

```typescript
import { registerModule } from "./modules/core/module-registry";
import { ModuleManifest } from "./modules/core/types";

const manifest: ModuleManifest = {
  id: "my-module",
  version: "1.0.0",
  name: "My Module",
  description: "A sample module",
  billing: { type: "free" },
  // ... other config
};

registerModule(manifest);
```

### Getting Module Information

```typescript
import { getModuleManifest, getAllModules } from "./modules/core/module-registry";

const manifest = getModuleManifest("my-module");
const allModules = getAllModules();
```

### Checking Module Access

Module access is checked server-side via `convex/modules.ts` queries and mutations. The registry provides client-side helpers for checking enablement status.

## Architecture

The module system is designed to be:

1. **Extensible**: Easy to add new modules
2. **Type-safe**: Full TypeScript support
3. **Flexible**: Supports free and paid modules
4. **Isolated**: Modules are self-contained
5. **Future-proof**: Can be extended to support npm packages

## Future Enhancements

- Dynamic loading from npm packages
- Remote module registry
- Module versioning and compatibility checks
- Module marketplace integration

