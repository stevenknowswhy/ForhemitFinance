"use client";

import { useOrg } from "../contexts/OrgContext";
import { Id } from "convex/_generated/dataModel";

/**
 * Hook to get current orgId with loading and error states
 * Throws if orgId is not available (for use in components that require org)
 */
export function useOrgId(): {
  orgId: Id<"organizations">;
  isLoading: boolean;
  error: string | null;
} {
  const { currentOrgId, isLoading, error } = useOrg();

  if (!currentOrgId && !isLoading) {
    throw new Error("No organization selected. Please select an organization.");
  }

  if (error) {
    throw new Error(error);
  }

  return {
    orgId: currentOrgId!,
    isLoading,
    error,
  };
}

/**
 * Hook to get current orgId (nullable version)
 * Use this when orgId is optional
 */
export function useOrgIdOptional(): {
  orgId: Id<"organizations"> | null;
  isLoading: boolean;
  error: string | null;
} {
  const { currentOrgId, isLoading, error } = useOrg();
  return { orgId: currentOrgId, isLoading, error };
}
