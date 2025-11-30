"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  onDateRangeChange?: (start: Date, end: Date) => void;
  className?: string;
}

const PRESET_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
];

export function DateRangePicker({
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState(PRESET_RANGES[1]);
  const [isOpen, setIsOpen] = useState(false);

  const handleRangeSelect = (range: typeof PRESET_RANGES[0]) => {
    setSelectedRange(range);
    setIsOpen(false);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - range.days);

    onDateRangeChange?.(start, end);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-card border border-border",
          "hover:bg-muted transition-colors",
          "text-sm font-medium"
        )}
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedRange.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 z-20 bg-card border border-border rounded-lg shadow-lg min-w-[200px]">
            {PRESET_RANGES.map((range: any) => (
              <button
                key={range.label}
                onClick={() => handleRangeSelect(range)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm",
                  "hover:bg-muted transition-colors",
                  "first:rounded-t-lg last:rounded-b-lg",
                  selectedRange.label === range.label && "bg-muted"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

