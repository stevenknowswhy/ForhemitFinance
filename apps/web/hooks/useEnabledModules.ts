/**
 * useEnabledModules Hook
 * Hook for getting all enabled modules for the current org
 */

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
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

