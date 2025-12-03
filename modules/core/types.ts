/**
 * Core types for the module system
 */

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

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
  component?: ReactNode | (() => ReactNode);
  label?: string;
  icon?: LucideIcon;
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
  icon?: LucideIcon;
  badge?: string | number;
  order?: number;
  requiresPermission?: string;
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
  icon?: string | LucideIcon;
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

