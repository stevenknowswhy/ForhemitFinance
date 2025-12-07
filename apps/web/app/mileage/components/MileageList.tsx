"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Trash2, MapPin, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MileageListProps {
    orgId?: string;
    year: number;
}

export default function MileageList({ orgId, year }: MileageListProps) {
    const entries = useQuery(api.mileage.getMileageEntries, {
        orgId,
        year,
        limit: 50,
    });

    const deleteTrip = useMutation(api.mileage.deleteTrip);

    if (entries === undefined) {
        return <MileageListSkeleton />;
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <Car className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No trips logged</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first business trip.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((trip) => (
                <Card key={trip._id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            {/* Date & Purpose */}
                            <div className="md:col-span-1">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                            {format(trip.date, "MMM dd")}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {trip.purpose}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {trip.vehicle || "Personal Vehicle"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Locations */}
                            <div className="md:col-span-2 hidden md:block">
                                {(trip.startLocation || trip.endLocation) && (
                                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate max-w-[150px]">
                                            {trip.startLocation || "Start"}
                                        </span>
                                        <span className="text-gray-300">→</span>
                                        <span className="truncate max-w-[150px]">
                                            {trip.endLocation || "End"}
                                        </span>
                                        {trip.isRoundTrip && (
                                            <Badge variant="outline" className="ml-2 text-[10px] h-5">
                                                Round Trip
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Amount & Distance */}
                            <div className="md:col-span-1 text-right">
                                <p className="text-sm font-bold text-green-600">
                                    +${trip.amount.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {trip.distance} {trip.distanceUnit}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500"
                                onClick={() => deleteTrip({ id: trip._id })}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function MileageListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
