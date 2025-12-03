"use client";

/**
 * Story View Component
 * Displays full story narrative with user notes, attachments, and export options
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save, X, FileText, Mail, FileSpreadsheet, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StoryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: {
    _id: string;
    storyType: "company" | "banker" | "investor";
    periodType: "monthly" | "quarterly" | "annually";
    title: string;
    narrative: string;
    summary: string;
    keyMetrics: Record<string, any>;
    userNotes?: string;
    attachments?: string[];
    version: number;
    createdAt: number;
    updatedAt: number;
  };
  onExport?: (format: "pdf" | "email" | "csv" | "shareable-link") => void;
}

export function StoryView({ open, onOpenChange, story, onExport }: StoryViewProps) {
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(story.userNotes || "");
  const updateStory = useMutation(api.ai_stories.updateStory);

  const handleSaveNotes = async () => {
    try {
      await updateStory({
        storyId: story._id as any,
        userNotes: notes,
      });
      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully.",
      });
      setIsEditingNotes(false);
    } catch (error: any) {
      console.error("Failed to save notes:", error);
      toast({
        title: "Save failed",
        description: error?.message || "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const storyTypeLabels = {
    company: "Company Story",
    banker: "Banker Story",
    investor: "Investor Story",
  };

  const periodTypeLabels = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    annually: "Annual",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-story-view>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{story.title}</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{storyTypeLabels[story.storyType]}</Badge>
                  <Badge variant="outline">{periodTypeLabels[story.periodType]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Version {story.version} • Updated {formatDate(story.updatedAt)}
                  </span>
                </div>
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("pdf")}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("email")}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("csv")}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("shareable-link")}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          {Object.keys(story.keyMetrics).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(story.keyMetrics).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-lg font-semibold">
                        {typeof value === "number"
                          ? value.toLocaleString("en-US", {
                              style: key.includes("Rate") || key.includes("Growth") ? "percent" : "currency",
                              currency: "USD",
                              minimumFractionDigits: key.includes("Rate") || key.includes("Growth") ? 1 : 0,
                              maximumFractionDigits: key.includes("Rate") || key.includes("Growth") ? 1 : 0,
                            })
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Narrative */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Narrative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground">
                  {story.narrative}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Notes</CardTitle>
                {!isEditingNotes ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotes(story.userNotes || "");
                        setIsEditingNotes(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes, context, or reminders about this story..."
                  className="min-h-[150px]"
                />
              ) : (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[50px]">
                  {notes || "No notes yet. Click Edit to add notes."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {story.attachments && story.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {story.attachments.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      {url}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
