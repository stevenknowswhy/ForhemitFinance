"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Shield, User, CreditCard, Activity, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function SuperAdminOrgDetail({ params }: { params: { orgId: string } }) {
    const { toast } = useToast();
    const router = useRouter();
    const orgId = params.orgId as Id<"organizations">;

    const data = useQuery(api.super_admin.getOrganizationDetails, { orgId });
    const updateStatus = useMutation(api.super_admin.updateOrgStatus);
    const startImpersonation = useMutation(api.super_admin.startImpersonation);

    const [isUpdating, setIsUpdating] = useState(false);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const { org, subscription, plan, members } = data;

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await updateStatus({
                orgId,
                status: newStatus as any,
            });
            toast({
                title: "Status updated",
                description: `Organization status changed to ${newStatus}.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImpersonate = async () => {
        try {
            await startImpersonation({ orgId });
            toast({
                title: "Impersonation started",
                description: `You are now impersonating ${org.name}.`,
            });
            // Redirect to dashboard as the impersonated user
            router.push("/dashboard");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start impersonation.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {org.name}
                        <Badge variant="outline" className="ml-2 capitalize">
                            {org.type}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm">ID: {org._id}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={handleImpersonate}>
                        <Shield className="w-4 h-4 mr-2" />
                        Impersonate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status & Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Status & Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={org.status}
                                onValueChange={handleStatusChange}
                                disabled={isUpdating}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="deleted">Deleted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Base Currency</p>
                            <p className="text-sm text-muted-foreground">{org.baseCurrency}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Created At</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(org.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Current Plan</p>
                            <p className="text-lg font-bold">{plan?.name || "None"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Status</p>
                            <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                                {subscription?.status || "No Subscription"}
                            </Badge>
                        </div>
                        {subscription?.trialEndsAt && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Trial Ends</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(subscription.trialEndsAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Members */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Team Members
                        </CardTitle>
                        <CardDescription>
                            {members.length} members in this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {members.map((member: any) => (
                                <div key={member._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.userName || "Unknown"}</p>
                                            <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline">{member.role}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Joined {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
