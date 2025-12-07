"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
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

interface AddTripDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId?: string;
}

export default function AddTripDrawer({
    open,
    onOpenChange,
    orgId,
}: AddTripDrawerProps) {
    const { toast } = useToast();
    const addTrip = useMutation(api.mileage.addTrip);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        startLocation: "",
        endLocation: "",
        distance: "",
        purpose: "",
        vehicle: "",
        isRoundTrip: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.distance || !formData.purpose) {
                throw new Error("Please fill in required fields");
            }

            await addTrip({
                orgId,
                date: new Date(formData.date).getTime(),
                startLocation: formData.startLocation,
                endLocation: formData.endLocation,
                distance: parseFloat(formData.distance),
                distanceUnit: "miles", // defaulting to miles for now
                purpose: formData.purpose,
                vehicle: formData.vehicle,
                isRoundTrip: formData.isRoundTrip,
            });

            toast({
                title: "Trip added",
                description: "Your mileage has been logged successfully.",
            });

            onOpenChange(false);
            // Reset form
            setFormData({
                date: new Date().toISOString().split("T")[0],
                startLocation: "",
                endLocation: "",
                distance: "",
                purpose: "",
                vehicle: "",
                isRoundTrip: false,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add trip. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Log Mileage</SheetTitle>
                    <SheetDescription>
                        Add a new trip to track your tax deductions.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distance">Distance (Miles)</Label>
                            <Input
                                id="distance"
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={formData.distance}
                                onChange={(e) =>
                                    setFormData({ ...formData, distance: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Input
                            id="purpose"
                            placeholder="e.g. Client Meeting, Supply Run"
                            value={formData.purpose}
                            onChange={(e) =>
                                setFormData({ ...formData, purpose: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start">Start Location (Optional)</Label>
                            <Input
                                id="start"
                                placeholder="Office"
                                value={formData.startLocation}
                                onChange={(e) =>
                                    setFormData({ ...formData, startLocation: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">End Location (Optional)</Label>
                            <Input
                                id="end"
                                placeholder="Client Site"
                                value={formData.endLocation}
                                onChange={(e) =>
                                    setFormData({ ...formData, endLocation: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehicle">Vehicle (Optional)</Label>
                        <Input
                            id="vehicle"
                            placeholder="e.g. Tesla Model 3"
                            value={formData.vehicle}
                            onChange={(e) =>
                                setFormData({ ...formData, vehicle: e.target.value })
                            }
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="roundtrip"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={formData.isRoundTrip}
                            onChange={(e) =>
                                setFormData({ ...formData, isRoundTrip: e.target.checked })
                            }
                        />
                        <Label htmlFor="roundtrip">Round Trip?</Label>
                    </div>

                    <SheetFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Trip"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
