/**
 * Permission system for multi-tenant RBAC
 * Phase 1: Shared Foundation
 */

export const PERMISSIONS = {
  // Organization management
  MANAGE_ORG_SETTINGS: "MANAGE_ORG_SETTINGS",
  MANAGE_TEAM: "MANAGE_TEAM",
  MANAGE_SUBSCRIPTION: "MANAGE_SUBSCRIPTION",

  // Financial data
  VIEW_FINANCIALS: "VIEW_FINANCIALS",
  EDIT_TRANSACTIONS: "EDIT_TRANSACTIONS",
  APPROVE_ENTRIES: "APPROVE_ENTRIES",

  // Advanced operations
  RUN_APP_RESET: "RUN_APP_RESET",
  MANAGE_INTEGRATIONS: "MANAGE_INTEGRATIONS",
  
  // Module management
  MANAGE_MODULES: "MANAGE_MODULES",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type Role = "ORG_OWNER" | "ORG_ADMIN" | "BOOKKEEPER" | "VIEWER";

/**
 * Role-to-permission mapping
 * ORG_OWNER has all permissions
 * Other roles have specific subsets
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ORG_OWNER: [
    PERMISSIONS.MANAGE_ORG_SETTINGS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
    PERMISSIONS.RUN_APP_RESET,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_MODULES,
  ],
  ORG_ADMIN: [
    PERMISSIONS.MANAGE_ORG_SETTINGS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_MODULES,
  ],
  BOOKKEEPER: [
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.APPROVE_ENTRIES,
  ],
  VIEWER: [
    PERMISSIONS.VIEW_FINANCIALS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return rolePerms.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}
