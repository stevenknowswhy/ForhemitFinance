"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function AIPersonalizationSettings() {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [strictness, setStrictness] = useState([50]);
  const [showExplanations, setShowExplanations] = useState(true);
  const [aiTone, setAiTone] = useState("friendly");
  const [confidenceThreshold, setConfidenceThreshold] = useState([70]);

  // Load preferences from backend
  useEffect(() => {
    if (currentUser?.preferences) {
      setStrictness([currentUser.preferences.aiStrictness ?? 50]);
      setShowExplanations(currentUser.preferences.showExplanations ?? true);
      setAiTone(currentUser.preferences.aiTone || "friendly");
      setConfidenceThreshold([currentUser.preferences.confidenceThreshold ?? 70]);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        aiInsightLevel: strictness[0] < 33 ? "low" : strictness[0] < 66 ? "medium" : "high",
        aiStrictness: strictness[0],
        showExplanations,
        aiTone: aiTone as "friendly" | "professional" | "technical",
        confidenceThreshold: confidenceThreshold[0],
      });

      toast({
        title: "Settings saved",
        description: "Your AI personalization preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStrictnessLabel = (value: number) => {
    if (value < 25) return "Very Loose";
    if (value < 50) return "Loose";
    if (value < 75) return "Strict";
    return "Very Strict";
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Categorization Strictness
          </CardTitle>
          <CardDescription>
            Control how strictly the AI categorizes transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Strictness Level</Label>
              <span className="text-sm font-medium">
                {getStrictnessLabel(strictness[0])}
              </span>
            </div>
            <Slider
              value={strictness}
              onValueChange={setStrictness}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Loose</span>
              <span>Very Strict</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Explanations</CardTitle>
          <CardDescription>
            Show explanations for AI decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showExplanations">Show AI Explanations</Label>
              <p className="text-sm text-muted-foreground">
                Display why the AI chose specific double-entry accounts
              </p>
            </div>
            <Switch
              id="showExplanations"
              checked={showExplanations}
              onCheckedChange={setShowExplanations}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Tone</CardTitle>
          <CardDescription>
            Choose the tone for AI-generated explanations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="aiTone">Tone Preference</Label>
            <Select value={aiTone} onValueChange={setAiTone}>
              <SelectTrigger id="aiTone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="minimalistic">Minimalistic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorization Confidence</CardTitle>
          <CardDescription>
            Minimum confidence threshold for auto-categorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Confidence Threshold</Label>
              <span className="text-sm font-medium">{confidenceThreshold[0]}%</span>
            </div>
            <Slider
              value={confidenceThreshold}
              onValueChange={setConfidenceThreshold}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save AI Preferences
      </Button>
    </div>
  );
}

