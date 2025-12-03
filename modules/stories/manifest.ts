/**
 * Stories Module Manifest
 * AI-powered narrative stories for financial data
 */

import { ModuleManifest } from "../core/types";
import { BookOpen } from "lucide-react";

export const storiesManifest: ModuleManifest = {
  id: "stories",
  version: "1.0.0",
  name: "AI Stories",
  description: "Generate AI-powered narrative stories from your financial data. Create company stories, banker stories, and investor stories for monthly, quarterly, or annual periods.",
  icon: BookOpen,
  category: "analytics",
  
  // No dependencies
  dependencies: [],
  
  // Permissions required for this module
  permissions: [
    "VIEW_STORIES",
    "GENERATE_STORIES",
    "EXPORT_STORIES",
  ],
  
  // Routes provided by this module
  routes: [
    {
      path: "/stories",
      label: "Stories",
      requiresAuth: true,
      requiresPermission: "VIEW_STORIES",
    },
    {
      path: "/reports?tab=stories",
      label: "Stories Tab",
      requiresAuth: true,
      requiresPermission: "VIEW_STORIES",
    },
  ],
  
  // Navigation items
  navigation: [
    {
      id: "stories",
      label: "Stories",
      href: "/stories",
      icon: BookOpen,
      order: 4,
      requiresPermission: "VIEW_STORIES",
    },
  ],
  
  // Billing: Free for all tiers initially
  billing: {
    type: "free",
  },
  
  // Database tables used by this module
  dataTables: [
    "ai_stories",
  ],
  
  // Feature flags
  featureFlags: {
    enableAutoGeneration: true,
    enablePDFExport: true,
    enableMultiplePeriods: true,
  },
  
  // Module metadata
  metadata: {
    storyTypes: ["company", "banker", "investor"],
    periodTypes: ["monthly", "quarterly", "annually"],
  },
};

