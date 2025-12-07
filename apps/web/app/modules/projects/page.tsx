"use client";

/**
 * Projects Module Page
 * Main page for Project Profitability add-on
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, FolderKanban, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectList from "./components/ProjectList";
import ProjectBuilder from "./components/ProjectBuilder";
import { RequireFeature, UpgradePrompt } from "@/app/components/RequireFeature";

export default function ProjectsPage() {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("active");

    // TODO: Get orgId from context
    const orgId = undefined;

    return (
        <RequireFeature
            feature="project_profitability"
            fallback={<UpgradePrompt feature="project_profitability" />}
        >
            <div className="container mx-auto py-8 space-y-8 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Projects
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Track project profitability and budgets.
                        </p>
                    </div>
                    <Button onClick={() => setIsBuilderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">$0</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                            <DollarSign className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">$0</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Margin</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0%</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Project List with Tabs */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-6">
                        <ProjectList orgId={orgId} status="active" />
                    </TabsContent>
                    <TabsContent value="completed" className="mt-6">
                        <ProjectList orgId={orgId} status="completed" />
                    </TabsContent>
                    <TabsContent value="all" className="mt-6">
                        <ProjectList orgId={orgId} status={undefined} />
                    </TabsContent>
                </Tabs>

                {/* Project Builder Sheet */}
                <ProjectBuilder
                    open={isBuilderOpen}
                    onOpenChange={setIsBuilderOpen}
                    orgId={orgId}
                />
            </div>
        </RequireFeature>
    );
}
