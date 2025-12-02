"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/hooks/use-toast";

export default function SuperAdminDashboard() {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Create Org Form State
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgType, setNewOrgType] = useState<"business" | "personal">("business");
    const [newOrgCurrency, setNewOrgCurrency] = useState("USD");
    const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState("");

    const orgs = useQuery(api.super_admin.listOrganizations, {
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
    });

    const createOrg = useMutation(api.super_admin.createOrganization);

    const handleCreateOrg = async () => {
        try {
            await createOrg({
                name: newOrgName,
                type: newOrgType,
                baseCurrency: newOrgCurrency,
                ownerEmail: newOrgOwnerEmail || undefined,
            });

            toast({
                title: "Organization created",
                description: `${newOrgName} has been created successfully.`,
            });

            setIsCreateDialogOpen(false);
            setNewOrgName("");
            setNewOrgOwnerEmail("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create organization. Please try again.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500">Active</Badge>;
            case "trial":
                return <Badge className="bg-blue-500">Trial</Badge>;
            case "suspended":
                return <Badge className="bg-red-500">Suspended</Badge>;
            case "deleted":
                return <Badge variant="destructive">Deleted</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Organizations</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Organization</DialogTitle>
                            <DialogDescription>
                                Create a new tenant organization manually.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Organization Name</Label>
                                <Input
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={newOrgType} onValueChange={(v: any) => setNewOrgType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="personal">Personal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Base Currency</Label>
                                <Select value={newOrgCurrency} onValueChange={setNewOrgCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Owner Email (Optional)</Label>
                                <Input
                                    value={newOrgOwnerEmail}
                                    onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                                    placeholder="owner@example.com"
                                />
                            </div>
                            <Button onClick={handleCreateOrg} className="w-full" disabled={!newOrgName}>
                                Create Organization
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!orgs ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : orgs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orgs.map((org) => (
                                <TableRow key={org._id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell className="capitalize">{org.type}</TableCell>
                                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                                    <TableCell>{org.planName || "None"}</TableCell>
                                    <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/super-admin/${org._id}`}>
                                                View
                                                <ExternalLink className="w-4 h-4 ml-2" />
                                            </Link>
                                        </Button>
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
