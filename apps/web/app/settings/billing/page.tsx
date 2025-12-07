"use client";

/**
 * Billing Settings Page
 * Manage subscription and add-on purchases
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import {
    CreditCard,
    Package,
    CheckCircle,
    Clock,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
    // TODO: Get orgId from context
    const orgId = undefined;

    // Get add-ons with entitlements
    const addons = useQuery(
        api.marketplace.registry.listAvailableAddons,
        orgId ? { orgId } : { orgId: undefined }
    );

    // Filter to only show owned/trialing add-ons
    const ownedAddons = addons?.filter(
        (addon) =>
            addon.entitlement?.status === "active" ||
            addon.entitlement?.status === "trialing"
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="mr-1 h-3 w-3" /> Active
                    </Badge>
                );
            case "trialing":
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Clock className="mr-1 h-3 w-3" /> Trial
                    </Badge>
                );
            case "expired":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <AlertCircle className="mr-1 h-3 w-3" /> Expired
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Billing & Add-ons
                </h1>
                <p className="text-gray-500 mt-1">
                    Manage your subscription and add-on modules.
                </p>
            </div>

            {/* Subscription Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Current Plan</CardTitle>
                                <CardDescription>Your subscription details</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Solo (Free)
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                You&apos;re on the free Solo plan with access to core features.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Upgrade to unlock advanced features and higher limits.
                            </p>
                        </div>
                        <Button asChild>
                            <a href="/pricing">Upgrade Plan</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Add-ons */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Active Add-ons</CardTitle>
                                <CardDescription>
                                    Your enabled modules and features
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <a href="/add-ons">Browse Marketplace</a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {addons === undefined ? (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : ownedAddons && ownedAddons.length > 0 ? (
                        <div className="space-y-4">
                            {ownedAddons.map((addon) => (
                                <div
                                    key={addon._id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white rounded-lg border">
                                            <Package className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{addon.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {addon.shortDescription}
                                            </p>
                                            {addon.entitlement?.trialEnd && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Trial ends{" "}
                                                    {format(addon.entitlement.trialEnd, "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {addon.entitlement &&
                                            getStatusBadge(addon.entitlement.status)}
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/add-ons?addon=${addon.slug}`}>
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                No active add-ons
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Explore the marketplace to find modules that fit your needs.
                            </p>
                            <Button className="mt-4" asChild>
                                <a href="/add-ons">Browse Marketplace</a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Methods Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                            No payment method
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a payment method to upgrade your plan or purchase add-ons.
                        </p>
                        <Button className="mt-4" variant="outline" disabled>
                            Add Payment Method
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice History Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>Download past invoices and receipts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                            No invoices yet. Invoices will appear here after your first
                            payment.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
