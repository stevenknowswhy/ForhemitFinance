"use client";

/**
 * Stories Tab Component
 * Main component for AI Stories feature (Phase 2)
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { StoryCard } from "./StoryCard";
import { StoryView } from "./StoryView";
import { StoryGenerator } from "./StoryGenerator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, AlertTriangle, Download, Loader2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import { generateAndDownloadPDF } from "@/lib/storyPdfGenerator";
import { useNotifications } from "@/app/contexts/NotificationContext";
import { useModuleAccess } from "../../../hooks/useModule";
import { useOrg } from "@/app/contexts/OrgContext";

export function StoriesTab() {
  const { toast } = useToast();
  const { notifications } = useNotifications();
  const { currentOrgId } = useOrg();
  const moduleAccess = useModuleAccess("stories");
  
  // Check if module is enabled
  if (!moduleAccess.hasAccess && !moduleAccess.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Stories Module Not Available</h3>
        <p className="text-muted-foreground text-center max-w-md">
          The Stories module is not enabled for your organization. Contact your administrator to enable it.
        </p>
      </div>
    );
  }
  
  const stories = useQuery(
    api.ai_stories.getStories, 
    currentOrgId ? { orgId: currentOrgId } : {}
  );
  const exportStory = useAction(api.ai_stories.exportStory);
  const generateCompanyStory = useAction(api.ai_stories.generateCompanyStory);
  const generateBankerStory = useAction(api.ai_stories.generateBankerStory);
  const generateInvestorStory = useAction(api.ai_stories.generateInvestorStory);
  const [selectedStory, setSelectedStory] = useState<Id<"ai_stories"> | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorStoryType, setGeneratorStoryType] = useState<"company" | "banker" | "investor">("company");
  const [generatorPeriodType, setGeneratorPeriodType] = useState<"monthly" | "quarterly" | "annually">("monthly");
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState<Record<string, boolean>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Refresh stories when notifications indicate completion
  useEffect(() => {
    const storyCompleteNotifications = notifications.filter(
      (n) => n.type === "story_complete" && n.status === "unread"
    );
    if (storyCompleteNotifications.length > 0) {
      // Stories will automatically refresh via useQuery
      // This effect just ensures we're aware of new completions
    }
  }, [notifications]);

  // Get latest story for each type and period
  const getLatestStory = (
    storyType: "company" | "banker" | "investor",
    periodType: "monthly" | "quarterly" | "annually"
  ) => {
    if (!stories) return null;
    return (
      stories
        .filter((s: any) => s.storyType === storyType && s.periodType === periodType)
        .sort((a: any, b: any) => (b.periodEnd as number) - (a.periodEnd as number))[0] || null
    );
  };

  const handleGenerate = (storyType: "company" | "banker" | "investor", periodType: "monthly" | "quarterly" | "annually") => {
    setGeneratorStoryType(storyType);
    setGeneratorPeriodType(periodType);
    setGeneratorOpen(true);
  };

  const handleRegenerate = (storyType: "company" | "banker" | "investor", periodType: "monthly" | "quarterly" | "annually") => {
    setGeneratorStoryType(storyType);
    setGeneratorPeriodType(periodType);
    setGeneratorOpen(true);
  };

  const handleView = (storyId: Id<"ai_stories">) => {
    setSelectedStory(storyId);
  };

  const handleDownloadPDF = async (story: any) => {
    if (!story) return;
    
    try {
      // Convert story to PDF format
      const pdfStory = {
        id: story._id,
        type: story.storyType,
        period: story.periodType,
        title: story.title,
        content: story.narrative,
        keyMetrics: story.keyMetrics || {},
        insight: story.summary || story.keyMetrics?.insight || "No insight available",
        generatedAt: new Date(story.createdAt),
        periodStart: new Date(story.periodStart),
        periodEnd: new Date(story.periodEnd),
        role: story.storyType === "company" ? "Chief Financial Officer" : 
              story.storyType === "banker" ? "Credit Risk Analyst" : 
              "Venture Capital Investment Partner",
      };

      // Extract financial data from keyMetrics or use defaults
      const financialData = {
        cash_balance: story.keyMetrics?.endingCash || story.keyMetrics?.cashBalance || 0,
        monthly_revenue: story.keyMetrics?.revenue || 0,
        monthly_expenses: story.keyMetrics?.expenses || 0,
        expense_breakdown: {},
        total_debt: story.keyMetrics?.totalDebt,
        accounts_receivable: story.keyMetrics?.accountsReceivable,
        accounts_payable: story.keyMetrics?.accountsPayable,
      };

      await generateAndDownloadPDF(
        'single',
        pdfStory,
        financialData,
        { name: "EZ Financial" }
      );

      toast({
        title: "PDF downloaded",
        description: `${story.title} has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error("PDF download failed:", error);
      toast({
        title: "Download failed",
        description: error?.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (storyId: Id<"ai_stories">, format: "pdf" | "email" | "csv" | "shareable-link") => {
    const exportKey = `${storyId}-${format}`;
    if (isExporting[exportKey]) return;
    
    setIsExporting((prev) => ({ ...prev, [exportKey]: true }));
    
    try {
      const result = await exportStory({ storyId, format });
      
      if (format === "csv") {
        // Download CSV file
        const blob = new Blob([result.content], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: `Story exported as ${result.filename}`,
        });
      } else if (format === "email") {
        // Copy email HTML to clipboard or open in new window
        const blob = new Blob([result.content], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        
        toast({
          title: "Email template ready",
          description: "Email template opened in new window. Copy the content to your email client.",
        });
      } else if (format === "shareable-link") {
        // Copy shareable link to clipboard
        if (result.url) {
          await navigator.clipboard.writeText(result.url);
          toast({
            title: "Link copied",
            description: "Shareable link copied to clipboard. Note: Full implementation with password protection coming soon.",
          });
        } else {
          toast({
            title: "Export failed",
            description: result.message || "Failed to generate shareable link",
            variant: "destructive",
          });
        }
      } else if (format === "pdf") {
        // Generate PDF from story view
        try {
          const { generateReportPDF } = await import("@/lib/pdfUtils");
          const filename = `${result.data?.title || storyId}`.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const periodLabel = result.data?.period || "";
          
          // Get the story view element
          const storyViewElement = document.querySelector('[data-story-view]') as HTMLElement;
          if (storyViewElement) {
            await generateReportPDF(
              storyViewElement,
              filename,
              result.data?.title,
              periodLabel
            );
            
            toast({
              title: "PDF generated",
              description: "PDF has been downloaded successfully.",
            });
          } else {
            // Fallback: create temporary element with story content
            const tempDiv = document.createElement("div");
            tempDiv.style.cssText = "position: absolute; left: -9999px; padding: 20px; font-family: Arial, sans-serif;";
            tempDiv.innerHTML = `
              <h1 style="font-size: 24px; margin-bottom: 10px;">${result.data?.title || "Story"}</h1>
              <p style="color: #666; margin-bottom: 20px;">${result.data?.period || ""}</p>
              <div style="white-space: pre-wrap; line-height: 1.6; margin-bottom: 20px;">${result.data?.narrative || ""}</div>
              ${result.data?.keyMetrics && Object.keys(result.data.keyMetrics).length > 0 ? `
                <h2 style="font-size: 18px; margin-top: 30px; margin-bottom: 10px;">Key Metrics</h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                  ${Object.entries(result.data.keyMetrics).map(([key, value]) => `
                    <div>
                      <strong>${key.replace(/([A-Z])/g, " $1").trim()}:</strong> 
                      ${typeof value === "number" ? value.toLocaleString("en-US", { style: "currency", currency: "USD" }) : String(value)}
                    </div>
                  `).join("")}
                </div>
              ` : ""}
            `;
            document.body.appendChild(tempDiv);
            
            await generateReportPDF(
              tempDiv,
              filename,
              result.data?.title,
              periodLabel
            );
            document.body.removeChild(tempDiv);
            
            toast({
              title: "PDF generated",
              description: "PDF has been downloaded successfully.",
            });
          }
        } catch (error: any) {
          console.error("PDF generation failed:", error);
          toast({
            title: "PDF generation failed",
            description: error?.message || "Failed to generate PDF. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error?.message || "Failed to export story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting((prev) => {
        const newState = { ...prev };
        delete newState[exportKey];
        return newState;
      });
    }
  };

  const storyTypes: Array<{
    type: "company" | "banker" | "investor";
    periodType: "monthly" | "quarterly" | "annually";
  }> = [
    { type: "company", periodType: "monthly" },
    { type: "banker", periodType: "monthly" },
    { type: "investor", periodType: "monthly" },
    { type: "company", periodType: "quarterly" },
    { type: "banker", periodType: "quarterly" },
    { type: "investor", periodType: "quarterly" },
  ];

  const selectedStoryData = stories?.find((s: any) => s._id === selectedStory);

  // Calculate if there are generated stories
  const hasGeneratedStories = useMemo(() => {
    if (!stories || stories.length === 0) return false;
    return storyTypes.some(({ type, periodType }) => {
      return getLatestStory(type, periodType) !== null;
    });
  }, [stories, storyTypes]);

  // Get last updated date
  const lastUpdated = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    const allDates = stories.map((s: any) => s.updatedAt).filter(Boolean);
    if (allDates.length === 0) return null;
    return Math.max(...allDates);
  }, [stories]);

  // Handle Generate All
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    setGenerationProgress({ current: 0, total: storyTypes.length });

    try {
      // Calculate date ranges for each period type
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
          start: start.getTime(),
          end: end.getTime(),
        };
      };

      for (let i = 0; i < storyTypes.length; i++) {
        const { type, periodType } = storyTypes[i];
        setGenerationProgress({ current: i + 1, total: storyTypes.length });
        
        const dateRange = calculateDateRange(periodType);
        
        try {
          let result;
          if (type === "company") {
            result = await generateCompanyStory({ 
              periodStart: dateRange.start, 
              periodEnd: dateRange.end, 
              periodType 
            });
          } else if (type === "banker") {
            result = await generateBankerStory({ 
              periodStart: dateRange.start, 
              periodEnd: dateRange.end, 
              periodType 
            });
          } else {
            result = await generateInvestorStory({ 
              periodStart: dateRange.start, 
              periodEnd: dateRange.end, 
              periodType 
            });
          }

          if (!result.success) {
            console.warn(`Failed to generate ${type} ${periodType} story:`, result.error);
          }
        } catch (error: any) {
          console.error(`Error generating ${type} ${periodType} story:`, error);
        }
      }

      toast({
        title: "Batch generation started",
        description: `Generating ${storyTypes.length} stories. This may take a few minutes.`,
      });
    } catch (error: any) {
      console.error("Batch generation failed:", error);
      toast({
        title: "Generation failed",
        description: error?.message || "Failed to start batch generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  // Handle Download All PDFs
  const handleDownloadAllPDFs = async () => {
    if (!stories || stories.length === 0) return;
    
    setIsDownloadingAll(true);
    
    try {
      const generatedStories = storyTypes
        .map(({ type, periodType }) => getLatestStory(type, periodType))
        .filter(Boolean) as any[];

      if (generatedStories.length === 0) {
        toast({
          title: "No stories to download",
          description: "Please generate stories first.",
          variant: "destructive",
        });
        return;
      }

      // Convert stories to PDF format
      const pdfStories = generatedStories.map((story) => ({
        id: story._id,
        type: story.storyType,
        period: story.periodType,
        title: story.title,
        content: story.narrative,
        keyMetrics: story.keyMetrics || {},
        insight: story.summary || "No insight available",
        generatedAt: new Date(story.createdAt),
        periodStart: new Date(story.periodStart),
        periodEnd: new Date(story.periodEnd),
        role: story.storyType === "company" ? "Chief Financial Officer" : 
              story.storyType === "banker" ? "Credit Risk Analyst" : 
              "Venture Capital Investment Partner",
      }));

      // Get financial data (simplified - you may need to fetch this from Convex)
      const financialData = {
        cash_balance: 0,
        monthly_revenue: 0,
        monthly_expenses: 0,
        expense_breakdown: {},
      };

      await generateAndDownloadPDF(
        'combined',
        pdfStories,
        financialData,
        { name: "EZ Financial" }
      );

      toast({
        title: "PDFs downloaded",
        description: `Combined PDF with ${pdfStories.length} stories has been downloaded.`,
      });
    } catch (error: any) {
      console.error("Download all failed:", error);
      toast({
        title: "Download failed",
        description: error?.message || "Failed to download PDFs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">AI Stories</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Automatically generated financial narratives • Last updated:{" "}
              {lastUpdated
                ? new Date(lastUpdated).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never"}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>Data from Convex • Real-time</span>
            </div>
            {lastUpdated && (() => {
              const daysSinceUpdate = Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24));
              const isDataStale = daysSinceUpdate > 7;
              return isDataStale ? (
                <Badge variant="warning" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Data may be outdated
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Data fresh
                </Badge>
              );
            })()}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="w-full md:w-auto"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating {generationProgress.current}/{generationProgress.total}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate All Stories
              </>
            )}
          </Button>

          <Button
            variant="default"
            onClick={handleDownloadAllPDFs}
            disabled={!hasGeneratedStories || isDownloadingAll}
            className="w-full md:w-auto"
          >
            {isDownloadingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All PDFs
              </>
            )}
          </Button>
        </div>
      </div>

      {stories === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading stories...</p>
          </div>
        </div>
      ) : stories === null ? (
        <div className="bg-card rounded-lg shadow border border-border p-8 md:p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-bold text-foreground mb-2">Error Loading Stories</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            There was an error loading your stories. Please refresh the page or try again later.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-card rounded-lg shadow border border-border p-8 md:p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Stories Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Generate your first AI story to get started. Stories are automatically created at the end of each period, or you can generate them manually.
          </p>
          <Button onClick={() => handleGenerate("company", "monthly")}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your First Story
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {storyTypes.map(({ type, periodType }) => {
            const story = getLatestStory(type, periodType);
            const generationStatus = story?.generationStatus;
            const isPending = generationStatus === "pending" || generationStatus === "generating";
            const isFailed = generationStatus === "failed";
            
            return (
              <StoryCard
                key={`${type}-${periodType}`}
                storyType={type}
                periodType={periodType}
                title={story?.title || ""}
                summary={story?.summary || ""}
                lastUpdated={story?.updatedAt || Date.now()}
                hasStory={!!story && generationStatus === "completed"}
                isGenerating={isPending || isGenerating[`${type}-${periodType}`]}
                generationStatus={generationStatus}
                generationError={story?.generationError}
                onView={() => story && generationStatus === "completed" && handleView(story._id)}
                onGenerate={() => handleGenerate(type, periodType)}
                onRegenerate={() => handleRegenerate(type, periodType)}
                onExport={() => story && generationStatus === "completed" && handleDownloadPDF(story)}
                story={story && generationStatus === "completed" ? {
                  narrative: story.narrative,
                  keyMetrics: story.keyMetrics,
                  insight: story.summary,
                } : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Story View Dialog */}
      {selectedStoryData && (
        <StoryView
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
          story={selectedStoryData as any}
          onExport={(format) => selectedStory && handleExport(selectedStory, format)}
        />
      )}

      {/* Story Generator Dialog */}
      <StoryGenerator
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        storyType={generatorStoryType}
        initialPeriodType={generatorPeriodType}
        onSuccess={() => {
          // Refresh stories
          setGeneratorOpen(false);
        }}
      />
    </div>
  );
}
