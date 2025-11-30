"use client";

/**
 * Stories Tab Component
 * Placeholder for AI Stories feature (Phase 2)
 */

import { BookOpen } from "lucide-react";

export function StoriesTab() {
  return (
    <div className="bg-card rounded-lg shadow border border-border p-8 md:p-12 text-center">
      <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        AI Stories Coming Soon
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Forhemit Finance Stories will automatically generate three tailored narratives:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Company Story</h3>
          <p className="text-sm text-muted-foreground">
            For internal use - burn rate, trends, cash runway, and recommendations.
          </p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Banker Story</h3>
          <p className="text-sm text-muted-foreground">
            For banks and creditors - debt ratios, cash flow reliability, and financial discipline.
          </p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Investor Story</h3>
          <p className="text-sm text-muted-foreground">
            For investors - growth indicators, revenue efficiency, and 12-24 month outlook.
          </p>
        </div>
      </div>
    </div>
  );
}

