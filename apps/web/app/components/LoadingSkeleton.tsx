"use client";

/**
 * Loading Skeleton Components
 * Provides consistent loading states throughout the app
 */

import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6 animate-pulse",
        className
      )}
    >
      <div className="h-4 bg-muted rounded w-1/3 mb-4" />
      <div className="h-8 bg-muted rounded w-1/2" />
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="p-4 border-b border-border animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
        <div className="h-6 bg-muted rounded w-20" />
      </div>
    </div>
  );
}

export function EntryPreviewSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-20" />
      </div>
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
      <div className="h-3 bg-muted rounded w-full" />
      <div className="flex items-center gap-2">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded w-20" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6 animate-pulse",
        className
      )}
    >
      <div className="h-5 bg-muted rounded w-1/4 mb-4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}
