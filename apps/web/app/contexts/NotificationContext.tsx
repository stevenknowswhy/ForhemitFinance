"use client";

/**
 * NotificationContext
 * Provides notification polling and management for background job completion
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Id } from "@convex/_generated/dataModel";

interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  orgId?: Id<"organizations">;
  type: "story_complete" | "story_failed" | "report_complete" | "report_failed";
  title: string;
  message: string;
  status: "unread" | "read";
  metadata?: any;
  createdAt: number;
  readAt?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: Id<"notifications">) => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(Date.now());

  // Poll for notifications every 10 seconds
  const notifications = useQuery(api.notifications.getAllNotifications, { limit: 50 }) || [];
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    const newNotifications = notifications.filter(
      (n: Notification) => n.createdAt > lastNotificationTime && n.status === "unread"
    );

    if (newNotifications.length > 0) {
      // Update last notification time
      const latestTime = Math.max(...newNotifications.map((n: Notification) => n.createdAt));
      setLastNotificationTime(latestTime);

      // Show toast for each new notification
      newNotifications.forEach((notification: Notification) => {
        const isError = notification.type === "story_failed" || notification.type === "report_failed";
        
        toast({
          title: notification.title,
          description: notification.message,
          variant: isError ? "destructive" : "default",
          duration: 5000,
        });
      });
    }
  }, [notifications, lastNotificationTime, toast]);

  const markAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsReadMutation({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation({});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotificationMutation({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isLoading: notifications === undefined,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
