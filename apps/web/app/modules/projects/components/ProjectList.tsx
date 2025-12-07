"use client";

/**
 * Project List Component
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { MoreHorizontal, FolderKanban, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectListProps {
    orgId: Id<"organizations"> | undefined;
    status: string | undefined;
}

export default function ProjectList({ orgId, status }: ProjectListProps) {
    const projects = useQuery(
        api.modules.projects.main.list,
        orgId ? { orgId, status } : "skip"
    );

    if (!orgId) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">
                    Please select an organization to view projects.
                </p>
            </div>
        );
    }

    if (projects === undefined) {
        return <ProjectListSkeleton />;
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    No projects found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {status
                        ? `No ${status} projects to display.`
                        : "Get started by creating your first project."}
                </p>
            </div>
        );
    }

    const getStatusBadge = (projectStatus: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            active: { variant: "default", label: "Active" },
            completed: { variant: "success", label: "Completed" },
            on_hold: { variant: "secondary", label: "On Hold" },
            cancelled: { variant: "destructive", label: "Cancelled" },
        };
        const config = variants[projectStatus] || {
            variant: "secondary",
            label: projectStatus,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <Card
                    key={project._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                >
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: project.color || "#3B82F6" }}
                            >
                                <FolderKanban className="h-5 w-5 text-white" />
                            </div>
                            {getStatusBadge(project.status)}
                        </div>

                        <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                        {project.description && (
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {project.description}
                            </p>
                        )}

                        {project.budgetAmount && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Budget</span>
                                    <span className="font-medium">
                                        ${project.budgetAmount.toLocaleString()}
                                    </span>
                                </div>
                                <Progress value={0} className="h-2" />
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {project.startDate
                                    ? format(project.startDate, "MMM d, yyyy")
                                    : "No start date"}
                            </span>
                            <span>
                                {project.endDate
                                    ? `→ ${format(project.endDate, "MMM d, yyyy")}`
                                    : "Ongoing"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ProjectListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-2 w-full mb-4" />
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
