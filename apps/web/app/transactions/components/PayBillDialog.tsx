
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";

interface PayBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bill: any; // Type strictly if possible
}

export function PayBillDialog({ open, onOpenChange, bill }: PayBillDialogProps) {
    const { toast } = useToast();
    const markAsPaid = useMutation(api.bills.markAsPaid);

    // Fetch accounts to pay from (Assets/Banks)
    // We can filter for only asset accounts
    const accounts = useQuery(api.accounts.getAll, bill?.orgId ? { orgId: bill.orgId } : "skip");
    const bankAccounts = accounts?.filter((a: any) => a.type === "asset" || a.type === "bank" || a.accountType === "Checking" || a.accountType === "Savings");

    const [paymentAccountId, setPaymentAccountId] = useState(bill?.paymentAccountId || "");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handlePay = async () => {
        if (!paymentAccountId) {
            toast({ title: "Error", description: "Please select a payment account.", variant: "destructive" });
            return;
        }

        try {
            await markAsPaid({
                billId: bill._id,
                paymentAccountId: paymentAccountId as any,
                paidAt: new Date(paymentDate).getTime(),
            });

            toast({ title: "Bill Paid", description: "The bill has been marked as paid." });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to mark bill as paid.", variant: "destructive" });
        }
    };

    if (!bill) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mark Bill as Paid</DialogTitle>
                    <DialogDescription>
                        Record a payment for this bill. This will create a transaction record.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Amount</Label>
                        <div className="col-span-3 font-medium">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: bill.currency }).format(bill.amount)}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account" className="text-right">Pay From</Label>
                        <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Bank Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {bankAccounts?.map((account: any) => (
                                    <SelectItem key={account._id} value={account._id}>
                                        {account.name} ({account.mask || '****'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handlePay}>Confirm Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
