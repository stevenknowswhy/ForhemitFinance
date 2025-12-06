"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import { Id } from "@convex/_generated/dataModel";

interface VendorDetailsSheetProps {
    vendorId: Id<"vendors"> | null;
    onClose: () => void;
}

export function VendorDetailsSheet({ vendorId, onClose }: VendorDetailsSheetProps) {
    const vendor = useQuery(api.vendors.get, vendorId ? { vendorId } : "skip");
    // Fetch related bills and subscriptions
    // Note: We might need new queries for this or reuse list with filters
    // Assuming list supports filtering by vendorId which we implemented
    const bills = useQuery(api.bills.list, vendor && vendor.orgId ? { orgId: vendor.orgId, vendorId: vendor._id } : "skip");
    const subscriptions = useQuery(api.bill_subscriptions.list, vendor && vendor.orgId ? { orgId: vendor.orgId } : "skip");

    // Filter subscriptions in memory if the query doesn't support vendorId yet
    // The backend `list` for subscriptions didn't explicitly add vendorId filter in step 51,
    // but we can add it or filter client side for now.
    const vendorSubs = subscriptions?.filter((s: any) => s.vendorId === vendorId);

    if (!vendorId) return null;

    return (
        <Sheet open={!!vendorId} onOpenChange={(open: boolean) => !open && onClose()}>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{vendor?.name || "Loading..."}</SheetTitle>
                    <SheetDescription>
                        Vendor Details and History
                    </SheetDescription>
                </SheetHeader>

                {vendor && (
                    <div className="space-y-6 py-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Email</span>
                                <span>{vendor.contactEmail || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Phone</span>
                                <span>{vendor.contactPhone || "-"}</span>
                            </div>
                        </div>

                        {/* Subscriptions Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Subscriptions</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendorSubs?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No subscriptions
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            vendorSubs?.map((sub: any) => (
                                                <TableRow key={sub._id}>
                                                    <TableCell>{sub.name}</TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: sub.currency }).format(sub.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={sub.isActive ? "default" : "secondary"}>{sub.isActive ? "Active" : "Inactive"}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Bills History Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Bill History</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bills?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No bills found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            bills?.map((bill: any) => (
                                                <TableRow key={bill._id}>
                                                    <TableCell>{format(new Date(bill.dueDate), "MMM d, yyyy")}</TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: bill.currency }).format(bill.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">{bill.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
