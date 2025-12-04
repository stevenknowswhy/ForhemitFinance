/**
 * Core types for the module system
 */

/**
 * Module ID - unique identifier for each module
 */
export type ModuleId = string;

/**
 * Module version - semantic versioning
 */
export type ModuleVersion = string;

/**
 * Subscription tier requirements
 */
export type SubscriptionTier = "solo" | "light" | "pro";

/**
 * Billing type for modules
 */
export type ModuleBilling =
  | { type: "free" } // Available to all tiers
  | { type: "included"; requiredTier: SubscriptionTier } // Included in specific tier
  | { type: "paid"; requiredTier: SubscriptionTier }; // Requires upgrade

/**
 * Route definition for a module
 */
export interface ModuleRoute {
  path: string;
  // component removed as it causes issues in backend
  label?: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresPermission?: string;
}

/**
 * Navigation item definition
 */
export interface ModuleNavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  order?: number;
  requiresPermission?: string;
}

/**
 * Insights sidebar item definition
 */
export interface InsightsSidebarItem {
  id: string;
  label: string;
  icon?: string; // Icon name as string (e.g., "BookOpen", "FileText")
  href?: string; // Optional href for direct navigation
  subSections?: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
}

/**
 * Insights navigation configuration for modules
 */
export interface InsightsNavigation {
  sidebarItems: InsightsSidebarItem[];
}

/**
 * Module dependency
 */
export interface ModuleDependency {
  moduleId: ModuleId;
  version?: string; // Optional version requirement
}

/**
 * Module manifest - defines a module's metadata and configuration
 */
export interface ModuleManifest {
  // Core identification
  id: ModuleId;
  version: ModuleVersion;

  // Metadata
  name: string;
  description: string;
  icon?: string;
  category?: string;

  // Dependencies
  dependencies?: ModuleDependency[];
  requiredCoreVersion?: ModuleVersion;

  // Permissions
  permissions?: string[]; // Module-specific permissions

  // Routes
  routes?: ModuleRoute[];

  // Navigation
  navigation?: ModuleNavigationItem[];

  // Insights navigation (for modules that contribute to Insights tab)
  insightsNavigation?: InsightsNavigation;

  // Billing
  billing: ModuleBilling;

  // Data schema
  dataTables?: string[]; // Database tables used by this module

  // Feature flags
  featureFlags?: Record<string, boolean>;

  // Module-specific metadata
  metadata?: Record<string, any>;
}

/**
 * Module enablement status
 */
export interface ModuleEnablement {
  orgId: string;
  moduleId: ModuleId;
  enabled: boolean;
  enabledBy: string;
  enabledAt: number;
  userOverrides?: Array<{
    userId: string;
    enabled: boolean;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Module entitlement (for paid modules)
 */
export interface ModuleEntitlement {
  orgId: string;
  moduleId: ModuleId;
  planId: string;
  status: "active" | "trial" | "expired" | "cancelled";
  trialEndsAt?: number;
  expiresAt?: number;
}

/**
 * Module access check result
 */
export interface ModuleAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  requiredTier?: SubscriptionTier;
}

