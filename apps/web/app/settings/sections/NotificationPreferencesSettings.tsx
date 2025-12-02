"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function NotificationPreferencesSettings() {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [weeklyBurnRate, setWeeklyBurnRate] = useState(true);
  const [monthlyCashFlow, setMonthlyCashFlow] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Load preferences from backend
  useEffect(() => {
    if (currentUser?.preferences) {
      setTransactionAlerts(currentUser.preferences.transactionAlerts ?? true);
      setWeeklyBurnRate(currentUser.preferences.weeklyBurnRate ?? true);
      setMonthlyCashFlow(currentUser.preferences.monthlyCashFlow ?? true);
      setAnomalyAlerts(currentUser.preferences.anomalyAlerts ?? true);
      setPushNotifications(currentUser.preferences.pushNotifications ?? true);
      setEmailNotifications(currentUser.preferences.emailNotifications ?? true);
      setSmsAlerts(currentUser.preferences.smsAlerts ?? false);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        transactionAlerts,
        weeklyBurnRate,
        monthlyCashFlow,
        anomalyAlerts,
        pushNotifications,
        emailNotifications,
        smsAlerts,
      });

      toast({
        title: "Notification preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Transaction Alerts
          </CardTitle>
          <CardDescription>Get notified about important transaction events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="transactionAlerts">Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts for new transactions and updates
              </p>
            </div>
            <Switch
              id="transactionAlerts"
              checked={transactionAlerts}
              onCheckedChange={setTransactionAlerts}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports</CardTitle>
          <CardDescription>Weekly and monthly financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyBurnRate">Weekly Burn Rate Report</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly burn rate summaries
              </p>
            </div>
            <Switch
              id="weeklyBurnRate"
              checked={weeklyBurnRate}
              onCheckedChange={setWeeklyBurnRate}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthlyCashFlow">Monthly Cash Flow Report</Label>
              <p className="text-sm text-muted-foreground">
                Receive monthly cash flow summaries
              </p>
            </div>
            <Switch
              id="monthlyCashFlow"
              checked={monthlyCashFlow}
              onCheckedChange={setMonthlyCashFlow}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anomaly Detection</CardTitle>
          <CardDescription>Alerts for unusual transaction patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anomalyAlerts">Anomaly Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when potential anomalies are detected
              </p>
            </div>
            <Switch
              id="anomalyAlerts"
              checked={anomalyAlerts}
              onCheckedChange={setAnomalyAlerts}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Methods</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your devices
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsAlerts">SMS Alerts for Billing</Label>
              <p className="text-sm text-muted-foreground">
                Receive SMS alerts for billing-related events
              </p>
            </div>
            <Switch
              id="smsAlerts"
              checked={smsAlerts}
              onCheckedChange={setSmsAlerts}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Notification Preferences
      </Button>
    </div>
  );
}

