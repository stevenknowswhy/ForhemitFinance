"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

interface OrgContextType {
  currentOrgId: Id<"organizations"> | null;
  currentOrg: any | null;
  userRole: string | null;
  userOrganizations: any[];
  isLoading: boolean;
  error: string | null;
  setCurrentOrg: (orgId: Id<"organizations">) => Promise<void>;
  refreshOrgs: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgContextProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [currentOrgId, setCurrentOrgId] = useState<Id<"organizations"> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user's email for lookup
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  // Get user record from Convex (using getCurrentUser which uses auth)
  const userRecord = useQuery(api.users.getCurrentUser);

  // Get user's organizations
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    userRecord?._id ? { userId: userRecord._id } : "skip"
  );

  // Get current org details
  const currentOrgData = useQuery(
    api.organizations.getCurrentOrg,
    userRecord?._id && currentOrgId
      ? { userId: userRecord._id, orgId: currentOrgId }
      : "skip"
  );

  // Set last used org mutation
  const setLastUsedOrg = useMutation(api.organizations.setLastUsedOrg);

  // Initialize: Load orgId from localStorage or use first org
  useEffect(() => {
    if (!isClerkLoaded || !userRecord?._id || isInitialized) {
      return;
    }

    // Try to load from localStorage first (even if userOrganizations hasn't loaded yet)
    // This is important for logged-in users who already have an org
    const storedOrgId = localStorage.getItem("currentOrgId");
    if (storedOrgId && !currentOrgId) {
      // Set it immediately if we have it in localStorage
      // We'll validate it against userOrganizations once that query loads
      setCurrentOrgId(storedOrgId as Id<"organizations">);
    }

    // If userOrganizations query hasn't loaded yet, wait
    if (userOrganizations === undefined) {
      return;
    }

    // If organizations array is empty, check if we have a stored orgId
    // If we do, keep it (it might just be that the query hasn't updated yet)
    if (userOrganizations.length === 0) {
      // If we have a stored orgId, keep it (might be valid but query is stale)
      // Otherwise, mark as initialized so we don't wait forever
      if (!storedOrgId) {
        setIsInitialized(true);
      }
      return;
    }

    // Validate stored orgId against actual user organizations
    if (storedOrgId && userOrganizations.some((org: any) => org._id === storedOrgId)) {
      // Stored orgId is valid, use it
      if (currentOrgId !== storedOrgId) {
        setCurrentOrgId(storedOrgId as Id<"organizations">);
      }
    } else if (userOrganizations.length > 0) {
      // Use first org (either no stored orgId or stored one is invalid)
      setCurrentOrgId(userOrganizations[0]._id);
      localStorage.setItem("currentOrgId", userOrganizations[0]._id);
    }

    setIsInitialized(true);
  }, [isClerkLoaded, userRecord, userOrganizations, isInitialized, currentOrgId]);

  // Update localStorage when orgId changes
  useEffect(() => {
    if (currentOrgId) {
      localStorage.setItem("currentOrgId", currentOrgId);
      // Update last used org in backend
      if (userRecord?._id) {
        setLastUsedOrg({ userId: userRecord._id, orgId: currentOrgId }).catch(
          (err) => console.error("Failed to set last used org:", err)
        );
      }
    }
  }, [currentOrgId, userRecord, setLastUsedOrg]);

  const setCurrentOrg = async (orgId: Id<"organizations">) => {
    // Immediately update state and localStorage - don't wait for queries
    // This is critical for onboarding flow where orgId comes from mutation result
    setCurrentOrgId(orgId);
    localStorage.setItem("currentOrgId", orgId);

    // Update backend asynchronously (don't block)
    if (userRecord?._id) {
      setLastUsedOrg({ userId: userRecord._id, orgId }).catch(
        (err) => console.error("Failed to set last used org:", err)
      );
    }
  };

  const refreshOrgs = () => {
    // Force refetch by clearing cache (Convex handles this automatically)
    // This is mainly for UI feedback
  };

  const isLoading: boolean = Boolean(
    !isClerkLoaded ||
    !userRecord?._id ||
    userOrganizations === undefined ||
    (currentOrgId && currentOrgData === undefined)
  );

  const error: string | null = userOrganizations === null ? "Failed to load organizations" : null;

  const value: OrgContextType = {
    currentOrgId,
    currentOrg: currentOrgData?.org || null,
    userRole: currentOrgData?.role || null,
    userOrganizations: userOrganizations || [],
    isLoading,
    error,
    setCurrentOrg,
    refreshOrgs,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within OrgContextProvider");
  }
  return context;
}
