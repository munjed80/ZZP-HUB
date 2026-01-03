"use server";

type InvoiceActionsModule = typeof import("@/app/actions/invoice-actions");

export async function sendInvoiceEmail(...args: Parameters<InvoiceActionsModule["sendInvoiceEmail"]>) {
  const { sendInvoiceEmail: originalAction } = await import("@/app/actions/invoice-actions");
  return originalAction(...args);
}
