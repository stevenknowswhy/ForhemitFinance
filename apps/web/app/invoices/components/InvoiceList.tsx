"use client";

/**
 * Invoice List Component
 * Displays a list of invoices with actions
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
// @ts-ignore
const apiAny: any = api;
import { format } from "date-fns";
import { MoreHorizontal, Send, Check, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Id, Doc } from "@/convex/_generated/dataModel";

interface InvoiceListProps {
    orgId: Id<"organizations"> | undefined;
    status: string | undefined;
}

export default function InvoiceList({ orgId, status }: InvoiceListProps) {
    const queryArgs = orgId ? { orgId, status, limit: 50 } : "skip";
    const invoices = useQuery(
        apiAny.invoices.list,
        queryArgs as any
    ) as Doc<"invoices">[] | undefined;

    const markAsSent = useMutation(api.invoices.markAsSent);
    const markAsPaid = useMutation(api.invoices.markAsPaid);
    const voidInvoice = useMutation(api.invoices.voidInvoice);
    const deleteInvoice = useMutation(api.invoices.remove);

    if (!orgId) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">Please select an organization to view invoices.</p>
            </div>
        );
    }

    if (invoices === undefined) {
        return <InvoiceListSkeleton />;
    }

    if (invoices.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    No invoices found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {status
                        ? `No ${status} invoices to display.`
                        : "Get started by creating your first invoice."}
                </p>
            </div>
        );
    }

    const getStatusBadge = (invoiceStatus: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            draft: { variant: "secondary", label: "Draft" },
            sent: { variant: "default", label: "Sent" },
            viewed: { variant: "outline", label: "Viewed" },
            paid: { variant: "success", label: "Paid" },
            overdue: { variant: "destructive", label: "Overdue" },
            void: { variant: "secondary", label: "Void" },
        };
        const config = variants[invoiceStatus] || { variant: "secondary", label: invoiceStatus };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="space-y-4">
            {invoices.map((invoice) => (
                <Card key={invoice._id} className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            {/* Invoice Info */}
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">
                                        {invoice.invoiceNumber}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {invoice.customerName}
                                        </p>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Issued {format(invoice.issueDate, "MMM d, yyyy")} • Due{" "}
                                        {format(invoice.dueDate, "MMM d, yyyy")}
                                    </p>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right mr-4">
                                <p className="text-lg font-semibold">
                                    ${invoice.total.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">{invoice.currency}</p>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {invoice.status === "draft" && (
                                        <DropdownMenuItem
                                            onClick={() => markAsSent({ id: invoice._id })}
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            Mark as Sent
                                        </DropdownMenuItem>
                                    )}
                                    {(invoice.status === "sent" || invoice.status === "viewed") && (
                                        <DropdownMenuItem
                                            onClick={() => markAsPaid({ id: invoice._id })}
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Mark as Paid
                                        </DropdownMenuItem>
                                    )}
                                    {invoice.status !== "paid" && invoice.status !== "void" && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => voidInvoice({ id: invoice._id })}
                                                className="text-red-600"
                                            >
                                                <Ban className="mr-2 h-4 w-4" />
                                                Void Invoice
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {invoice.status === "draft" && (
                                        <DropdownMenuItem
                                            onClick={() => deleteInvoice({ id: invoice._id })}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function InvoiceListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-16 w-16 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
