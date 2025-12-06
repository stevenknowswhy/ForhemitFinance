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
import { format } from "date-fns";

export function SubscriptionsView() {
    const { orgId } = useOrgIdOptional();
    const subscriptions = useQuery(api.bill_subscriptions.list, orgId ? { orgId } : "skip");

    if (!orgId) return <div>Please select an organization.</div>;

    return (
        <div className="space-y-4">
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
