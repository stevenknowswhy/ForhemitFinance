"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dateUtils";

interface DateSelectorProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  className?: string;
}

export function DateSelector({ value, onChange, className }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  // Parse date string as local date to avoid timezone issues
  const selectedDate = parseLocalDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const isToday = selectedDate.toDateString() === today.toDateString();
  const isYesterday = selectedDate.toDateString() === yesterday.toDateString();
  const isLastWeek = selectedDate.getTime() >= lastWeek.getTime() && selectedDate.getTime() < today.getTime();

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleQuickSelect = (date: Date) => {
    onChange(formatDate(date));
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    // Parse date string as local date to avoid timezone issues
    const date = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateOnly.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    // Format as "Mon, Jan 15" or "Jan 15, 2025" if not this year
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    
    if (date.getFullYear() !== today.getFullYear()) {
      options.year = "numeric";
    }
    
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Quick Select Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleQuickSelect(today)}
          data-active={isToday}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-all h-8",
            isToday
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(yesterday)}
          data-active={isYesterday}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-all h-8",
            isYesterday
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
        >
          Yesterday
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(lastWeek)}
          data-active={isLastWeek}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-all h-8",
            isLastWeek
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
        >
          Last Week
        </button>
      </div>

      {/* Date Input with Calendar Icon */}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900",
            "focus:outline-none focus:ring-2 focus:ring-rose-400 text-base min-h-[44px]",
            !isToday && "text-slate-600"
          )}
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* Visual Indicator */}
      {!isToday && (
        <p className="text-xs text-slate-500 mt-1">
          Selected: {formatDisplayDate(value)}
        </p>
      )}
    </div>
  );
}

