"use client";

/**
 * Goals Tab Component
 * Placeholder for Goals feature
 */

import { Target } from "lucide-react";

export function GoalsTab() {
  return (
    <div className="bg-card rounded-lg shadow border border-border p-8 md:p-12 text-center">
      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Goals Coming Soon
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Set and track financial goals for your business, including revenue targets, expense reduction goals, and cash flow objectives.
      </p>
    </div>
  );
}

