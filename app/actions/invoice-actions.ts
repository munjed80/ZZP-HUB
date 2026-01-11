"use server";

import { revalidatePath } from "next/cache";
import { InvoiceEmailStatus } from "@prisma/client";
import { tenantPrisma } from "@/lib/prismaTenant";
import { requireUser } from "@/lib/auth";

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

    await requireUser();

    // Use tenant-safe update - will automatically verify ownership
    await tenantPrisma.invoice.update({
      where: { id: sanitizedInvoiceId },
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

    await requireUser();

    // Use tenant-safe update - will automatically verify ownership
    await tenantPrisma.invoice.update({
      where: { id: sanitizedInvoiceId },
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

    await requireUser();

    // Use tenant-safe delete - will automatically verify ownership
    await tenantPrisma.invoice.delete({
      where: { id: sanitizedInvoiceId },
    });

    revalidatePath("/facturen");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Factuur verwijderen mislukt", { error, invoiceId });
    return { success: false, message: "Verwijderen mislukt." };
  }
}
