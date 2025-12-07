"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId?: string | null; // If null, creating new
}

export function TemplateDialog({ open, onOpenChange, templateId }: TemplateDialogProps) {
    const { toast } = useToast();
    const upsertTemplate = useMutation(api.ai_stories.mutations.upsertTemplate);

    // Fetch existing template if editing
    // We skip this query if templateId is null using "skip" or logical check
    const existingTemplate = useQuery(
        api.ai_stories.queries.getTemplate,
        templateId ? { templateId: templateId as any } : "skip"
    );

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        slug: "",
        title: "",
        storyType: "company",
        periodType: "monthly",
        systemPrompt: "",
        dataRequirements: "", // newline separated
        focuses: "", // newline separated
        keyMetricsToCalculate: "", // newline separated
        role: "",
        order: 1,
        isActive: true,
    });

    // Load existing data
    useEffect(() => {
        if (existingTemplate) {
            setFormData({
                slug: existingTemplate.slug,
                title: existingTemplate.title,
                storyType: existingTemplate.storyType,
                periodType: existingTemplate.periodType,
                systemPrompt: existingTemplate.systemPrompt,
                dataRequirements: existingTemplate.dataRequirements.join("\n"),
                focuses: existingTemplate.focuses.join("\n"),
                keyMetricsToCalculate: existingTemplate.keyMetricsToCalculate?.join("\n") || "",
                role: existingTemplate.role || "",
                order: existingTemplate.order || 1,
                isActive: existingTemplate.isActive !== false,
            });
        } else if (!templateId) {
            // Reset for new
            setFormData({
                slug: "",
                title: "",
                storyType: "company",
                periodType: "monthly",
                systemPrompt: "",
                dataRequirements: "",
                focuses: "",
                keyMetricsToCalculate: "",
                role: "",
                order: 1,
                isActive: true,
            });
        }
    }, [existingTemplate, templateId, open]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            await upsertTemplate({
                templateId: templateId as any,
                slug: formData.slug,
                title: formData.title,
                storyType: formData.storyType as any,
                periodType: formData.periodType as any,
                systemPrompt: formData.systemPrompt,
                dataRequirements: formData.dataRequirements.split("\n").filter(s => s.trim()),
                focuses: formData.focuses.split("\n").filter(s => s.trim()),
                keyMetricsToCalculate: formData.keyMetricsToCalculate.split("\n").filter(s => s.trim()),
                role: formData.role,
                order: parseInt(formData.order.toString()),
                isActive: formData.isActive,
            });

            toast({
                title: "Success",
                description: `Template ${templateId ? "updated" : "created"} successfully.`,
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save template.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (templateId && existingTemplate === undefined) {
        return null; // Loading state handled by parent or just empty
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{templateId ? "Edit Template" : "New Template"}</DialogTitle>
                    <DialogDescription>
                        Configure AI story generation settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Slug (Unique ID)</Label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="company-monthly-v2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Display Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Company Story"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Story Type</Label>
                        <Select
                            value={formData.storyType}
                            onValueChange={(v) => setFormData({ ...formData, storyType: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="banker">Banker</SelectItem>
                                <SelectItem value="investor">Investor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Period Type</Label>
                        <Select
                            value={formData.periodType}
                            onValueChange={(v) => setFormData({ ...formData, periodType: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label>System Prompt (The AI Persona & Rules)</Label>
                        <Textarea
                            className="h-48 font-mono text-sm"
                            value={formData.systemPrompt}
                            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                            placeholder="You are the CFO..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Data Requirements (One per line)</Label>
                        <Textarea
                            className="h-32 font-mono text-sm"
                            value={formData.dataRequirements}
                            onChange={(e) => setFormData({ ...formData, dataRequirements: e.target.value })}
                            placeholder="cash_balance\nmonthly_revenue..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Focus Areas (One per line)</Label>
                        <Textarea
                            className="h-32 font-mono text-sm"
                            value={formData.focuses}
                            onChange={(e) => setFormData({ ...formData, focuses: e.target.value })}
                            placeholder="Burn rate\nCash runway..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Role Name</Label>
                        <Input
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="Chief Financial Officer"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Order</Label>
                        <Input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox
                            id="active"
                            checked={formData.isActive}
                            onCheckedChange={(c) => setFormData({ ...formData, isActive: !!c })}
                        />
                        <Label htmlFor="active">Is Active?</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
