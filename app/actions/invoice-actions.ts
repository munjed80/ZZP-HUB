"use server";

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
