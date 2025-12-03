/**
 * useModule Hook
 * Hook for checking module access and status
 */

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useOrg } from "@/app/contexts/OrgContext";

export interface ModuleAccess {
  hasAccess: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  isLoading: boolean;
}

/**
 * Check if a module is enabled for the current org
 */
export function useModule(moduleId: string): {
  isEnabled: boolean | undefined;
  enablement: any;
  isLoading: boolean;
} {
  const { currentOrgId } = useOrg();

  const enablement = useQuery(
    api.modules.getModuleEnablement,
    currentOrgId ? { orgId: currentOrgId, moduleId } : "skip"
  );

  return {
    isEnabled: enablement?.enabled,
    enablement,
    isLoading: enablement === undefined && currentOrgId !== null,
  };
}

/**
 * Check if user has access to a module (with user-level overrides)
 */
export function useModuleAccess(moduleId: string): ModuleAccess {
  const { currentOrgId, currentUserId } = useOrg();

  const access = useQuery(
    api.modules.checkModuleAccess,
    currentOrgId && currentUserId
      ? { orgId: currentOrgId, moduleId, userId: currentUserId }
      : "skip"
  );

  const entitlement = useQuery(
    api.modules.checkModuleEntitlement,
    currentOrgId ? { orgId: currentOrgId, moduleId } : "skip"
  );

  const isLoading = access === undefined || entitlement === undefined;

  if (isLoading) {
    return { hasAccess: false, isLoading: true };
  }

  // Check both access and entitlement
  const hasAccess = access?.hasAccess && entitlement?.hasAccess;

  return {
    hasAccess: hasAccess ?? false,
    reason: access?.reason || entitlement?.reason,
    requiresUpgrade: entitlement?.requiresUpgrade,
    isLoading: false,
  };
}

