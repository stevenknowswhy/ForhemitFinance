"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Link2, Unlink, Settings } from "lucide-react";
import MockPlaidLink from "../../components/MockPlaidLink";

export function DataSyncSettings() {
  const { toast } = useToast();
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [duplicateHandling, setDuplicateHandling] = useState("skip");

  const institutions = useQuery(api.plaid.getUserInstitutions) || [];

  const handleReconnect = (institutionId: string) => {
    // TODO: Implement Plaid reconnection
    toast({
      title: "Reconnecting...",
      description: "Please complete the connection process.",
    });
  };

  const handleDisconnect = (institutionId: string) => {
    // TODO: Implement Plaid disconnection
    toast({
      title: "Disconnected",
      description: "Bank account has been disconnected.",
    });
  };

  const handleRefresh = (institutionId: string) => {
    // TODO: Trigger manual sync
    toast({
      title: "Syncing...",
      description: "Refreshing transactions from bank account.",
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* Connected Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Connected Bank Accounts
          </CardTitle>
          <CardDescription>Manage your connected bank accounts via Plaid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {institutions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                No bank accounts connected yet.
              </p>
              <MockPlaidLink />
            </div>
          ) : (
            institutions.map((institution) => (
              <div
                key={institution._id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{institution.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {institution.syncStatus}
                  </p>
                  {institution.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(institution.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefresh(institution._id)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReconnect(institution._id)}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(institution._id)}
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {institutions.length > 0 && (
            <div className="pt-4 border-t">
              <MockPlaidLink />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sync Settings
          </CardTitle>
          <CardDescription>Configure automatic synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backgroundSync">Background Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync transactions in the background
              </p>
            </div>
            <Switch
              id="backgroundSync"
              checked={backgroundSync}
              onCheckedChange={setBackgroundSync}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categorization Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Categorization Rules</CardTitle>
          <CardDescription>
            Set up automatic categorization rules for transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCategorize">Auto-Categorize Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize transactions based on merchant names
              </p>
            </div>
            <Switch
              id="autoCategorize"
              checked={autoCategorize}
              onCheckedChange={setAutoCategorize}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicateHandling">Duplicate Transaction Handling</Label>
            <select
              id="duplicateHandling"
              value={duplicateHandling}
              onChange={(e) => setDuplicateHandling(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="skip">Skip duplicates</option>
              <option value="merge">Merge duplicates</option>
              <option value="flag">Flag for review</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

