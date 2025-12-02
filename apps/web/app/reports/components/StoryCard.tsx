"use client";

/**
 * Story Card Component
 * Displays a preview card for an AI-generated story
 */

import { BookOpen, Building2, TrendingUp, Calendar, Eye, Download, Sparkles, RefreshCw, CheckCircle2, FileText, Loader2, Database, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STORY_CONFIGS } from "./storyConfig";
import { GeneratedStoryView } from "./GeneratedStoryView";

interface StoryCardProps {
  storyType: "company" | "banker" | "investor";
  periodType: "monthly" | "quarterly" | "annually";
  title: string;
  summary: string;
  lastUpdated: number;
  onView: () => void;
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onExport?: () => void;
  hasStory: boolean;
  isGenerating?: boolean;
  generationStatus?: "pending" | "generating" | "completed" | "failed";
  generationError?: string;
  story?: {
    narrative?: string;
    keyMetrics?: Record<string, any>;
    insight?: string;
  };
}

const storyTypeConfig = {
  company: {
    label: "Company Story",
    icon: BookOpen,
    description: "Internal compass - burn rate, trends, cash runway",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  banker: {
    label: "Banker Story",
    icon: Building2,
    description: "Financial credibility - debt ratios, cash flow reliability",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
    iconBg: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  },
  investor: {
    label: "Investor Story",
    icon: TrendingUp,
    description: "Growth thesis - revenue efficiency, 12-24 month outlook",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
};

const periodTypeLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annual",
};

const periodTypeColors = {
  monthly: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  quarterly: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  annually: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export function StoryCard({
  storyType,
  periodType,
  title,
  summary,
  lastUpdated,
  onView,
  onGenerate,
  onRegenerate,
  onExport,
  hasStory,
  isGenerating = false,
  generationStatus,
  generationError,
  story,
}: StoryCardProps) {
  const config = storyTypeConfig[storyType];
  const Icon = config.icon;
  const periodColor = periodTypeColors[periodType];
  // Handle annually by falling back to quarterly config (annually not yet implemented in STORY_CONFIGS)
  const storyConfig = periodType === "annually" 
    ? STORY_CONFIGS[storyType]?.["quarterly"]
    : (periodType === "monthly" || periodType === "quarterly")
    ? STORY_CONFIGS[storyType]?.[periodType]
    : undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-lg",
        hasStory && "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20",
        isGenerating && "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 animate-pulse",
        !hasStory && !isGenerating && `${periodColor.border} border-2`
      )}
    >
      {/* Status indicator */}
      {generationStatus === "completed" && hasStory && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Generated
          </Badge>
        </div>
      )}
      {generationStatus === "generating" && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </Badge>
        </div>
      )}
      {generationStatus === "pending" && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pending
          </Badge>
        </div>
      )}
      {generationStatus === "failed" && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="destructive" className="gap-1" title={generationError}>
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-lg", config.iconBg)}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CardTitle className="text-lg">{config.label}</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  periodType === "monthly" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
                  periodType === "quarterly" && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
                  periodType === "annually" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                )}
              >
                {periodTypeLabels[periodType]}
              </Badge>
            </div>
            <CardDescription className="text-sm">{config.description}</CardDescription>
            {/* Data freshness indicator */}
            {hasStory && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Database className="h-3 w-3" />
                <span>Updated {formatDate(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {(isGenerating || generationStatus === "generating" || generationStatus === "pending") ? (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <h4 className="text-sm font-medium text-foreground mb-2">Generating your story...</h4>
            <p className="text-xs text-muted-foreground mb-4">Analyzing financial data and crafting narrative</p>
            {/* Progress bar with animation */}
            <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: "60%" }}
              >
                <div className="absolute inset-0 bg-blue-400 dark:bg-blue-500 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Processing sections...</p>
          </div>
        ) : generationStatus === "failed" ? (
          <div className="py-8 text-center">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-foreground mb-2">Generation Failed</h4>
            <p className="text-xs text-muted-foreground mb-4">
              {generationError || "An error occurred while generating the story"}
            </p>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        ) : hasStory ? (
          <GeneratedStoryView
            story={{
              title,
              content: story?.narrative || summary,
              keyMetrics: story?.keyMetrics || {},
              insight: story?.insight,
              updatedAt: lastUpdated,
            }}
          />
        ) : (
          <div className="py-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>

            <h4 className="text-sm font-medium text-foreground mb-2">No story generated yet</h4>

            {storyConfig && (
              <>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Generate an AI-powered narrative as a <strong className="font-semibold text-foreground">{storyConfig.role}</strong> focusing on:
                </p>

                <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 text-left max-w-xs mx-auto">
                  {storyConfig.focuses?.map((focus, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{focus}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="text-xs text-muted-foreground italic">Click "Generate" to create this story</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {hasStory && generationStatus === "completed" ? (
          <>
            <Button onClick={onView} className="flex-1" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Full Story
            </Button>
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="outline"
                size="icon"
                disabled={isGenerating || generationStatus === "generating" || generationStatus === "pending"}
                title="Regenerate story"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {onExport && (
              <Button onClick={onExport} variant="outline" size="icon" title="Export story">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : generationStatus === "failed" ? (
          <Button
            onClick={onRegenerate || onGenerate}
            className="w-full"
            size="sm"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Generation
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onGenerate}
            className="w-full"
            size="sm"
            disabled={isGenerating || generationStatus === "generating" || generationStatus === "pending"}
          >
            {isGenerating || generationStatus === "generating" || generationStatus === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Story
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
