/**
 * Notifications Module
 * Handles in-app notifications for background job completion
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { limitArray, normalizeLimit, DEFAULT_QUERY_LIMIT } from "./helpers/convexLimits";

/**
 * Get unread notifications for the current user
 */
export const getUnreadNotifications = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            return [];
        }

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_status", (q: any) =>
                q.eq("userId", user._id).eq("status", "unread")
            )
            .collect();
        
        // Sort by createdAt descending and apply safe limit
        notifications.sort((a, b) => b.createdAt - a.createdAt);
        return limitArray(notifications, 50);
    },
});

/**
 * Get all notifications for the current user (with limit)
 */
export const getAllNotifications = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            return [];
        }

        const safeLimit = normalizeLimit(args.limit, DEFAULT_QUERY_LIMIT);
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q: any) => q.eq("userId", user._id))
            .collect();
        
        // Sort by createdAt descending and apply safe limit
        notifications.sort((a, b) => b.createdAt - a.createdAt);
        return limitArray(notifications, safeLimit);
    },
});

/**
 * Get count of unread notifications
 */
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            return 0;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            return 0;
        }

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_status", (q: any) =>
                q.eq("userId", user._id).eq("status", "unread")
            )
            .collect();

        return notifications.length;
    },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const notification = await ctx.db.get(args.notificationId);
        if (!notification || notification.userId !== user._id) {
            throw new Error("Notification not found or unauthorized");
        }

        await ctx.db.patch(args.notificationId, {
            status: "read",
            readAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark all notifications as read for the current user
 */
export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const unreadNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_status", (q: any) =>
                q.eq("userId", user._id).eq("status", "unread")
            )
            .collect();

        const now = Date.now();
        await Promise.all(
            unreadNotifications.map((notification) =>
                ctx.db.patch(notification._id, {
                    status: "read",
                    readAt: now,
                })
            )
        );

        return { success: true, count: unreadNotifications.length };
    },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const notification = await ctx.db.get(args.notificationId);
        if (!notification || notification.userId !== user._id) {
            throw new Error("Notification not found or unauthorized");
        }

        await ctx.db.delete(args.notificationId);

        return { success: true };
    },
});

/**
 * Create a notification (internal mutation - called by background jobs)
 */
export const createNotification = internalMutation({
    args: {
        userId: v.id("users"),
        orgId: v.optional(v.id("organizations")),
        type: v.union(
            v.literal("story_complete"),
            v.literal("story_failed"),
            v.literal("report_complete"),
            v.literal("report_failed")
        ),
        title: v.string(),
        message: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const notificationId = await ctx.db.insert("notifications", {
            userId: args.userId,
            orgId: args.orgId,
            type: args.type,
            title: args.title,
            message: args.message,
            status: "unread",
            metadata: args.metadata,
            createdAt: Date.now(),
        });

        return notificationId;
    },
});
