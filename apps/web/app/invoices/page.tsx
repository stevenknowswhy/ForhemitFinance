"use client";

/**
 * Invoices Page
 * Main page for viewing and managing invoices
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, FileText, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceList from "./components/InvoiceList";
import InvoiceBuilder from "./components/InvoiceBuilder";

export default function InvoicesPage() {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("all");

    // TODO: Get orgId from context
    const orgId = undefined; // Placeholder - should come from OrgContext

    // Get invoice stats
    const stats = useQuery(
        api.invoices.getStats,
        orgId ? { orgId } : "skip"
    );

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Invoices
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Create and manage invoices for your clients.
                    </p>
                </div>
                <Button onClick={() => setIsBuilderOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            ${(stats?.totalOutstanding || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats?.sent || 0} unpaid invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${(stats?.totalPaid || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats?.paid || 0} paid invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats?.overdue || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Need attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice List with Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="draft">Drafts ({stats?.draft || 0})</TabsTrigger>
                    <TabsTrigger value="sent">Sent ({stats?.sent || 0})</TabsTrigger>
                    <TabsTrigger value="paid">Paid ({stats?.paid || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <InvoiceList orgId={orgId} status={undefined} />
                </TabsContent>
                <TabsContent value="draft" className="mt-6">
                    <InvoiceList orgId={orgId} status="draft" />
                </TabsContent>
                <TabsContent value="sent" className="mt-6">
                    <InvoiceList orgId={orgId} status="sent" />
                </TabsContent>
                <TabsContent value="paid" className="mt-6">
                    <InvoiceList orgId={orgId} status="paid" />
                </TabsContent>
            </Tabs>

            {/* Invoice Builder Sheet */}
            <InvoiceBuilder
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                orgId={orgId}
            />
        </div>
    );
}
