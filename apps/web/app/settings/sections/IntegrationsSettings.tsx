"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, Link2, Unlink } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon?: string;
}

export function IntegrationsSettings() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Export transactions to QuickBooks",
      connected: false,
    },
    {
      id: "notion",
      name: "Notion",
      description: "Sync data to Notion workspaces",
      connected: false,
    },
    {
      id: "google_drive",
      name: "Google Drive",
      description: "Backup receipts to Google Drive",
      connected: false,
    },
    {
      id: "dropbox",
      name: "Dropbox",
      description: "Backup receipts to Dropbox",
      connected: false,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Import transactions from Stripe",
      connected: false,
    },
    {
      id: "square",
      name: "Square",
      description: "Import transactions from Square",
      connected: false,
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Sync with HubSpot CRM",
      connected: false,
    },
    {
      id: "close",
      name: "Close",
      description: "Sync with Close CRM",
      connected: false,
    },
    {
      id: "webhooks",
      name: "Webhooks",
      description: "Configure webhooks for real-time updates (Pro feature)",
      connected: false,
    },
  ]);

  const handleToggle = (id: string, connected: boolean) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id ? { ...int, connected: !connected } : int
      )
    );

    if (!connected) {
      toast({
        title: "Connecting...",
        description: `Connecting to ${integrations.find((i) => i.id === id)?.name}...`,
      });
    } else {
      toast({
        title: "Disconnected",
        description: `Disconnected from ${integrations.find((i) => i.id === id)?.name}.`,
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect third-party services to enhance your workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={integration.id} className="font-medium">
                    {integration.name}
                  </Label>
                  {integration.id === "webhooks" && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {integration.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {integration.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(integration.id, true)}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(integration.id, false)}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

