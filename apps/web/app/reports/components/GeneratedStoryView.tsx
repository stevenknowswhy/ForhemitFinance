"use client";

/**
 * Generated Story View Component
 * Displays preview of generated story with key metrics and insights
 */

import { Calendar, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedStoryViewProps {
  story: {
    title: string;
    content: string;
    keyMetrics: Record<string, any>;
    insight?: string;
    updatedAt: number;
  };
}

export function GeneratedStoryView({ story }: GeneratedStoryViewProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMetricName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatMetricValue = (key: string, value: any): string => {
    if (typeof value === "string") return value;

    const currencyMetrics = ["revenue", "expenses", "netIncome", "cashFlow", "burnRate"];
    const percentMetrics = ["growthRate", "revenueGrowth", "churn", "retention"];
    const ratioMetrics = ["debtToRevenue", "debtToIncome", "ltvCac"];

    if (currencyMetrics.includes(key)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else if (percentMetrics.includes(key)) {
      return `${value.toFixed(1)}%`;
    } else if (ratioMetrics.includes(key)) {
      return value.toFixed(2);
    } else if (key === "runway") {
      return `${value.toFixed(1)} months`;
    }

    return value.toString();
  };

  return (
    <div className="space-y-4">
      {/* Story Title with Date */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-semibold text-foreground text-base">{story.title}</h4>
        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
          <Calendar className="h-3 w-3" />
          {formatDate(story.updatedAt)}
        </span>
      </div>

      {/* Story Preview */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-sm text-foreground line-clamp-3 leading-relaxed">{story.content}</p>
      </div>

      {/* Key Metrics Grid */}
      {story.keyMetrics && Object.keys(story.keyMetrics).length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          {Object.entries(story.keyMetrics)
            .slice(0, 4)
            .map(([key, value]) => (
              <div 
                key={key} 
                className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3 border border-border/50 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors"
              >
                <p className="text-xs text-muted-foreground mb-1 capitalize font-medium">
                  {formatMetricName(key)}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatMetricValue(key, value)}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Insight Badge */}
      {story.insight && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{story.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
