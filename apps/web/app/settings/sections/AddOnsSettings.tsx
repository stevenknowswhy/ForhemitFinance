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

// Map icon names to components
const iconMap: { [key: string]: React.ElementType } = {
  BookOpen,
  FileText,
  Sparkles,
};

export function AddOnsSettings() {
  const router = useRouter();
  const { currentOrgId, userRole } = useOrg();
  const { moduleStatuses, enableModule, disableModule } = useModuleContext();
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

  const getModuleIcon = (iconName: string) => {
    return iconMap[iconName] || Sparkles;
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
        {moduleStatuses.isLoading ? (
          <Card>
            <CardContent className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading modules...</p>
            </CardContent>
          </Card>
        ) : (
          moduleStatuses.modules.map((moduleStatus) => {
            const { manifest, isOrgEnabled } = moduleStatus;
            const Icon = getModuleIcon(manifest.icon);

            return (
              <Card key={manifest.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{manifest.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {manifest.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isOrgEnabled && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={isOrgEnabled ? "default" : "secondary"}>
                        {isOrgEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {canManageModules ? (
                      <div className="flex items-center gap-2">
                        {loadingModule === manifest.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Switch
                            checked={isOrgEnabled}
                            onCheckedChange={() => handleToggleModule(manifest.id, isOrgEnabled)}
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
          })
        )}
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

