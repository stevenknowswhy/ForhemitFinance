"use client";

import { Sparkles, FolderOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "no-categories" | "no-vendors" | "first-transaction";
  className?: string;
}

export function TransactionEmptyState({ type, className }: EmptyStateProps) {
  if (type === "no-categories") {
    return (
      <div className={cn("text-center py-8 px-4", className)}>
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-2">
          No categories yet
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          You haven&apos;t set up categories yet. We&apos;ll start you with some smart defaults.
        </p>
      </div>
    );
  }

  if (type === "no-vendors") {
    return (
      <div className={cn("text-center py-4 px-4", className)}>
        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Start typing to search or create a new vendor
        </p>
      </div>
    );
  }

  if (type === "first-transaction") {
    return (
      <div className={cn("text-center py-6 px-4 bg-primary/5 rounded-lg border border-primary/20", className)}>
        <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Your first transaction!
        </h3>
        <p className="text-xs text-muted-foreground">
          We&apos;ll learn from your entries to make future transactions even faster.
        </p>
      </div>
    );
  }

  return null;
}

