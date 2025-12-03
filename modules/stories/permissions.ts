/**
 * Stories Module Permissions
 */

export const STORIES_PERMISSIONS = {
  VIEW_STORIES: "VIEW_STORIES",
  GENERATE_STORIES: "GENERATE_STORIES",
  EXPORT_STORIES: "EXPORT_STORIES",
} as const;

export type StoriesPermission = typeof STORIES_PERMISSIONS[keyof typeof STORIES_PERMISSIONS];

