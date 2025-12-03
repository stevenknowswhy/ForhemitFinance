/**
 * Stories Module Navigation
 */

import { BookOpen } from "lucide-react";
import { ModuleNavigationItem } from "../core/types";

export const storiesNavigation: ModuleNavigationItem[] = [
  {
    id: "stories",
    label: "Stories",
    href: "/stories",
    icon: BookOpen,
    order: 4,
    requiresPermission: "VIEW_STORIES",
  },
];

