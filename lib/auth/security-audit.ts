/**
 * Security Audit Logging
 * 
 * Logs security-related events like invite acceptance, session creation,
 * access grants, and permission changes.
 */

import { prisma } from "@/lib/prisma";

export type SecurityEventType =
  | "INVITE_CREATED"
  | "INVITE_ACCEPTED"
  | "INVITE_REJECTED"
  | "ACCOUNTANT_SESSION_CREATED"
  | "ACCOUNTANT_SESSION_DELETED"
  | "COMPANY_ACCESS_GRANTED"
  | "COMPANY_ACCESS_REVOKED"
  | "DATA_EXPORTED"
  | "ACCOUNTANT_VIEW_COMPANY"
  | "ACCOUNTANT_EDIT_INVOICE"
  | "ACCOUNTANT_EDIT_EXPENSE"
  | "ACCOUNTANT_APPROVE_RECORD"
  | "ACCOUNTANT_MARK_REVIEWED"
  | "ACCOUNTANT_EXPORT_DATA"
  | "ACCOUNTANT_GENERATE_REPORT";

export interface SecurityAuditParams {
  userId: string;
  eventType: SecurityEventType;
  companyId?: string;
  targetUserId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a security event using the AI audit log table
 * (reusing existing infrastructure)
 */
export async function logSecurityEvent(params: SecurityAuditParams): Promise<void> {
  try {
    await prisma.aiActionAuditLog.create({
      data: {
        userId: params.userId,
        actionType: `SECURITY_${params.eventType}`,
        payloadHash: "",
        payloadJson: JSON.stringify({
          companyId: params.companyId,
          targetUserId: params.targetUserId,
          targetEmail: params.targetEmail,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        }),
        success: true,
        status: "completed",
      },
    });

    // Log to console for monitoring
    if (process.env.NODE_ENV !== "production" || process.env.SECURITY_DEBUG === "true") {
      console.log("[SECURITY_AUDIT]", {
        timestamp: new Date().toISOString(),
        userId: params.userId.slice(-6),
        eventType: params.eventType,
        companyId: params.companyId?.slice(-6),
        targetEmail: params.targetEmail,
      });
    }
  } catch (error) {
    // Log errors but don't fail the operation
    console.error("[SECURITY_AUDIT_ERROR] Failed to log security event:", error);
  }
}

/**
 * Log invite creation
 */
export async function logInviteCreated(params: {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "INVITE_CREATED",
    companyId: params.companyId,
    targetEmail: params.email,
    metadata: { role: params.role },
  });
}

/**
 * Log invite acceptance
 */
export async function logInviteAccepted(params: {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  isNewUser: boolean;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "INVITE_ACCEPTED",
    companyId: params.companyId,
    targetEmail: params.email,
    metadata: {
      role: params.role,
      isNewUser: params.isNewUser,
    },
  });
}

/**
 * Log accountant session creation
 */
export async function logAccountantSessionCreated(params: {
  userId: string;
  email: string;
  companyId: string;
  role: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_SESSION_CREATED",
    companyId: params.companyId,
    targetEmail: params.email,
    metadata: { role: params.role },
  });
}

/**
 * Log data export
 */
export async function logDataExport(params: {
  userId: string;
  companyId: string;
  exportType: string;
  recordCount?: number;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "DATA_EXPORTED",
    companyId: params.companyId,
    metadata: {
      exportType: params.exportType,
      recordCount: params.recordCount,
    },
  });
}

/**
 * Log company access granted
 */
export async function logCompanyAccessGranted(params: {
  userId: string;
  targetUserId: string;
  companyId: string;
  role: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "COMPANY_ACCESS_GRANTED",
    companyId: params.companyId,
    targetUserId: params.targetUserId,
    metadata: { role: params.role },
  });
}

/**
 * Log company access revoked
 */
export async function logCompanyAccessRevoked(params: {
  userId: string;
  targetUserId: string;
  companyId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "COMPANY_ACCESS_REVOKED",
    companyId: params.companyId,
    targetUserId: params.targetUserId,
  });
}

/**
 * Log accountant viewing company data
 */
export async function logAccountantViewCompany(params: {
  userId: string;
  companyId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_VIEW_COMPANY",
    companyId: params.companyId,
  });
}

/**
 * Log accountant editing invoice
 */
export async function logAccountantEditInvoice(params: {
  userId: string;
  companyId: string;
  invoiceId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_EDIT_INVOICE",
    companyId: params.companyId,
    metadata: { invoiceId: params.invoiceId },
  });
}

/**
 * Log accountant editing expense
 */
export async function logAccountantEditExpense(params: {
  userId: string;
  companyId: string;
  expenseId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_EDIT_EXPENSE",
    companyId: params.companyId,
    metadata: { expenseId: params.expenseId },
  });
}

/**
 * Log accountant approving a record
 */
export async function logAccountantApproveRecord(params: {
  userId: string;
  companyId: string;
  recordType: string;
  recordId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_APPROVE_RECORD",
    companyId: params.companyId,
    metadata: {
      recordType: params.recordType,
      recordId: params.recordId,
    },
  });
}

/**
 * Log accountant marking something as reviewed
 */
export async function logAccountantMarkReviewed(params: {
  userId: string;
  companyId: string;
  itemType: string;
  itemId: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_MARK_REVIEWED",
    companyId: params.companyId,
    metadata: {
      itemType: params.itemType,
      itemId: params.itemId,
    },
  });
}

/**
 * Log accountant exporting data
 */
export async function logAccountantExportData(params: {
  userId: string;
  companyId: string;
  exportType: string;
  recordCount?: number;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_EXPORT_DATA",
    companyId: params.companyId,
    metadata: {
      exportType: params.exportType,
      recordCount: params.recordCount,
    },
  });
}

/**
 * Log accountant generating a report
 */
export async function logAccountantGenerateReport(params: {
  userId: string;
  companyId: string;
  reportType: string;
}): Promise<void> {
  await logSecurityEvent({
    userId: params.userId,
    eventType: "ACCOUNTANT_GENERATE_REPORT",
    companyId: params.companyId,
    metadata: { reportType: params.reportType },
  });
}
