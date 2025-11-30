"use client";

import { ActivityItem } from "@tests/mocks/data/dashboard-mock-data";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: ActivityItem[];
}

export function DataTable({ data }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
      </div>
      <div className="divide-y divide-border" role="table" aria-label="Recent activity">
        {data.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "p-4 transition-colors duration-150",
              "hover:bg-muted/50",
              "focus-within:bg-muted/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-inset"
            )}
            role="row"
            tabIndex={0}
            aria-label={`Activity ${index + 1}: ${item.description}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.description}</div>
                <div className="text-sm text-muted-foreground">
                  <time dateTime={item.timestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </time>
                </div>
              </div>
              {item.value && (
                <div className="font-semibold" aria-label={`Value: $${item.value.toFixed(2)}`}>
                  ${item.value.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

