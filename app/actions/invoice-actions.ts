"use server";

import { revalidatePath } from "next/cache";
import { InvoiceEmailStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

    const { id: userId, role } = await requireUser();
    const invoice = await prisma.invoice.findFirst({
      where: role === UserRole.SUPERADMIN ? { id: sanitizedInvoiceId } : { id: sanitizedInvoiceId, userId },
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

    const { id: userId, role } = await requireUser();
    const invoice = await prisma.invoice.findFirst({
      where: role === UserRole.SUPERADMIN ? { id: sanitizedInvoiceId } : { id: sanitizedInvoiceId, userId },
    });

    if (!invoice) {
      return { success: false, message: "Factuur niet gevonden." };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { emailStatus: InvoiceEmailStatus.CONCEPT },
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

    const { id: userId, role } = await requireUser();
    const invoice = await prisma.invoice.findFirst({
      where: role === UserRole.SUPERADMIN ? { id: sanitizedInvoiceId } : { id: sanitizedInvoiceId, userId },
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
