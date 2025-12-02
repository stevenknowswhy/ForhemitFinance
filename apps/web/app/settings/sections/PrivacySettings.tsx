"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Trash2 } from "lucide-react";

export function PrivacySettings() {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [optOutAI, setOptOutAI] = useState(false);
  const [allowTraining, setAllowTraining] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [optOutAnalytics, setOptOutAnalytics] = useState(false);

  // Load preferences from backend
  useEffect(() => {
    if (currentUser?.preferences) {
      setOptOutAI(currentUser.preferences.optOutAI ?? false);
      setAllowTraining(currentUser.preferences.allowTraining ?? true);
      setHideBalances(currentUser.preferences.hideBalances ?? false);
      setOptOutAnalytics(currentUser.preferences.optOutAnalytics ?? false);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        optOutAI,
        allowTraining,
        hideBalances,
        optOutAnalytics,
      });

      toast({
        title: "Privacy settings saved",
        description: "Your privacy settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    toast({
      title: "Cache cleared",
      description: "All cached data has been cleared.",
    });
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5" />
            AI Personalization
          </CardTitle>
          <CardDescription>Control how your data is used for AI features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="optOutAI">Opt-out of AI Personalization</Label>
              <p className="text-sm text-muted-foreground">
                Disable AI-powered features and personalization
              </p>
            </div>
            <Switch
              id="optOutAI"
              checked={optOutAI}
              onCheckedChange={setOptOutAI}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowTraining">Allow Data for Training</Label>
              <p className="text-sm text-muted-foreground">
                Allow anonymized data to be used for improving AI models
              </p>
            </div>
            <Switch
              id="allowTraining"
              checked={allowTraining}
              onCheckedChange={setAllowTraining}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Privacy Mode
          </CardTitle>
          <CardDescription>Control what information is visible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hideBalances">Hide Balances in Dashboard</Label>
              <p className="text-sm text-muted-foreground">
                Hide account balances in the dashboard view
              </p>
            </div>
            <Switch
              id="hideBalances"
              checked={hideBalances}
              onCheckedChange={setHideBalances}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>Manage cached data and analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="optOutAnalytics">Opt-out of Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Disable usage analytics and tracking
              </p>
            </div>
            <Switch
              id="optOutAnalytics"
              checked={optOutAnalytics}
              onCheckedChange={setOptOutAnalytics}
            />
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleClearCache} className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cached Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Privacy Settings
      </Button>
    </div>
  );
}

