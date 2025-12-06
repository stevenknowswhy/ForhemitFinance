/**
 * Module manifests for Convex
 * Simplified version of full manifests for use in Convex backend
 */

export const storiesManifest = {
  id: "stories",
  version: "1.0.0",
  name: "AI Stories",
  description: "Generate AI-powered narrative stories from your financial data",
  icon: "BookOpen",
  category: "analytics" as const,
  billing: {
    type: "free" as const,
  },
  permissions: [] as string[],
  routes: [] as any[],
  navigation: [] as any[],
  insightsNavigation: undefined as any,
  featureFlags: {} as any,
  metadata: {} as any,
};

export const reportsManifest = {
  id: "reports",
  version: "1.0.0",
  name: "Reports",
  description: "Advanced financial reports and analytics",
  icon: "FileText",
  category: "analytics" as const,
  billing: {
    type: "free" as const,
  },
  permissions: [] as string[],
  routes: [] as any[],
  navigation: [] as any[],
  insightsNavigation: undefined as any,
  featureFlags: {} as any,
  metadata: {} as any,
};

export function getAllModuleManifests() {
  return [
    storiesManifest,
    reportsManifest,
  ];
}