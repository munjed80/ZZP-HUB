"use server";

import { revalidatePath } from "next/cache";
import { InvoiceEmailStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext } from "@/lib/auth/company-context";

type PdfGeneratorModule = typeof import("@/lib/pdf-generator");
type SendInvoiceModule = typeof import("./send-invoice");

let sendInvoiceModulePromise: Promise<SendInvoiceModule> | null = null;
let pdfGeneratorModulePromise: Promise<PdfGeneratorModule> | null = null;

async function getSendInvoiceModule() {
  if (!sendInvoiceModulePromise) {
    sendInvoiceModulePromise = import("./send-invoice");
  }
  return sendInvoiceModulePromise;
}

async function getPdfGeneratorModule() {
  if (!pdfGeneratorModulePromise) {
    pdfGeneratorModulePromise = import("@/lib/pdf-generator");
  }
  return pdfGeneratorModulePromise;
}

export async function sendInvoiceEmail(invoiceId: string) {
  const { sendInvoiceEmail: originalAction } = await getSendInvoiceModule();
  return originalAction(invoiceId);
}

export async function generateInvoicePdf(...args: Parameters<PdfGeneratorModule["generateInvoicePdf"]>) {
  const { generateInvoicePdf: originalAction } = await getPdfGeneratorModule();
  return originalAction(...args);
}

export async function mapInvoiceToPdfData(...args: Parameters<PdfGeneratorModule["mapInvoiceToPdfData"]>) {
  const { mapInvoiceToPdfData: originalAction } = await getPdfGeneratorModule();
  return originalAction(...args);
}

export async function markAsPaid(invoiceId: string) {
  try {
    const sanitizedInvoiceId = invoiceId.trim();
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(sanitizedInvoiceId)) {
      return { success: false, message: "Ongeldig factuurnummer." };
    }

    // Use active company context for accountant support
    const context = await getActiveCompanyContext();
    const userId = context.activeCompanyId;
    
    // Check edit permission for accountants
    if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
      return { success: false, message: "Geen toestemming om factuurstatus te wijzigen." };
    }
    
    const invoice = await prisma.invoice.findFirst({
      where: { id: sanitizedInvoiceId, userId },
    });

    if (!invoice) {
      return { success: false, message: "Factuur niet gevonden." };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { emailStatus: InvoiceEmailStatus.BETAALD },
    });

    revalidatePath("/facturen");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Markeren als betaald mislukt", { error, invoiceId });
    return { success: false, message: "Het markeren als betaald is mislukt." };
  }
}

export async function markAsUnpaid(invoiceId: string) {
  try {
    const sanitizedInvoiceId = invoiceId.trim();
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(sanitizedInvoiceId)) {
      return { success: false, message: "Ongeldig factuurnummer." };
    }

    // Use active company context for accountant support
    const context = await getActiveCompanyContext();
    const userId = context.activeCompanyId;
    
    // Check edit permission for accountants
    if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
      return { success: false, message: "Geen toestemming om factuurstatus te wijzigen." };
    }
    
    const invoice = await prisma.invoice.findFirst({
      where: { id: sanitizedInvoiceId, userId },
    });

    if (!invoice) {
      return { success: false, message: "Factuur niet gevonden." };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { emailStatus: InvoiceEmailStatus.VERZONDEN },
    });

    revalidatePath("/facturen");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Markeren als onbetaald mislukt", { error, invoiceId });
    return { success: false, message: "Ongedaan maken mislukt." };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const sanitizedInvoiceId = invoiceId.trim();
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(sanitizedInvoiceId)) {
      return { success: false, message: "Ongeldig factuurnummer." };
    }

    // Use active company context for accountant support
    const context = await getActiveCompanyContext();
    const userId = context.activeCompanyId;
    
    // Check edit permission for accountants
    if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
      return { success: false, message: "Geen toestemming om facturen te verwijderen." };
    }
    
    const invoice = await prisma.invoice.findFirst({
      where: { id: sanitizedInvoiceId, userId },
    });

    if (!invoice) {
      return { success: false, message: "Factuur niet gevonden." };
    }

    await prisma.invoice.delete({ where: { id: invoice.id } });

    revalidatePath("/facturen");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Factuur verwijderen mislukt", { error, invoiceId });
    return { success: false, message: "Verwijderen mislukt." };
  }
}
