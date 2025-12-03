"use client";

/**
 * Story Generator Component
 * Modal/dialog for manually generating stories
 */

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StoryGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyType: "company" | "banker" | "investor";
  initialPeriodType?: "monthly" | "quarterly" | "annually";
  onSuccess?: () => void;
}

export function StoryGenerator({
  open,
  onOpenChange,
  storyType,
  initialPeriodType = "monthly",
  onSuccess,
}: StoryGeneratorProps) {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "annually">(initialPeriodType);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCompanyStory = useAction(api.ai_stories.generateCompanyStory);
  const generateBankerStory = useAction(api.ai_stories.generateBankerStory);
  const generateInvestorStory = useAction(api.ai_stories.generateInvestorStory);

  const calculateDateRange = (type: "monthly" | "quarterly" | "annually") => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();

    if (type === "monthly") {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (type === "quarterly") {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3 - 3);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const handlePeriodTypeChange = (value: "monthly" | "quarterly" | "annually") => {
    setPeriodType(value);
    const range = calculateDateRange(value);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select a date range for the story.",
        variant: "destructive",
      });
      return;
    }

    const periodStart = new Date(startDate).getTime();
    const periodEnd = new Date(endDate).getTime();

    // Validate date range
    if (periodStart >= periodEnd) {
      toast({
        title: "Invalid date range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    // Check if date range is too large
    const daysDiff = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      toast({
        title: "Date range too large",
        description: "Please select a date range of 365 days or less.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let result;
      if (storyType === "company") {
        result = await generateCompanyStory({ periodStart, periodEnd, periodType });
      } else if (storyType === "banker") {
        result = await generateBankerStory({ periodStart, periodEnd, periodType });
      } else {
        result = await generateInvestorStory({ periodStart, periodEnd, periodType });
      }

      if (result.success) {
        toast({
          title: "Story generation started",
          description: `Your ${storyType} story is being generated in the background. You'll be notified when it's ready.`,
        });

        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error || "Story generation failed");
      }
    } catch (error: any) {
      console.error("Failed to generate story:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to generate story. Please try again.";
      if (error?.message) {
        if (error.message.includes("OPENROUTER_API_KEY")) {
          errorMessage = "OpenRouter API key is not configured. Please contact support.";
        } else if (error.message.includes("OpenRouter API error")) {
          errorMessage = "AI service error. Please try again in a moment.";
        } else if (error.message.includes("No data")) {
          errorMessage = "No financial data found for the selected period. Please ensure you have transactions in this date range.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize date range when dialog opens or period type changes
  useEffect(() => {
    if (open) {
      setPeriodType(initialPeriodType);
      const range = calculateDateRange(initialPeriodType);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [open, initialPeriodType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate {storyType === "company" ? "Company" : storyType === "banker" ? "Banker" : "Investor"} Story</DialogTitle>
          <DialogDescription>
            Select the period type and date range for your story.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="periodType">Period Type</Label>
            <Select value={periodType} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger id="periodType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !startDate || !endDate}>
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Story
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
