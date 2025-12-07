"use client";

/**
 * Feature Context
 * Provides org-level feature entitlement data to the UI
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Entitlement {
    moduleSlug: string;
    enabled: boolean;
    status: string;
    trialEnd?: number;
    isFree: boolean;
}

interface FeatureContextType {
    isFeatureEnabled: (slug: string) => boolean;
    getFeatureStatus: (slug: string) => Entitlement | undefined;
    enabledFeatures: string[];
    isLoading: boolean;
}

const FeatureContext = createContext<FeatureContextType | null>(null);

interface FeatureProviderProps {
    orgId: Id<"organizations"> | string | undefined;
    children: ReactNode;
}

export function FeatureProvider({ orgId, children }: FeatureProviderProps) {
    // Query entitlements for the org
    const entitlements = useQuery(
        api.marketplace.entitlements.getOrgEntitlements,
        orgId ? { orgId: orgId as Id<"organizations"> } : "skip"
    );

    const value = useMemo(() => {
        const enabledFeatures =
            entitlements
                ?.filter(
                    (e) =>
                        e.enabled &&
                        (e.status === "active" ||
                            e.status === "trialing" ||
                            e.status === "free")
                )
                .map((e) => e.moduleSlug) || [];

        const isFeatureEnabled = (slug: string) => enabledFeatures.includes(slug);

        const getFeatureStatus = (slug: string) =>
            entitlements?.find((e) => e.moduleSlug === slug);

        return {
            isFeatureEnabled,
            getFeatureStatus,
            enabledFeatures,
            isLoading: entitlements === undefined,
        };
    }, [entitlements]);

    return (
        <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
    );
}

export function useFeature() {
    const ctx = useContext(FeatureContext);
    if (!ctx) {
        throw new Error("useFeature must be used within a FeatureProvider");
    }
    return ctx;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useIsFeatureEnabled(slug: string): boolean {
    const { isFeatureEnabled, isLoading } = useFeature();
    if (isLoading) return false;
    return isFeatureEnabled(slug);
}
