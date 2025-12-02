/**
 * Audit logging system
 * Phase 1: Shared Foundation
 */

import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export interface AuditLogParams {
  orgId?: Id<"organizations">;
  actorUserId: Id<"users">;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  isImpersonation?: boolean;
  impersonatedUserId?: Id<"users">;
}

/**
 * Log an audit event
 * Note: Must be called from a mutation context (ctx.db.insert requires MutationCtx)
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  params: AuditLogParams
): Promise<Id<"audit_logs">> {
  return await ctx.db.insert("audit_logs", {
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    isImpersonation: params.isImpersonation ?? false,
    impersonatedUserId: params.impersonatedUserId,
    createdAt: Date.now(),
  });
}

/**
 * Helper: Log organization update
 */
export async function logOrgUpdated(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    actorUserId: Id<"users">;
    actorRole?: string;
    changes: any;
  }
): Promise<Id<"audit_logs">> {
  return await logAuditEvent(ctx, {
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "ORG_UPDATED",
    targetType: "organization",
    targetId: params.orgId,
    metadata: { changes: params.changes },
  });
}

/**
 * Helper: Log user invitation
 */
export async function logUserInvited(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    actorUserId: Id<"users">;
    actorRole?: string;
    invitedUserId: Id<"users">;
    role: string;
  }
): Promise<Id<"audit_logs">> {
  return await logAuditEvent(ctx, {
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "USER_INVITED",
    targetType: "user",
    targetId: params.invitedUserId,
    metadata: { role: params.role },
  });
}

/**
 * Helper: Log subscription change
 */
export async function logSubscriptionChanged(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    actorUserId: Id<"users">;
    actorRole?: string;
    subscriptionId: Id<"subscriptions">;
    changes: any;
  }
): Promise<Id<"audit_logs">> {
  return await logAuditEvent(ctx, {
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "SUBSCRIPTION_CHANGED",
    targetType: "subscription",
    targetId: params.subscriptionId,
    metadata: { changes: params.changes },
  });
}

/**
 * Helper: Log organization creation
 */
export async function logOrgCreated(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    actorUserId: Id<"users">;
    orgName: string;
  }
): Promise<Id<"audit_logs">> {
  return await logAuditEvent(ctx, {
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "ORG_CREATED",
    targetType: "organization",
    targetId: params.orgId,
    metadata: { orgName: params.orgName },
  });
}

/**
 * Query audit logs for an organization
 */
export async function getAuditLogs(
  ctx: QueryCtx,
  params: {
    orgId?: Id<"organizations">;
    actorUserId?: Id<"users">;
    action?: string;
    limit?: number;
  }
) {
  let results;
  
  if (params.orgId) {
    results = await ctx.db
      .query("audit_logs")
      .withIndex("by_org", (q) => q.eq("orgId", params.orgId!))
      .order("desc")
      .take(params.limit ?? 100);
  } else if (params.actorUserId) {
    results = await ctx.db
      .query("audit_logs")
      .withIndex("by_actor", (q) => q.eq("actorUserId", params.actorUserId!))
      .order("desc")
      .take(params.limit ?? 100);
  } else {
    results = await ctx.db
      .query("audit_logs")
      .withIndex("by_created")
      .order("desc")
      .take(params.limit ?? 100);
  }

  // Filter by action if provided
  if (params.action) {
    results = results.filter((log) => log.action === params.action);
  }

  return results;
}
