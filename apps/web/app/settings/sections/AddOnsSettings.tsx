"use client";

/**
 * Add-ons Settings Section
 * Quick access to manage modules from Settings
 */

import { useRouter } from "next/navigation";
import { useModuleContext } from "@/contexts/ModuleContext";
import { useOrg } from "@/app/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Loader2, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";

const KNOWN_MODULES = [
  {
    id: "stories",
    name: "AI Stories",
    description: "Generate AI-powered narrative stories from your financial data",
    icon: BookOpen,
  },
  {
    id: "reports",
    name: "Financial Reports",
    description: "Generate comprehensive financial reports",
    icon: FileText,
  },
];

export function AddOnsSettings() {
  const router = useRouter();
  const { currentOrgId, userRole } = useOrg();
  const { enabledModules, enableModule, disableModule } = useModuleContext();
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

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

  const getModuleStatus = (moduleId: string) => {
    const enablement = enabledModules.modules.find(m => m.moduleId === moduleId);
    return {
      enabled: enablement?.enabled ?? false,
      isLoading: enabledModules.isLoading,
    };
  };

  const getModuleIcon = (moduleId: string) => {
    const module = KNOWN_MODULES.find(m => m.id === moduleId);
    return module?.icon || Sparkles;
  };

  if (!currentOrgId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Please select an organization to manage add-ons.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Add-ons & Modules</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable optional features for your organization
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/add-ons")}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View All Add-ons
        </Button>
      </div>

      <div className="space-y-3">
        {KNOWN_MODULES.map((module) => {
          const Icon = getModuleIcon(module.id);
          const status = getModuleStatus(module.id);

          return (
            <Card key={module.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  {status.enabled && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.enabled ? "default" : "secondary"}>
                      {status.enabled ? "Enabled" : "Disabled"}
                    </Badge>
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
                    <p className="text-xs text-muted-foreground">
                      Requires admin access
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canManageModules && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Only organization owners and admins can manage add-ons. Contact your administrator to enable or disable modules.
          </p>
        </div>
      )}
    </div>
  );
}

