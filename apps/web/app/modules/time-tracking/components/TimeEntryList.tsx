"use client";

/**
 * Time Entry List Component
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Clock, DollarSign, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/use-toast";
import { Id } from "@/convex/_generated/dataModel";

interface TimeEntryListProps {
    orgId: Id<"organizations"> | undefined;
    projectId?: Id<"projects">;
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

export default function TimeEntryList({ orgId, projectId }: TimeEntryListProps) {
    const { toast } = useToast();

    const entries = useQuery(
        api.modules.time_tracking.main.list,
        orgId ? { orgId, projectId } : "skip"
    );

    const deleteEntry = useMutation(api.modules.time_tracking.main.remove);

    const handleDelete = async (id: Id<"time_entries">) => {
        try {
            await deleteEntry({ id });
            toast({
                title: "Entry deleted",
                description: "Time entry has been removed.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete entry.",
                variant: "destructive",
            });
        }
    };

    if (!orgId) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">
                    Please select an organization to view time entries.
                </p>
            </div>
        );
    }

    if (entries === undefined) {
        return <TimeEntryListSkeleton />;
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    No time entries
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Start tracking time to see your entries here.
                </p>
            </div>
        );
    }

    // Group by date
    const groupedEntries = entries.reduce((groups, entry) => {
        const date = format(entry.startTime, "yyyy-MM-dd");
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
    }, {} as Record<string, typeof entries>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <div key={date}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-600">
                            {format(new Date(date), "EEEE, MMMM d")}
                        </h4>
                        <span className="text-sm text-gray-500">
                            {formatDuration(
                                dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0)
                            )}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {dayEntries.map((entry) => (
                            <div
                                key={entry._id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <div
                                        className={`w-1 h-12 rounded-full ${entry.isBillable ? "bg-green-500" : "bg-gray-300"
                                            }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 truncate">
                                            {entry.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">
                                                {format(entry.startTime, "h:mm a")}
                                                {entry.endTime && ` - ${format(entry.endTime, "h:mm a")}`}
                                            </span>
                                            {entry.projectId && (
                                                <Badge variant="outline" className="text-xs">
                                                    <FolderKanban className="h-3 w-3 mr-1" />
                                                    Project
                                                </Badge>
                                            )}
                                            {entry.isBillable && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-green-50 text-green-700"
                                                >
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    Billable
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="font-medium">
                                            {formatDuration(entry.durationMinutes)}
                                        </p>
                                        {entry.hourlyRate && entry.isBillable && (
                                            <p className="text-xs text-green-600">
                                                $
                                                {(
                                                    (entry.durationMinutes / 60) *
                                                    entry.hourlyRate
                                                ).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(entry._id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TimeEntryListSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2].map((group) => (
                <div key={group}>
                    <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="w-1 h-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
