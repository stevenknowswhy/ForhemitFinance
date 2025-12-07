"use client";

/**
 * Time Tracking Module Page
 * Main page for Time Tracking add-on
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Play, Square, Clock, DollarSign, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";
import TimeEntryList from "./components/TimeEntryList";
import { RequireFeature, UpgradePrompt } from "@/app/components/RequireFeature";
import { Id } from "@/convex/_generated/dataModel";

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

export default function TimeTrackingPage() {
    const { toast } = useToast();
    const [description, setDescription] = useState("");

    // TODO: Get orgId from context
    const orgId = undefined as Id<"organizations"> | undefined;

    // Get running timer
    const runningTimer = useQuery(
        api.modules.time_tracking.main.getRunningTimer,
        orgId ? { orgId } : "skip"
    );

    // Get stats (this week)
    const stats = useQuery(
        api.modules.time_tracking.main.getStats,
        orgId
            ? {
                orgId,
                startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
            }
            : "skip"
    );

    // Mutations
    const startTimer = useMutation(api.modules.time_tracking.main.startTimer);
    const stopTimer = useMutation(api.modules.time_tracking.main.stopTimer);

    const handleStartTimer = async () => {
        if (!orgId) return;
        if (!description.trim()) {
            toast({
                title: "Description required",
                description: "Please enter what you're working on.",
                variant: "destructive",
            });
            return;
        }

        try {
            await startTimer({
                orgId,
                description: description.trim(),
                isBillable: true,
            });
            setDescription("");
            toast({
                title: "Timer started",
                description: "Tracking your time.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to start timer.",
                variant: "destructive",
            });
        }
    };

    const handleStopTimer = async () => {
        if (!runningTimer) return;

        try {
            const result = await stopTimer({ id: runningTimer._id });
            toast({
                title: "Timer stopped",
                description: `Logged ${formatDuration(result.durationMinutes)}.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to stop timer.",
                variant: "destructive",
            });
        }
    };

    return (
        <RequireFeature
            feature="time_tracking"
            fallback={<UpgradePrompt feature="time_tracking" />}
        >
            <div className="container mx-auto py-8 space-y-8 max-w-6xl">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Time Tracking
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Track time spent on projects and tasks.
                    </p>
                </div>

                {/* Timer Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <CardContent className="p-6">
                        {runningTimer ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="animate-pulse">
                                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {runningTimer.description}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Started at{" "}
                                            {new Date(runningTimer.startTime).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleStopTimer}
                                    variant="destructive"
                                    size="lg"
                                >
                                    <Square className="mr-2 h-4 w-4" /> Stop
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Input
                                    placeholder="What are you working on?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleStartTimer()}
                                    className="flex-1 bg-white"
                                />
                                <Button onClick={handleStartTimer} size="lg">
                                    <Play className="mr-2 h-4 w-4" /> Start Timer
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Week</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.totalHours || 0}h
                            </div>
                            <p className="text-xs text-gray-500">
                                {stats?.totalEntries || 0} entries
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Billable</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats?.billableHours || 0}h
                            </div>
                            <p className="text-xs text-gray-500">
                                ${stats?.totalEarnings.toLocaleString() || 0}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
                            <Clock className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">
                                {((stats?.totalHours || 0) - (stats?.billableHours || 0)).toFixed(1)}h
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg/Day</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {((stats?.totalHours || 0) / 7).toFixed(1)}h
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Time Entry List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Entries</CardTitle>
                            <Button variant="outline" size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Manual Entry
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TimeEntryList orgId={orgId} />
                    </CardContent>
                </Card>
            </div>
        </RequireFeature>
    );
}
