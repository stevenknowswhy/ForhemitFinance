"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ChartContainer({
  children,
  title,
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

