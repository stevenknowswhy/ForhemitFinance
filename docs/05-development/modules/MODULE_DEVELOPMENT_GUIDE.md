# Module Development Guide

This guide explains how to create and integrate new modules into the EZ Financial app.

## Overview

Modules are self-contained, optional features that can be enabled or disabled at the organization level. They follow a consistent structure and integrate with the core app through a registration system.

## Why Modularize?

- **Flexibility**: Users can customize their app experience
- **Maintainability**: Features are isolated and easier to maintain
- **Monetization**: Modules can be free or paid
- **Scalability**: Easy to add new features without bloating the core app

## Module Structure

Each module follows this structure:

```
modules/
└── your-module/
    ├── manifest.ts          # Module metadata and configuration
    ├── convex/              # Backend functions
    │   ├── index.ts         # Re-exports all functions
    │   ├── queries.ts       # Query functions
    │   ├── mutations.ts      # Mutation functions
    │   └── ...              # Other backend files
    ├── components/          # React components
    │   └── YourComponent.tsx
    ├── routes.ts            # Route definitions
    ├── navigation.ts        # Navigation items
    ├── permissions.ts       # Module-specific permissions
    └── README.md            # Module documentation
```

## Creating a Module

### Step 1: Create Module Directory

```bash
mkdir -p modules/your-module/{convex,components}
```

### Step 2: Create Manifest

Create `modules/your-module/manifest.ts`:

```typescript
import { ModuleManifest } from "../core/types";
import { YourIcon } from "lucide-react";

export const yourModuleManifest: ModuleManifest = {
  id: "your-module",
  version: "1.0.0",
  name: "Your Module",
  description: "Description of what your module does",
  icon: YourIcon,
  category: "analytics", // or "reports", "integrations", etc.
  
  dependencies: [], // Other modules this depends on
  
  permissions: [
    "VIEW_YOUR_MODULE",
    "MANAGE_YOUR_MODULE",
  ],
  
  routes: [
    {
      path: "/your-module",
      label: "Your Module",
      requiresAuth: true,
      requiresPermission: "VIEW_YOUR_MODULE",
    },
  ],
  
  navigation: [
    {
      id: "your-module",
      label: "Your Module",
      href: "/your-module",
      icon: YourIcon,
      order: 5,
      requiresPermission: "VIEW_YOUR_MODULE",
    },
  ],
  
  billing: {
    type: "free", // or { type: "included", requiredTier: "pro" } or { type: "paid", requiredTier: "pro" }
  },
  
  dataTables: ["your_table"], // Database tables used
  
  featureFlags: {
    enableFeatureX: true,
  },
  
  metadata: {
    // Module-specific metadata
  },
};
```

### Step 3: Create Backend Functions

Create your Convex functions in `modules/your-module/convex/`:

```typescript
// modules/your-module/convex/queries.ts
import { v } from "convex/values";
import { query } from "../../../../convex/_generated/server";
import { getOrgContext } from "../../../../convex/helpers/orgContext";

export const getYourData = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { user } = await getOrgContext(ctx, args.orgId);
    
    // Check module enablement
    const enablement = await ctx.db
      .query("module_enablements")
      .withIndex("by_org_module", (q) => 
        q.eq("orgId", args.orgId).eq("moduleId", "your-module")
      )
      .first();

    if (!enablement || !enablement.enabled) {
      return []; // Return empty if module not enabled
    }
    
    // Your query logic here
    return [];
  },
});
```

**Important**: Always check module enablement in your queries/mutations!

### Step 4: Create Frontend Components

Create React components in `modules/your-module/components/`:

```typescript
// modules/your-module/components/YourComponent.tsx
"use client";

import { useModuleAccess } from "@/hooks/useModule";
import { useOrg } from "@/app/contexts/OrgContext";

export function YourComponent() {
  const { currentOrgId } = useOrg();
  const moduleAccess = useModuleAccess("your-module");
  
  if (!moduleAccess.hasAccess && !moduleAccess.isLoading) {
    return <div>Module not available</div>;
  }
  
  // Your component logic
  return <div>Your Module Content</div>;
}
```

### Step 5: Create Supporting Files

- **routes.ts**: Route definitions
- **navigation.ts**: Navigation items
- **permissions.ts**: Permission constants

### Step 6: Register Module

Add your module to `modules/register.ts`:

```typescript
import { yourModuleManifest } from "./your-module/manifest";

export function registerAllModules() {
  // ... existing modules
  registerModule(yourModuleManifest);
}
```

### Step 7: Create Backward-Compatible Export

If your module replaces existing functionality, update the old export file:

```typescript
// convex/your_feature.ts
export { getYourData } from "../modules/your-module/convex/queries";
```

## Module Enablement Checks

### Backend

Always check module enablement in queries/mutations:

```typescript
const enablement = await ctx.db
  .query("module_enablements")
  .withIndex("by_org_module", (q) => 
    q.eq("orgId", args.orgId).eq("moduleId", "your-module")
  )
  .first();

if (!enablement || !enablement.enabled) {
  return []; // or throw error
}
```

### Frontend

Use the `useModuleAccess` hook:

```typescript
const moduleAccess = useModuleAccess("your-module");
if (!moduleAccess.hasAccess) {
  // Show disabled state
}
```

## Permissions

Define module-specific permissions in `modules/your-module/permissions.ts`:

```typescript
export const YOUR_MODULE_PERMISSIONS = {
  VIEW_YOUR_MODULE: "VIEW_YOUR_MODULE",
  MANAGE_YOUR_MODULE: "MANAGE_YOUR_MODULE",
} as const;
```

Add these to the core permissions system if needed for RBAC.

## Billing

Modules can be:
- **Free**: Available to all tiers
- **Included**: Included in specific subscription tiers
- **Paid**: Requires upgrade to specific tier

Configure in the manifest's `billing` field.

## Data Handling

When a module is disabled:
- Data remains in the database (not deleted)
- Queries return empty results
- UI hides module features
- Can be re-enabled later to restore access

## Testing

Test your module:
1. Enable/disable the module
2. Verify queries return empty when disabled
3. Verify UI hides when disabled
4. Verify data persists when disabled
5. Verify re-enabling restores access

## Best Practices

1. **Isolation**: Keep module code self-contained
2. **Enablement Checks**: Always check module status
3. **Backward Compatibility**: Maintain old exports if replacing features
4. **Documentation**: Document your module in README.md
5. **Versioning**: Use semantic versioning
6. **Dependencies**: Declare module dependencies in manifest

## Example: Complete Module

See `modules/stories/` or `modules/reports/` for complete examples.

## Next Steps

1. Create your module following this guide
2. Register it in `modules/register.ts`
3. Test enable/disable functionality
4. Add to marketplace UI (if needed)
5. Document in module README

