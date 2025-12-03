"use client";

/**
 * ModuleContext
 * Provides module management functionality and state
 */

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrg } from "@/app/contexts/OrgContext";
import { useModule, useModuleAccess } from "../hooks/useModule";
import { useEnabledModules, useModuleStatuses } from "../hooks/useEnabledModules";
import { useToast } from "@/components/ui/hooks/use-toast";

interface ModuleContextType {
  // Module queries
  enabledModules: ReturnType<typeof useEnabledModules>;
  moduleStatuses: ReturnType<typeof useModuleStatuses>;

  // Module management functions
  enableModule: (moduleId: string, metadata?: any) => Promise<void>;
  disableModule: (moduleId: string) => Promise<void>;
  setUserOverride: (moduleId: string, enabled: boolean) => Promise<void>;

  // Helper functions
  isModuleEnabled: (moduleId: string) => boolean | undefined;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleContextProvider({ children }: { children: ReactNode }) {
  const { currentOrgId, currentUserId } = useOrg();
  const { toast } = useToast();

  const enabledModules = useEnabledModules();
  const moduleStatuses = useModuleStatuses();

  const enableModuleMutation = useMutation(api.modules.enableModule);
  const disableModuleMutation = useMutation(api.modules.disableModule);
  const setUserOverrideMutation = useMutation(api.modules.setUserModuleOverride);

  const enableModule = async (moduleId: string, metadata?: any) => {
    if (!currentOrgId) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await enableModuleMutation({
        orgId: currentOrgId,
        moduleId,
        metadata,
      });

      toast({
        title: "Module Enabled",
        description: `${moduleId} has been enabled for your organization`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enable module",
        variant: "destructive",
      });
    }
  };

  const disableModule = async (moduleId: string) => {
    if (!currentOrgId) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await disableModuleMutation({
        orgId: currentOrgId,
        moduleId,
      });

      toast({
        title: "Module Disabled",
        description: `${moduleId} has been disabled for your organization`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable module",
        variant: "destructive",
      });
    }
  };

  const setUserOverride = async (moduleId: string, enabled: boolean) => {
    if (!currentOrgId || !currentUserId) {
      toast({
        title: "Error",
        description: "No organization or user selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await setUserOverrideMutation({
        orgId: currentOrgId,
        moduleId,
        userId: currentUserId,
        enabled,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user preference",
        variant: "destructive",
      });
    }
  };

  const isModuleEnabled = (moduleId: string): boolean | undefined => {
    const module = enabledModules.modules.find(m => m.moduleId === moduleId);
    return module?.enabled;
  };

  return (
    <ModuleContext.Provider
      value={{
        enabledModules,
        moduleStatuses,
        enableModule,
        disableModule,
        setUserOverride,
        isModuleEnabled,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModuleContext() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error("useModuleContext must be used within a ModuleContextProvider");
  }
  return context;
}

