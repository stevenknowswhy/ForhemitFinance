"use client";

/**
 * Invoice Builder Component
 * Form for creating/editing invoices
 */

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/lib/use-toast";
import { Id } from "@/convex/_generated/dataModel";

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
}

interface InvoiceBuilderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: Id<"organizations"> | undefined;
}

export default function InvoiceBuilder({
    open,
    onOpenChange,
    orgId,
}: InvoiceBuilderProps) {
    const { toast } = useToast();
    const createInvoice = useMutation(api.invoices.create);

    // Get next invoice number
    const nextNumber = useQuery(
        api.invoices.getNextInvoiceNumber,
        orgId ? { orgId } : "skip"
    );

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        invoiceNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        notes: "",
        paymentTerms: "Net 30",
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);

    // Set invoice number when it loads
    useEffect(() => {
        if (nextNumber) {
            setFormData((prev) => ({ ...prev, invoiceNumber: nextNumber }));
        }
    }, [nextNumber]);

    // Calculate line item amount
    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        setLineItems((items) =>
            items.map((item, i) => {
                if (i !== index) return item;
                const updated = { ...item, [field]: value };
                updated.amount = updated.quantity * updated.unitPrice;
                return updated;
            })
        );
    };

    // Add new line item
    const addLineItem = () => {
        setLineItems((items) => [
            ...items,
            { description: "", quantity: 1, unitPrice: 0, amount: 0 },
        ]);
    };

    // Remove line item
    const removeLineItem = (index: number) => {
        if (lineItems.length === 1) return;
        setLineItems((items) => items.filter((_, i) => i !== index));
    };

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal; // Add tax calculation if needed

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) {
            toast({
                title: "Error",
                description: "Please select an organization first.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            await createInvoice({
                orgId,
                customerName: formData.customerName,
                customerEmail: formData.customerEmail || undefined,
                customerAddress: formData.customerAddress || undefined,
                invoiceNumber: formData.invoiceNumber,
                issueDate: new Date(formData.issueDate).getTime(),
                dueDate: new Date(formData.dueDate).getTime(),
                lineItems,
                subtotal,
                total,
                currency: "USD",
                notes: formData.notes || undefined,
                paymentTerms: formData.paymentTerms || undefined,
            });

            toast({
                title: "Invoice created",
                description: `Invoice ${formData.invoiceNumber} has been created.`,
            });

            onOpenChange(false);

            // Reset form
            setFormData({
                customerName: "",
                customerEmail: "",
                customerAddress: "",
                invoiceNumber: nextNumber || "",
                issueDate: new Date().toISOString().split("T")[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                notes: "",
                paymentTerms: "Net 30",
            });
            setLineItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create invoice. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create Invoice</SheetTitle>
                    <SheetDescription>
                        Fill in the details to create a new invoice.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    {/* Invoice Number & Dates */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">Invoice #</Label>
                            <Input
                                id="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, invoiceNumber: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <Input
                                id="issueDate"
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, issueDate: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, dueDate: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-gray-700">
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Customer Name</Label>
                                <Input
                                    id="customerName"
                                    placeholder="John Doe"
                                    value={formData.customerName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customerName: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerEmail">Email</Label>
                                <Input
                                    id="customerEmail"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.customerEmail}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customerEmail: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerAddress">Address</Label>
                            <Textarea
                                id="customerAddress"
                                placeholder="123 Main St, City, State 12345"
                                value={formData.customerAddress}
                                onChange={(e) =>
                                    setFormData({ ...formData, customerAddress: e.target.value })
                                }
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm text-gray-700">Line Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {lineItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="col-span-5 space-y-1">
                                        {index === 0 && (
                                            <Label className="text-xs">Description</Label>
                                        )}
                                        <Input
                                            placeholder="Service or product"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateLineItem(index, "description", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        {index === 0 && <Label className="text-xs">Qty</Label>}
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateLineItem(index, "quantity", parseFloat(e.target.value) || 1)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        {index === 0 && <Label className="text-xs">Price</Label>}
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) =>
                                                updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        {index === 0 && <Label className="text-xs">Amount</Label>}
                                        <Input
                                            value={`$${item.amount.toFixed(2)}`}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(index)}
                                            disabled={lineItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2 text-sm">
                                <div className="flex justify-between py-2 border-t">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-t border-gray-800">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-lg">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Thank you for your business!"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            rows={2}
                        />
                    </div>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Invoice"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
