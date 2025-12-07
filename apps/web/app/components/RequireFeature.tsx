"use client";

/**
 * RequireFeature Component
 * Conditionally renders children based on feature entitlement
 */

import { ReactNode } from "react";
import { useFeature } from "@/app/contexts/FeatureContext";

interface RequireFeatureProps {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Renders children only if the specified feature is enabled
 * 
 * @example
 * <RequireFeature feature="project_profitability" fallback={<UpgradePrompt />}>
 *   <ProjectDashboard />
 * </RequireFeature>
 */
export function RequireFeature({
    feature,
    children,
    fallback = null,
}: RequireFeatureProps) {
    const { isFeatureEnabled, isLoading } = useFeature();

    // Show nothing while loading to prevent flash
    if (isLoading) {
        return null;
    }

    if (!isFeatureEnabled(feature)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Default upgrade prompt fallback
 */
export function UpgradePrompt({ feature }: { feature: string }) {
    return (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upgrade to Unlock
            </h3>
            <p className="text-gray-600 mb-4">
                This feature requires the {feature.replace(/_/g, " ")} add-on.
            </p>
            <a
                href="/add-ons"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Browse Add-ons
            </a>
        </div>
    );
}
