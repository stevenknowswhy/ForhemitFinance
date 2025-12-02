"use client";

/**
 * NotificationDropdown Component
 * Dropdown content showing list of notifications
 */

import { useNotifications } from "@/app/contexts/NotificationContext";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  AlertCircle, 
  X,
  CheckCheck,
  Trash2,
  Clock
} from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "story_complete":
      case "report_complete":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "story_failed":
      case "report_failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "story_complete":
      case "report_complete":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      case "story_failed":
      case "report_failed":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      default:
        return "bg-card border-border";
    }
  };

  const handleNotificationClick = async (notificationId: Id<"notifications">, metadata?: any) => {
    await markAsRead(notificationId);
    
    // Navigate to story if available
    if (metadata?.storyId) {
      // Close dropdown and navigate to reports page
      onClose();
      // The StoriesTab will handle showing the story
      // Use router navigation if available, otherwise use window.location
      if (typeof window !== "undefined") {
        window.location.href = `/reports?story=${metadata.storyId}`;
      }
    } else {
      onClose();
    }
  };

  const unreadNotifications = notifications.filter((n) => n.status === "unread");
  const readNotifications = notifications.filter((n) => n.status === "read");

  return (
    <div className="w-80 sm:w-96">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
              {unreadNotifications.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 px-2 text-xs"
              title="Mark all as read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Unread notifications */}
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary",
                      getNotificationColor(notification.type)
                    )}
                    onClick={() => handleNotificationClick(notification._id, notification.metadata)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Read notifications */}
            {readNotifications.length > 0 && (
              <>
                {unreadNotifications.length > 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Older
                  </div>
                )}
                {readNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer opacity-75",
                      getNotificationColor(notification.type)
                    )}
                    onClick={() => handleNotificationClick(notification._id, notification.metadata)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
