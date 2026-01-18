/**
 * Audit logging utilities
 * 
 * Records all changes to expenses and drafts for compliance and debugging.
 */

import "server-only";
import { prisma } from "./prisma";

/**
 * Log an action to the audit trail
 */
export async function logAudit(params: {
  userId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: object | null;
  afterJson?: object | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        beforeJson: params.beforeJson ? JSON.stringify(params.beforeJson) : null,
        afterJson: params.afterJson ? JSON.stringify(params.afterJson) : null,
      },
    });
    
    console.log("[AUDIT_LOG]", {
      timestamp: new Date().toISOString(),
      userId: params.userId.slice(-6),
      actorId: params.actorId.slice(-6),
      entityType: params.entityType,
      action: params.action,
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error("[AUDIT_LOG_ERROR]", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      params,
    });
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(params: {
  userId: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  const { userId, entityType, entityId, limit = 50 } = params;
  
  const where: {
    userId: string;
    entityType?: string;
    entityId?: string;
  } = { userId };
  
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
