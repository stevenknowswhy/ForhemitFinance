"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useOrgIdOptional } from "../../hooks/useOrgId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/use-toast";

interface AddBillDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddBillDrawer({ open, onOpenChange }: AddBillDrawerProps) {
    const { orgId } = useOrgIdOptional();
    const { toast } = useToast();
    const createBill = useMutation(api.bills.create);
    const vendors = useQuery(api.vendors.list, orgId ? { orgId } : "skip");

    const [formData, setFormData] = useState({
        vendorId: "",
        amount: "",
        dueDate: "",
        frequency: "one_time",
        autoPay: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        try {
            await createBill({
                orgId,
                vendorId: formData.vendorId as any,
                amount: parseFloat(formData.amount),
                dueDate: new Date(formData.dueDate).getTime(),
                frequency: formData.frequency as any,
                autoPay: formData.autoPay,
                status: "open",
            });

            toast({
                title: "Bill created",
                description: "The bill has been successfully created.",
            });
            onOpenChange(false);
            setFormData({ vendorId: "", amount: "", dueDate: "", frequency: "one_time", autoPay: false });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create bill. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Add New Bill</SheetTitle>
                    <SheetDescription>
                        Create a new bill to track payments to your vendors.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Select
                            value={formData.vendorId}
                            onValueChange={(val) => setFormData({ ...formData, vendorId: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors?.map((vendor: any) => (
                                    <SelectItem key={vendor._id} value={vendor._id}>
                                        {vendor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                            value={formData.frequency}
                            onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="one_time">One-time</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="autoPay"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.autoPay}
                            onChange={(e) => setFormData({ ...formData, autoPay: e.target.checked })}
                        />
                        <Label htmlFor="autoPay">Enable Auto-pay</Label>
                    </div>

                    <SheetFooter>
                        <Button type="submit">Create Bill</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
