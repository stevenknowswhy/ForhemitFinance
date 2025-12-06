"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useOrgIdOptional } from "../../hooks/useOrgId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { AddBillDrawer } from "./AddBillDrawer";
import { PayBillDialog } from "./PayBillDialog";

export function BillsView() {
    const { orgId } = useOrgIdOptional();
    const [statusFilter, setStatusFilter] = useState<string>("all_active");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedBillToPay, setSelectedBillToPay] = useState<any | null>(null);

    const bills = useQuery(api.bills.list, orgId ? { orgId, status: statusFilter as any } : "skip");

    if (!orgId) return <div>Please select an organization.</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search bills..." className="pl-8" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={() => setIsDrawerOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bill
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {["all_active", "open", "due_soon", "overdue", "paid"].map((status) => (
                    <Badge
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        className="cursor-pointer capitalize whitespace-nowrap"
                        onClick={() => setStatusFilter(status)}
                    >
                        {status.replace("_", " ")}
                    </Badge>
                ))}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No bills found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bills?.map((bill: any) => (
                                <TableRow key={bill._id}>
                                    <TableCell className="font-medium">
                                        <VendorName vendorId={bill.vendorId} />
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(bill.dueDate), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: bill.currency,
                                        }).format(bill.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={bill.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {bill.status === "open" || bill.status === "overdue" ? (
                                            <Button variant="default" size="sm" onClick={() => setSelectedBillToPay(bill)}>
                                                Pay
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddBillDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

            {selectedBillToPay && (
                <PayBillDialog
                    open={!!selectedBillToPay}
                    onOpenChange={(open) => !open && setSelectedBillToPay(null)}
                    bill={selectedBillToPay}
                />
            )}
        </div>
    );
}

function VendorName({ vendorId }: { vendorId: string }) {
    const vendor = useQuery(api.vendors.get, { vendorId: vendorId as any });
    return <>{vendor?.name || "Loading..."}</>;
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        open: "secondary",
        paid: "default",
        overdue: "destructive",
        draft: "outline",
    };

    return <Badge variant={variants[status] || "outline"} className="capitalize">{status}</Badge>;
}
