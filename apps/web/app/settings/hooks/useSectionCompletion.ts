"use client";

import { useMemo } from "react";

/**
 * Calculate completion percentage for a section based on field values
 */
export function useSectionCompletion(fields: Array<{ value: any; isPlaceholder?: boolean }>): number {
  return useMemo(() => {
    const totalFields = fields.length;
    if (totalFields === 0) return 100;

    const completedFields = fields.filter(field => {
      if (field.isPlaceholder) return false;
      const value = field.value;
      if (value === null || value === undefined) return false;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "—" || trimmed === "N/A" || trimmed === "…" || trimmed === "...") {
          return false;
        }
      }
      if (typeof value === "boolean") return true;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }).length;

    return Math.round((completedFields / totalFields) * 100);
  }, [fields]);
}

