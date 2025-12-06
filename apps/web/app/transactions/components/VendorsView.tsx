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
import { Plus, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/use-toast";
import { VendorDetailsSheet } from "./VendorDetailsSheet";
import { Id } from "@convex/_generated/dataModel";

export function VendorsView() {
    const { orgId } = useOrgIdOptional();
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<Id<"vendors"> | null>(null);

    const vendors = useQuery(api.vendors.list, orgId ? { orgId, search } : "skip");

    if (!orgId) return <div>Please select an organization.</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search vendors..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <CreateVendorDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendors?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    No vendors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            vendors?.map((vendor: any) => (
                                <TableRow
                                    key={vendor._id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedVendorId(vendor._id)}
                                >
                                    <TableCell className="font-medium">{vendor.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{vendor.contactEmail}</span>
                                            <span className="text-muted-foreground">{vendor.contactPhone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVendorId(vendor._id);
                                            }}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <VendorDetailsSheet
                vendorId={selectedVendorId}
                onClose={() => setSelectedVendorId(null)}
            />
        </div>
    );
}

function CreateVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { orgId } = useOrgIdOptional();
    const { toast } = useToast();
    const createVendor = useMutation(api.vendors.create);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        try {
            await createVendor({
                orgId,
                name,
                contactEmail: email,
            });
            toast({
                title: "Vendor created",
                description: "New vendor has been added successfully.",
            });
            onOpenChange(false);
            setName("");
            setEmail("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create vendor.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Vendor
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Vendor</DialogTitle>
                    <DialogDescription>
                        Add a new vendor to your organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Vendor</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
