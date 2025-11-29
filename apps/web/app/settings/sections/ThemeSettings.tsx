"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast({
      title: "Theme updated",
      description: `Theme changed to ${value === "light" ? "Light" : value === "dark" ? "Dark" : "System"}.`,
    });
  };

  if (!mounted) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted-foreground">Loading theme settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme Preference</CardTitle>
          <CardDescription>
            Choose your preferred theme. This applies to the mobile app, web app, and marketing site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme || "system"} onValueChange={handleThemeChange}>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer flex-1">
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer flex-1">
                <Monitor className="w-4 h-4" />
                <span>System Preference</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

