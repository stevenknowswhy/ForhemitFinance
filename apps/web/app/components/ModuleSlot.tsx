"use client";

/**
 * ModuleSlot Component
 * Dynamically renders add-on components in designated slots
 * 
 * This is the "Slot Pattern" that keeps Core UI clean.
 * Core components don't import add-on components directly.
 */

import { Suspense, lazy, ComponentType } from "react";
import { useFeature } from "@/app/contexts/FeatureContext";

// Type for slot registry entries
type SlotComponent = ComponentType<any>;
type LazySlotComponent = React.LazyExoticComponent<SlotComponent>;

// Registry of slot components by feature and slot name
// Add-on modules register their components here
const SLOT_REGISTRY: Record<string, Record<string, LazySlotComponent>> = {
    // Example: Project Profitability add-on
    // project_profitability: {
    //   "transaction-detail": lazy(() => import("@/app/modules/projects/components/ProjectPicker")),
    //   "dashboard-widgets": lazy(() => import("@/app/modules/projects/components/ProjectSummaryWidget")),
    // },

    // Example: Time Tracking add-on
    // time_tracking: {
    //   "dashboard-widgets": lazy(() => import("@/app/modules/time-tracking/components/TimeWidget")),
    //   "transaction-detail": lazy(() => import("@/app/modules/time-tracking/components/TimeLogButton")),
    // },
};

/**
 * Register a module's slot components
 * Call this to add components to the registry
 */
export function registerModuleSlots(
    moduleSlug: string,
    slots: Record<string, LazySlotComponent>
) {
    SLOT_REGISTRY[moduleSlug] = {
        ...(SLOT_REGISTRY[moduleSlug] || {}),
        ...slots,
    };
}

interface ModuleSlotProps {
    slot: string;
    props?: Record<string, any>;
    fallback?: React.ReactNode;
}

/**
 * Renders all enabled module components for a given slot
 * 
 * @example
 * // In TransactionDetail.tsx
 * <ModuleSlot slot="transaction-detail" props={{ transactionId }} />
 * 
 * // In DashboardWidgets.tsx
 * <ModuleSlot slot="dashboard-widgets" />
 */
export function ModuleSlot({
    slot,
    props = {},
    fallback = null,
}: ModuleSlotProps) {
    const { enabledFeatures, isLoading } = useFeature();

    if (isLoading) {
        return null;
    }

    // Find all enabled modules that have a component for this slot
    const components = enabledFeatures
        .filter((feature) => SLOT_REGISTRY[feature]?.[slot])
        .map((feature) => ({
            feature,
            Component: SLOT_REGISTRY[feature][slot],
        }));

    if (components.length === 0) {
        return <>{fallback}</>;
    }

    return (
        <>
            {components.map(({ feature, Component }) => (
                <Suspense
                    key={feature}
                    fallback={
                        <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                    }
                >
                    <Component {...props} />
                </Suspense>
            ))}
        </>
    );
}

/**
 * Higher-order component to wrap a component with slot registration
 * Useful for add-on module entry points
 */
export function withSlotRegistration<P extends object>(
    moduleSlug: string,
    slots: Record<string, LazySlotComponent>,
    WrappedComponent: ComponentType<P>
) {
    // Register slots when the module loads
    registerModuleSlots(moduleSlug, slots);

    // Return the wrapped component
    return function SlotRegisteredComponent(props: P) {
        return <WrappedComponent {...props} />;
    };
}
