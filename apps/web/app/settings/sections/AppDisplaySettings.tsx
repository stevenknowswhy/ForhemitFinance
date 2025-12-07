"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export function AppDisplaySettings() {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [currency, setCurrency] = useState("USD");
  const [numberFormat, setNumberFormat] = useState("us");
  const [timezone, setTimezone] = useState("America/New_York");
  const [weekStart, setWeekStart] = useState("monday");
  const [defaultHomeTab, setDefaultHomeTab] = useState("dashboard");

  // Load preferences from backend
  useEffect(() => {
    if (currentUser?.preferences) {
      setCurrency(currentUser.preferences.defaultCurrency || "USD");
      setNumberFormat(currentUser.preferences.numberFormat || "us");
      setTimezone(currentUser.preferences.timezone || "America/New_York");
      setWeekStart(currentUser.preferences.weekStart || "monday");
      setDefaultHomeTab(currentUser.preferences.defaultHomeTab || "dashboard");
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        defaultCurrency: currency,
        numberFormat: numberFormat as "us" | "eu",
        timezone,
        weekStart: weekStart as "sunday" | "monday",
        defaultHomeTab: defaultHomeTab as "dashboard" | "transactions" | "analytics",
      });

      toast({
        title: "Settings saved",
        description: "Your display preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Customize how information is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency Preference</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="AUD">AUD ($)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Formatting</Label>
            <Select value={numberFormat} onValueChange={setNumberFormat}>
              <SelectTrigger id="numberFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">US Format (1,234.56)</SelectItem>
                <SelectItem value="eu">EU Format (1.234,56)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Start Day</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger id="weekStart">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultHomeTab">Default Home Tab</Label>
            <Select value={defaultHomeTab} onValueChange={setDefaultHomeTab}>
              <SelectTrigger id="defaultHomeTab">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard Layout</CardTitle>
          <CardDescription>Customize your dashboard layout presets</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dashboard layout customization coming soon. You&apos;ll be able to choose from preset layouts or create your own.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Preferences
      </Button>
    </div>
  );
}

