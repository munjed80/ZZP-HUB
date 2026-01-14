import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate a unique request ID for observability
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * Log an AI action to the audit table with enhanced observability
 */
export async function logAIAction(params: {
  userId: string;
  actionType: string;
  payload: unknown;
  requestId?: string;
  resultId?: string;
  resultType?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    // Hash the payload for privacy
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(params.payload))
      .digest("hex");

    // Store minimal payload info for debugging (optional, can be disabled in prod)
    const payloadJson = process.env.AI_STORE_PAYLOAD === "true" 
      ? JSON.stringify(params.payload) 
      : undefined;

    await prisma.aiActionAuditLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        payloadHash,
        payloadJson,
        requestId: params.requestId,
        resultId: params.resultId,
        resultType: params.resultType,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    });

    // Log to console for observability
    if (process.env.NODE_ENV !== "production" || process.env.AI_DEBUG === "true") {
      console.log("[AI_AUDIT]", {
        requestId: params.requestId,
        userId: params.userId.slice(-6),
        actionType: params.actionType,
        status: params.status,
        success: params.success,
      });
    }
  } catch (error) {
    // Log errors but don't fail the action
    console.error("[AI_AUDIT_ERROR] Failed to log AI action:", error);
  }
}

/**
 * Log a specific AI step for detailed observability
 */
export function logAIStep(params: {
  requestId: string;
  step: "intent_detected" | "draft_updated" | "validation_failed" | "create_started" | "create_success" | "create_failed";
  details?: Record<string, unknown>;
}): void {
  if (process.env.NODE_ENV !== "production" || process.env.AI_DEBUG === "true") {
    console.log("[AI_STEP]", {
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
      step: params.step,
      ...params.details,
    });
  }
}
