"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CompletionProgressProps {
  fields: Array<{ value: any; isPlaceholder?: boolean }>;
  className?: string;
}

export function CompletionProgress({ fields, className }: CompletionProgressProps) {
  const completion = useMemo(() => {
    const totalFields = fields.length;
    if (totalFields === 0) return 100;

    const completedFields = fields.filter((field: any) => {
      if (field.isPlaceholder) return false;
      const value = field.value;
      if (value === null || value === undefined) return false;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "—" || trimmed === "N/A" || trimmed === "…" || trimmed === "...") {
          return false;
        }
      }
      if (typeof value === "boolean") return true; // Boolean fields count as completed
      if (Array.isArray(value)) return value.length > 0; // Arrays count if they have items
      return true;
    }).length;

    return Math.round((completedFields / totalFields) * 100);
  }, [fields]);

  const getColor = () => {
    if (completion >= 75) return "text-green-600";
    if (completion >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getStrokeColor = () => {
    if (completion >= 75) return "stroke-green-600";
    if (completion >= 40) return "stroke-yellow-600";
    return "stroke-red-600";
  };

  const circumference = 2 * Math.PI * 12; // radius = 12
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("text-xs font-medium", getColor())}>
        {completion}%
      </span>
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
          {/* Background circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={getStrokeColor()}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
      </div>
    </div>
  );
}

