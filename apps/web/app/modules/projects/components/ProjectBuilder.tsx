"use client";

/**
 * Project Builder Component
 */

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/lib/use-toast";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectBuilderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: Id<"organizations"> | undefined;
}

const COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
];

export default function ProjectBuilder({
    open,
    onOpenChange,
    orgId,
}: ProjectBuilderProps) {
    const { toast } = useToast();
    const createProject = useMutation(api.modules.projects.main.create);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        budgetAmount: "",
        startDate: "",
        endDate: "",
        color: COLORS[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) {
            toast({
                title: "Error",
                description: "Please select an organization first.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            await createProject({
                orgId,
                name: formData.name,
                description: formData.description || undefined,
                budgetAmount: formData.budgetAmount
                    ? parseFloat(formData.budgetAmount)
                    : undefined,
                startDate: formData.startDate
                    ? new Date(formData.startDate).getTime()
                    : undefined,
                endDate: formData.endDate
                    ? new Date(formData.endDate).getTime()
                    : undefined,
                color: formData.color,
            });

            toast({
                title: "Project created",
                description: `"${formData.name}" has been created.`,
            });

            onOpenChange(false);

            // Reset form
            setFormData({
                name: "",
                description: "",
                budgetAmount: "",
                startDate: "",
                endDate: "",
                color: COLORS[0],
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create project.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Create Project</SheetTitle>
                    <SheetDescription>
                        Add a new project to track profitability.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    {/* Project Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="Website Redesign"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief project description..."
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                        />
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                        <Label htmlFor="budgetAmount">Budget (optional)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                $
                            </span>
                            <Input
                                id="budgetAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="10000"
                                className="pl-7"
                                value={formData.budgetAmount}
                                onChange={(e) =>
                                    setFormData({ ...formData, budgetAmount: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color
                                            ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                            : "hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData({ ...formData, color })}
                                />
                            ))}
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Project"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
