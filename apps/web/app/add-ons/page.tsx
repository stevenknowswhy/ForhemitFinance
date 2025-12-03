"use client";

/**
 * Add-ons Marketplace Page
 * Browse and manage available modules
 */

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useOrg } from "@/app/contexts/OrgContext";
import { useModuleContext } from "@/contexts/ModuleContext";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BookOpen, FileText, Loader2, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useModuleAccess } from "@/hooks/useModule";
// Note: Module registry is server-side only for now
// For client-side, we'll need to fetch available modules from the backend
// For now, we'll hardcode the known modules
const KNOWN_MODULES = [
  {
    id: "stories",
    name: "AI Stories",
    description: "Generate AI-powered narrative stories from your financial data.",
    icon: BookOpen,
    billing: { type: "free" as const },
    version: "1.0.0",
  },
  {
    id: "reports",
    name: "Financial Reports",
    description: "Generate comprehensive financial reports including P&L, Balance Sheet, and more.",
    icon: FileText,
    billing: { type: "free" as const },
    version: "1.0.0",
  },
];
import { useState } from "react";

export default function AddOnsPage() {
  const { currentOrgId, userRole } = useOrg();
  const { enabledModules, enableModule, disableModule } = useModuleContext();
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  // Get all available modules (hardcoded for now, will be fetched from backend later)
  const allModules = KNOWN_MODULES;

  const canManageModules = userRole === "ORG_OWNER" || userRole === "ORG_ADMIN";

  const handleToggleModule = async (moduleId: string, currentlyEnabled: boolean) => {
    if (!canManageModules) {
      return;
    }

    setLoadingModule(moduleId);
    try {
      if (currentlyEnabled) {
        await disableModule(moduleId);
      } else {
        await enableModule(moduleId);
      }
    } catch (error) {
      console.error("Failed to toggle module:", error);
    } finally {
      setLoadingModule(null);
    }
  };

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case "stories":
        return BookOpen;
      case "reports":
        return FileText;
      default:
        return Sparkles;
    }
  };

  const getModuleStatus = (moduleId: string) => {
    const enablement = enabledModules.modules.find(m => m.moduleId === moduleId);
    return {
      enabled: enablement?.enabled ?? false,
      isLoading: enabledModules.isLoading,
    };
  };

  const getBillingBadge = (billing: any) => {
    if (billing.type === "free") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Free</Badge>;
    } else if (billing.type === "included") {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Included in {billing.requiredTier}</Badge>;
    } else {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Upgrade to {billing.requiredTier}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DesktopNavigation />
      
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add-ons & Modules</h1>
          <p className="text-muted-foreground">
            Enhance your financial app with optional modules. Enable or disable features as needed.
          </p>
        </div>

        {!currentOrgId ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Please select an organization to manage add-ons.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allModules.map((module) => {
              const Icon = getModuleIcon(module.id);
              const status = getModuleStatus(module.id);
              const isLocked = module.billing.type === "paid" && !status.enabled;

              return (
                <Card key={module.id} className={isLocked ? "opacity-75" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{module.name}</CardTitle>
                          {getBillingBadge(module.billing)}
                        </div>
                      </div>
                      {status.enabled && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {status.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      {canManageModules ? (
                        <div className="flex items-center gap-2">
                          {loadingModule === module.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Switch
                              checked={status.enabled}
                              onCheckedChange={() => handleToggleModule(module.id, status.enabled)}
                              disabled={loadingModule !== null}
                            />
                          )}
                        </div>
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {module.metadata && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          Version {module.version}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}

