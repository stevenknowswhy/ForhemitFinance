/**
 * Reports Module Permissions
 */

export const REPORTS_PERMISSIONS = {
  VIEW_REPORTS: "VIEW_REPORTS",
  EXPORT_REPORTS: "EXPORT_REPORTS",
} as const;

export type ReportsPermission = typeof REPORTS_PERMISSIONS[keyof typeof REPORTS_PERMISSIONS];

