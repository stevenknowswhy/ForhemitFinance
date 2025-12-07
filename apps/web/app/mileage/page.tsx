"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Car, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import MileageList from "./components/MileageList";
import AddTripDrawer from "./components/AddTripDrawer";

export default function MileagePage() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // TODO: Get active Org ID from context/hook
    const orgId = undefined; // Assuming personal or default for now

    // Stats query
    const stats = useQuery(api.mileage.getMileageStats, {
        year: selectedYear,
        orgId,
    });

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mileage Tracking</h1>
                    <p className="text-gray-500 mt-1">
                        Track your business trips and maximize your tax deductions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(val) => setSelectedYear(parseInt(val))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[0, 1, 2].map((offset) => {
                                const year = new Date().getFullYear() - offset;
                                return (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    <Button onClick={() => setIsDrawerOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Log Trip
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deduction</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats?.totalDeduction.toFixed(2) || "0.00"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Estimated tax savings for {selectedYear}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Miles</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalDistance.toFixed(1) || "0.0"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Miles driven in {selectedYear}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                        <Car className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalTrips || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            Logged trips/events
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <MileageList orgId={orgId} year={selectedYear} />
                </CardContent>
            </Card>

            <AddTripDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                orgId={orgId}
            />
        </div>
    );
}
