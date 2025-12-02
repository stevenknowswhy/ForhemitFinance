"use client";

/**
 * NotificationBell Component
 * Bell icon with unread badge and dropdown for notifications
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { unreadCount, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center",
                "animate-pulse"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={5}>
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
