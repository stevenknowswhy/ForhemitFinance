"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrgIdOptional } from "../../hooks/useOrgId";

export function PaymentCalendar() {
    const { orgId } = useOrgIdOptional();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Calculate calendar grid range
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    // Fetch events for the visible range
    const eventsQuery = useQuery(api.calendar.getEvents, orgId ? {
        orgId,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
    } : "skip");

    interface CalendarEvent {
        id: string;
        type: string;
        title: string;
        date: number;
        amount: number;
        status: string;
        currency: string;
    }

    const events = (eventsQuery || []) as CalendarEvent[];

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    if (!orgId) return <div>Please select an organization.</div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-md border">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b bg-muted/50">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7">
                    {events === undefined ? (
                        <div className="col-span-7 h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        days.map((day) => {
                            const dayEvents = events.filter((e) => isSameDay(e.date, day));
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());

                            // Calculate totals
                            const totalBills = dayEvents
                                .filter(e => e.type !== 'income')
                                .reduce((sum, e) => sum + e.amount, 0);
                            const totalIncome = dayEvents
                                .filter(e => e.type === 'income')
                                .reduce((sum, e) => sum + e.amount, 0);

                            return (
                                <Popover key={day.toISOString()}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={cn(
                                                "min-h-[100px] border-b border-r p-2 cursor-pointer transition-colors hover:bg-muted/30 flex flex-col justify-between",
                                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                                isToday && "bg-blue-50/50 dark:bg-blue-900/10"
                                            )}
                                            onClick={() => setSelectedDate(day)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span
                                                    className={cn(
                                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                                        isToday && "bg-primary text-primary-foreground"
                                                    )}
                                                >
                                                    {format(day, "d")}
                                                </span>
                                                {/* Dots/Indicators */}
                                                <div className="flex gap-1 flex-wrap justify-end max-w-[60%]">
                                                    {dayEvents.slice(0, 3).map((e, i) => (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                e.type === 'income' ? "bg-green-500" : "bg-red-500"
                                                            )}
                                                        />
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <span className="text-[10px] leading-none text-muted-foreground">+</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Daily Totals Summary */}
                                            <div className="space-y-0.5 mt-1">
                                                {totalIncome > 0 && (
                                                    <div className="text-[10px] font-medium text-green-600 dark:text-green-400 truncate">
                                                        +${totalIncome.toLocaleString()}
                                                    </div>
                                                )}
                                                {totalBills > 0 && (
                                                    <div className="text-[10px] font-medium text-red-600 dark:text-red-400 truncate">
                                                        -${totalBills.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="space-y-4">
                                            <div className="font-medium border-b pb-2">
                                                {format(day, "EEEE, MMMM d, yyyy")}
                                            </div>
                                            {dayEvents.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No payments due or expected.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dayEvents.map((event) => (
                                                        <div key={event.id} className="flex justify-between items-center text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "h-2 w-2 rounded-full",
                                                                    event.type === 'income' ? "bg-green-500" :
                                                                        event.type === 'bill' ? "bg-red-500" : "bg-orange-500"
                                                                )} />
                                                                <div>
                                                                    <div className="font-medium">{event.title}</div>
                                                                    <div className="text-xs text-muted-foreground capitalize">{event.type} • {event.status}</div>
                                                                </div>
                                                            </div>
                                                            <div className={cn(
                                                                "font-medium",
                                                                event.type === 'income' ? "text-green-600" : "text-red-600"
                                                            )}>
                                                                {event.type === 'income' ? '+' : '-'}${event.amount.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
