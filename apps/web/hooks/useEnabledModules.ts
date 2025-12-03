/**
 * useEnabledModules Hook
 * Hook for getting all enabled modules for the current org
 */

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrg } from "@/app/contexts/OrgContext";

export interface ModuleEnablement {
  moduleId: string;
  enabled: boolean;
  enabledBy: string;
  enabledAt: number;
  userOverrides?: Array<{
    userId: string;
    enabled: boolean;
  }>;
  metadata?: any;
}

export interface ModuleStatus {
  manifest: {
    id: string;
    version: string;
    name: string;
    description: string;
    icon: string;
    category?: string;
    billing: any;
    permissions?: string[];
    routes?: any[];
    navigation?: any[];
    insightsNavigation?: {
      sidebarItems: Array<{
        id: string;
        label: string;
        icon?: string;
        href?: string;
        subSections?: Array<{
          id: string;
          label: string;
          icon?: string;
        }>;
      }>;
    };
    featureFlags?: Record<string, boolean>;
    metadata?: any;
  };
  isOrgEnabled: boolean;
  isUserEnabled: boolean;
  hasEntitlement: boolean;
  userOverride?: boolean;
}

/**
 * Get all enabled modules for the current org
 */
export function useEnabledModules(): {
  modules: ModuleEnablement[];
  isLoading: boolean;
} {
  const { currentOrgId } = useOrg();

  const modules = useQuery(
    api.modules.getEnabledModules,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  return {
    modules: modules || [],
    isLoading: modules === undefined && currentOrgId !== null,
  };
}

/**
 * Get all modules with their status for the current org
 */
export function useModuleStatuses(): {
  modules: ModuleStatus[];
  isLoading: boolean;
} {
  const { currentOrgId } = useOrg();

  const moduleStatuses = useQuery(
    api.modules.getOrgModuleStatus,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  return {
    modules: moduleStatuses || [],
    isLoading: moduleStatuses === undefined && currentOrgId !== null,
  };
}

