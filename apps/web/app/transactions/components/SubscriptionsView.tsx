"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrgIdOptional } from "../../hooks/useOrgId";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { useOrg } from "@/app/contexts/OrgContext";

export function SubscriptionsView() {
    const { currentOrgId: orgId } = useOrg();
    const subscriptions = useQuery(api.bill_subscriptions.list, orgId ? { orgId } : "skip");
    const [statusFilter, setStatusFilter] = useState<string>("all_active");

    if (!orgId) return <div>Please select an organization.</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search subscriptions..." className="pl-8" />
                    </div>
                </div>
                <Button onClick={() => alert("Add Subscription feature coming soon!")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Subscription
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Interval</TableHead>
                            <TableHead>Next Charge</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No subscriptions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions?.map((sub: any) => (
                                <TableRow key={sub._id}>
                                    <TableCell className="font-medium">{sub.name}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: sub.currency,
                                        }).format(sub.amount)}
                                    </TableCell>
                                    <TableCell className="capitalize">{sub.interval}</TableCell>
                                    <TableCell>
                                        {format(new Date(sub.nextRunDate), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={sub.isActive ? "default" : "secondary"}>
                                            {sub.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
