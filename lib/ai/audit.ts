import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Log an AI action to the audit table
 */
export async function logAIAction(params: {
  userId: string;
  actionType: string;
  payload: unknown;
  resultId?: string;
  resultType?: string;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    // Hash the payload for privacy (don't store full details)
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(params.payload))
      .digest("hex");

    await prisma.aiActionAuditLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        payloadHash,
        resultId: params.resultId,
        resultType: params.resultType,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    });
  } catch (error) {
    // Log errors but don't fail the action
    console.error("Failed to log AI action:", error);
  }
}
