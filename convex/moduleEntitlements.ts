/**
 * Module Entitlements
 * Maps subscription plans to module access
 */

import { Id } from "./_generated/dataModel";
import { SubscriptionTier } from "./subscriptions";

/**
 * Plan-to-module mapping
 * Defines which modules are included in which subscription tiers
 */
export const PLAN_MODULE_ACCESS: Record<SubscriptionTier, string[]> = {
  solo: [
    // Solo tier: Basic modules only
    "reports", // Basic reports are free
  ],
  light: [
    // Light tier: All solo modules + light-specific
    "reports",
    "stories", // Stories included in light
  ],
  pro: [
    // Pro tier: All modules
    "reports",
    "stories",
    // Future paid modules would go here
  ],
};

/**
 * Check if a subscription tier includes access to a module
 */
export function planIncludesModule(tier: SubscriptionTier, moduleId: string): boolean {
  const modules = PLAN_MODULE_ACCESS[tier] || [];
  return modules.includes(moduleId);
}

/**
 * Get all modules included in a subscription tier
 */
export function getModulesForPlan(tier: SubscriptionTier): string[] {
  return PLAN_MODULE_ACCESS[tier] || [];
}

/**
 * Get modules that should be auto-enabled when upgrading to a tier
 */
export function getModulesToEnableOnUpgrade(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier
): string[] {
  const currentModules = getModulesForPlan(currentTier);
  const newModules = getModulesForPlan(newTier);
  
  // Return modules that are in new tier but not in current tier
  return newModules.filter(moduleId => !currentModules.includes(moduleId));
}

/**
 * Get modules that should be auto-disabled when downgrading from a tier
 */
export function getModulesToDisableOnDowngrade(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier
): string[] {
  const currentModules = getModulesForPlan(currentTier);
  const newModules = getModulesForPlan(newTier);
  
  // Return modules that are in current tier but not in new tier
  return currentModules.filter(moduleId => !newModules.includes(moduleId));
}

/**
 * Check if a module requires a paid subscription
 */
export function isModulePaid(moduleId: string): boolean {
  // Check if module is only in paid tiers (not in solo)
  const soloModules = PLAN_MODULE_ACCESS.solo || [];
  return !soloModules.includes(moduleId);
}

