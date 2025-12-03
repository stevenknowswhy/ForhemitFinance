/**
 * Reports Module Navigation
 */

import { FileText } from "lucide-react";
import { ModuleNavigationItem } from "../core/types";

export const reportsNavigation: ModuleNavigationItem[] = [
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: FileText,
    order: 3,
    requiresPermission: "VIEW_REPORTS",
  },
];

