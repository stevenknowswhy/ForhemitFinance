"use client";

/**
 * AI Insights Page
 * View and generate AI-powered financial insights
 */

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { format } from "date-fns";
import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    BarChart3,
    RefreshCw,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/use-toast";
import { Id } from "@/convex/_generated/dataModel";

const INSIGHT_ICONS: Record<string, any> = {
    monthly_narrative: BarChart3,
    alert: AlertTriangle,
    recommendation: Lightbulb,
    forecast: TrendingUp,
};

const INSIGHT_COLORS: Record<string, string> = {
    monthly_narrative: "bg-blue-500",
    alert: "bg-yellow-500",
    recommendation: "bg-purple-500",
    forecast: "bg-green-500",
};

export default function InsightsPage() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    // TODO: Get from context
    const orgId = undefined as Id<"organizations"> | undefined;
    const userId = undefined as Id<"users"> | undefined;

    // Get insights
    const insights = useQuery(
        api.ai_insights.getInsights,
        orgId ? { orgId, limit: 20 } : userId ? { userId, limit: 20 } : "skip"
    );

    // On-demand actions
    const generateForecast = useAction(api.ai_insights.generateCashFlowForecast);
    const generateRecommendations = useAction(api.ai_insights.generateSpendingRecommendations);

    const handleGenerateForecast = async () => {
        if (!orgId || !userId) {
            toast({
                title: "Error",
                description: "Please select an organization first.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating("forecast");
        try {
            const result = await generateForecast({ userId, orgId, months: 3 });
            if (result.success) {
                toast({
                    title: "Forecast Generated",
                    description: "Your 3-month cash flow forecast is ready.",
                });
            } else {
                toast({
                    title: "Could not generate forecast",
                    description: result.error || "Unknown error",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to generate forecast.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(null);
        }
    };

    const handleGenerateRecommendations = async () => {
        if (!orgId || !userId) {
            toast({
                title: "Error",
                description: "Please select an organization first.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating("recommendations");
        try {
            const result = await generateRecommendations({ userId, orgId });
            if (result.success) {
                toast({
                    title: "Analysis Complete",
                    description: "Your spending recommendations are ready.",
                });
            } else {
                toast({
                    title: "Could not generate recommendations",
                    description: result.error || "Unknown error",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to generate recommendations.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            AI Insights
                        </h1>
                    </div>
                    <p className="text-gray-500 mt-1">
                        AI-powered analysis of your financial data.
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Cash Flow Forecast
                        </CardTitle>
                        <CardDescription>
                            Predict your income and expenses for the next 3 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleGenerateForecast}
                            disabled={isGenerating === "forecast" || !orgId}
                            className="w-full"
                        >
                            {isGenerating === "forecast" ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Forecast
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-purple-600" />
                            Spending Analysis
                        </CardTitle>
                        <CardDescription>
                            Get personalized recommendations based on your spending patterns.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleGenerateRecommendations}
                            disabled={isGenerating === "recommendations" || !orgId}
                            className="w-full"
                            variant="secondary"
                        >
                            {isGenerating === "recommendations" ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Analyze Spending
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Insights</CardTitle>
                    <CardDescription>
                        AI-generated insights from your financial data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!orgId && !userId ? (
                        <div className="text-center py-12">
                            <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                Select an organization
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Please select an organization to view AI insights.
                            </p>
                        </div>
                    ) : insights === undefined ? (
                        <InsightsSkeleton />
                    ) : insights.length === 0 ? (
                        <div className="text-center py-12">
                            <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                No insights yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Generate your first insight using the buttons above, or wait for
                                the monthly automated analysis.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {insights.map((insight: any) => {
                                const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
                                const color = INSIGHT_COLORS[insight.type] || "bg-gray-500";

                                return (
                                    <div
                                        key={insight._id}
                                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <div className={`p-2 ${color} rounded-lg flex-shrink-0`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {insight.title}
                                                </h4>
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                    {insight.type.replace(/_/g, " ")}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {insight.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {format(insight.createdAt, "MMM d, yyyy 'at' h:mm a")}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function InsightsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}
