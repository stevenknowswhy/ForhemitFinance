"use client";

/**
 * SyncStatus Component
 * Displays sync status for connected bank accounts
 */

import React from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RefreshCw, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusProps {
  institutionId?: string;
  className?: string;
}

export function SyncStatus({ institutionId, className }: SyncStatusProps) {
  const institutions = useQuery(api.plaid.getUserInstitutions);
  const syncAccounts = useAction(api.plaid.syncAccounts);

  const [isSyncing, setIsSyncing] = React.useState(false);

  // If institutionId provided, show only that institution
  // Otherwise show all institutions
  const displayInstitutions = institutionId
    ? institutions?.filter((inst: any) => inst._id === institutionId)
    : institutions;

  const handleManualSync = async (instId: string) => {
    setIsSyncing(true);
    try {
      await syncAccounts({ institutionId: instId as any });
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!displayInstitutions || displayInstitutions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {displayInstitutions.map((institution: any) => {
        const status = institution.syncStatus || "active";
        const lastSync = institution.lastSyncAt
          ? formatDistanceToNow(new Date(institution.lastSyncAt), {
              addSuffix: true,
            })
          : "Never";
        const hasError = institution.lastError;

        return (
          <div
            key={institution._id}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-foreground">
                    {institution.name}
                  </h3>
                  {status === "active" && !hasError && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  {status === "error" && (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  {status === "disconnected" && (
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Last synced: {lastSync}</span>
                  </div>

                  {hasError && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs">
                      <div className="font-medium mb-1">
                        {institution.lastError.type}: {institution.lastError.code}
                      </div>
                      <div>{institution.lastError.message}</div>
                    </div>
                  )}

                  {status === "disconnected" && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      Connection lost. Please reconnect your account.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleManualSync(institution._id)}
                disabled={isSyncing}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2",
                  isSyncing && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Sync now"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4",
                    isSyncing && "animate-spin"
                  )}
                />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
