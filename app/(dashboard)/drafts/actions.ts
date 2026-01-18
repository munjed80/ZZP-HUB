/**
 * Draft expense actions
 * 
 * Server actions for managing draft expenses with multi-tenant security.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, requireSession } from "@/lib/auth/tenant";
import { logAudit } from "@/lib/audit";
import { Prisma, BtwTarief, DraftStatus } from "@prisma/client";
import type { ExtractedDocumentData } from "@/lib/extraction/types";

/**
 * Get all drafts for the current user
 */
export async function getDrafts() {
  const { userId } = await requireTenantContext();
  
  const drafts = await prisma.expense.findMany({
    where: {
      userId,
      status: {
        in: ["DRAFT", "PENDING_REVIEW"],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  return drafts.map((draft) => ({
    id: draft.id,
    description: draft.description,
    category: draft.category,
    amountExcl: Number(draft.amountExcl),
    vatRate: draft.vatRate,
    date: draft.date.toISOString().split("T")[0],
    receiptUrl: draft.receiptUrl,
    status: draft.status,
    approvedBy: draft.approvedBy,
    approvedAt: draft.approvedAt?.toISOString() ?? null,
    createdAt: draft.createdAt.toISOString(),
  }));
}

/**
 * Create a draft expense from extracted data
 */
export async function createDraftFromExtraction(params: {
  extractedData: ExtractedDocumentData;
  assetId: string;
  storageUrl?: string;
}) {
  const { userId } = await requireTenantContext();
  const { extractedData, assetId, storageUrl } = params;
  
  // Determine category based on vendor name or default
  const category = extractedData.vendorName 
    ? "Overig" 
    : "Kantoorkosten";
  
  // Determine description
  const description = extractedData.vendorName
    ? `${extractedData.vendorName}${extractedData.invoiceNumber ? ` - ${extractedData.invoiceNumber}` : ""}`
    : "Ontvangstbewijs (scan)";
  
  // Determine VAT rate
  const vatRate = extractedData.vatRate || BtwTarief.HOOG_21;
  
  // Determine date
  const date = extractedData.date ? new Date(extractedData.date) : new Date();
  
  // Create draft expense
  const draft = await prisma.expense.create({
    data: {
      userId,
      category,
      description,
      amountExcl: new Prisma.Decimal(extractedData.totalAmount),
      vatRate,
      date,
      receiptUrl: storageUrl || null,
      status: DraftStatus.DRAFT,
    },
  });
  
  // Log creation
  await logAudit({
    userId,
    actorId: userId,
    entityType: "Expense",
    entityId: draft.id,
    action: "CREATE_DRAFT",
    afterJson: {
      assetId,
      extractedData,
    },
  });
  
  console.log("[DRAFT_CREATED]", {
    timestamp: new Date().toISOString(),
    userId: userId.slice(-6),
    draftId: draft.id,
    amount: extractedData.totalAmount,
  });
  
  revalidatePath("/drafts");
  
  return { success: true, draftId: draft.id };
}

/**
 * Update a draft expense
 */
export async function updateDraft(
  draftId: string,
  data: {
    description?: string;
    category?: string;
    amountExcl?: number;
    vatRate?: BtwTarief;
    date?: string;
  }
) {
  const { userId } = await requireTenantContext();
  
  // Get existing draft
  const existing = await prisma.expense.findFirst({
    where: { id: draftId, userId },
  });
  
  if (!existing) {
    throw new Error("Concept niet gevonden");
  }
  
  if (existing.status === DraftStatus.APPROVED) {
    throw new Error("Goedgekeurde uitgaven kunnen niet worden bewerkt");
  }
  
  // Update draft
  const updated = await prisma.expense.update({
    where: { id: draftId },
    data: {
      description: data.description,
      category: data.category,
      amountExcl: data.amountExcl ? new Prisma.Decimal(data.amountExcl) : undefined,
      vatRate: data.vatRate,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  
  // Log update
  await logAudit({
    userId,
    actorId: userId,
    entityType: "Expense",
    entityId: draftId,
    action: "UPDATE_DRAFT",
    beforeJson: {
      description: existing.description,
      category: existing.category,
      amountExcl: Number(existing.amountExcl),
      vatRate: existing.vatRate,
      date: existing.date.toISOString(),
    },
    afterJson: {
      description: updated.description,
      category: updated.category,
      amountExcl: Number(updated.amountExcl),
      vatRate: updated.vatRate,
      date: updated.date.toISOString(),
    },
  });
  
  revalidatePath("/drafts");
  
  return { success: true };
}

/**
 * Approve a draft expense
 */
export async function approveDraft(draftId: string) {
  const session = await requireSession();
  const userId = session.userId;
  
  // Get existing draft
  const existing = await prisma.expense.findFirst({
    where: { id: draftId, userId },
  });
  
  if (!existing) {
    throw new Error("Concept niet gevonden");
  }
  
  if (existing.status === DraftStatus.APPROVED) {
    throw new Error("Deze uitgave is al goedgekeurd");
  }
  
  // Update to approved
  const updated = await prisma.expense.update({
    where: { id: draftId },
    data: {
      status: DraftStatus.APPROVED,
      approvedBy: session.userId,
      approvedAt: new Date(),
    },
  });
  
  // Log approval
  await logAudit({
    userId,
    actorId: session.userId,
    entityType: "Expense",
    entityId: draftId,
    action: "APPROVE_DRAFT",
    beforeJson: { status: existing.status },
    afterJson: { status: updated.status, approvedBy: updated.approvedBy },
  });
  
  console.log("[DRAFT_APPROVED]", {
    timestamp: new Date().toISOString(),
    userId: userId.slice(-6),
    draftId,
    approvedBy: session.userId.slice(-6),
  });
  
  revalidatePath("/drafts");
  revalidatePath("/uitgaven");
  
  return { success: true };
}

/**
 * Reject a draft expense
 */
export async function rejectDraft(draftId: string, reason?: string) {
  const session = await requireSession();
  const userId = session.userId;
  
  // Get existing draft
  const existing = await prisma.expense.findFirst({
    where: { id: draftId, userId },
  });
  
  if (!existing) {
    throw new Error("Concept niet gevonden");
  }
  
  // Update to rejected
  await prisma.expense.update({
    where: { id: draftId },
    data: {
      status: DraftStatus.REJECTED,
    },
  });
  
  // Log rejection
  await logAudit({
    userId,
    actorId: session.userId,
    entityType: "Expense",
    entityId: draftId,
    action: "REJECT_DRAFT",
    beforeJson: { status: existing.status },
    afterJson: { status: "REJECTED", reason },
  });
  
  revalidatePath("/drafts");
  
  return { success: true };
}

/**
 * Delete a draft expense
 */
export async function deleteDraft(draftId: string) {
  const { userId } = await requireTenantContext();
  
  // Get existing draft
  const existing = await prisma.expense.findFirst({
    where: { id: draftId, userId },
  });
  
  if (!existing) {
    throw new Error("Concept niet gevonden");
  }
  
  if (existing.status === DraftStatus.APPROVED) {
    throw new Error("Goedgekeurde uitgaven kunnen niet worden verwijderd via concepten");
  }
  
  // Delete draft
  await prisma.expense.delete({
    where: { id: draftId },
  });
  
  // Log deletion
  await logAudit({
    userId,
    actorId: userId,
    entityType: "Expense",
    entityId: draftId,
    action: "DELETE_DRAFT",
    beforeJson: {
      description: existing.description,
      status: existing.status,
    },
    afterJson: null,
  });
  
  revalidatePath("/drafts");
  
  return { success: true };
}
