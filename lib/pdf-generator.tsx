import { renderToBuffer } from "@react-pdf/renderer";
import { BtwTarief, Prisma } from "@prisma/client";
import { InvoiceTemplate as InvoicePDF, type InvoiceTemplateData } from "@/lib/invoice-template";

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { client: true; lines: true; user: { include: { companyProfile: true } } };
}>;

function mapVatRate(rate: BtwTarief): "21" | "9" | "0" {
  if (rate === BtwTarief.HOOG_21) return "21";
  if (rate === BtwTarief.LAAG_9) return "9";
  return "0";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("nl-NL");
}

export function mapInvoiceToPdfData(invoice: InvoiceWithRelations): InvoiceTemplateData {
  return {
    invoiceNum: invoice.invoiceNum,
    date: formatDate(invoice.date),
    dueDate: formatDate(invoice.dueDate),
    client: {
      name: invoice.client.name,
      address: invoice.client.address,
      postalCode: invoice.client.postalCode,
      city: invoice.client.city,
    },
    companyProfile: invoice.user.companyProfile
      ? {
          companyName: invoice.user.companyProfile.companyName,
          address: invoice.user.companyProfile.address,
          postalCode: invoice.user.companyProfile.postalCode,
          city: invoice.user.companyProfile.city,
          kvkNumber: invoice.user.companyProfile.kvkNumber,
          iban: invoice.user.companyProfile.iban,
          logoUrl: invoice.user.companyProfile.logoUrl,
        }
      : null,
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vatRate: mapVatRate(line.vatRate),
    })),
  };
}

export async function generateInvoicePdf(invoice: InvoiceTemplateData) {
  return renderToBuffer(<InvoicePDF invoice={invoice} />);
}
