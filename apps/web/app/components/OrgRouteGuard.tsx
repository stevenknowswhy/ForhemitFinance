"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgContext } from "../contexts/OrgContext";
import { useUser } from "@clerk/nextjs";

interface OrgRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard that ensures user has selected an organization
 * Redirects to org selection if no org is available
 */
export function OrgRouteGuard({
  children,
  redirectTo = "/onboarding",
}: OrgRouteGuardProps) {
  const { currentOrgId, userOrganizations, isLoading } = useOrgContext();
  const { isLoaded: isClerkLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth and org context to load
    if (!isClerkLoaded || isLoading) {
      return;
    }

    // Check if onboarding just completed (sessionStorage flag)
    const justCompletedOnboarding = typeof window !== 'undefined' && sessionStorage.getItem('justCompletedOnboarding') === 'true';

    // Priority 1: If currentOrgId exists (even if userOrganizations is empty), don't redirect
    // This handles the case where orgId was manually set from mutation result
    if (currentOrgId) {
      return; // Org is set, no redirect needed
    }

    // Priority 2: If onboarding just completed, give more time for queries to update
    if (justCompletedOnboarding) {
      const timeoutId = setTimeout(() => {
        // Check again if orgId was set in the meantime
        if (!currentOrgId && userOrganizations.length === 0) {
          router.push(redirectTo);
        }
      }, 3000); // Give 3 seconds for queries to update after onboarding
      return () => clearTimeout(timeoutId);
    }

    // Priority 3: If user has no organizations, redirect to onboarding
    // Use a longer delay to prevent rapid redirects and allow queries to settle
    if (userOrganizations.length === 0) {
      const timeoutId = setTimeout(() => {
        router.push(redirectTo);
      }, 2000); // Increased delay to allow onboarding completion to propagate
      return () => clearTimeout(timeoutId);
    }

    // If user has orgs but none selected, select the first one
    // This will be handled by OrgContextProvider's useEffect
    // No need to do anything here
  }, [currentOrgId, userOrganizations.length, isLoading, isClerkLoaded, router, redirectTo]);

  // Show loading state
  if (!isClerkLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if onboarding just completed
  const justCompletedOnboarding = typeof window !== 'undefined' && sessionStorage.getItem('justCompletedOnboarding') === 'true';

  // If no orgs available, show message (redirect will happen)
  // BUT: If currentOrgId exists or onboarding just completed, don't redirect yet
  if (userOrganizations.length === 0 && !currentOrgId && !justCompletedOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No organizations found. Redirecting...</p>
        </div>
      </div>
    );
  }

  // If onboarding just completed but no orgId yet, show loading (queries updating)
  if (justCompletedOnboarding && !currentOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If no org selected but orgs exist, show loading (selection in progress)
  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Selecting organization...</p>
        </div>
      </div>
    );
  }

  // All good, render children
  return <>{children}</>;
}
