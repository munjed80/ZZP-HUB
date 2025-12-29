import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClients } from "../../../relaties/actions";
import { fetchCompanyProfile } from "../../../instellingen/actions";
import { InvoiceForm } from "../../nieuw/invoice-form";
import type { InvoiceFormValues } from "../../schema";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getInvoice(id: string) {
  const userId = getCurrentUserId();

  return prisma.invoice.findFirst({
    where: { id, userId },
    include: { lines: true, client: true },
  });
}

export default async function FactuurBewerkenPagina({ params }: PageProps) {
  const { id } = await params;
  const [invoice, clients, profile] = await Promise.all([getInvoice(id), getClients(), fetchCompanyProfile()]);

  if (!invoice) {
    notFound();
  }

  const initialInvoice: InvoiceFormValues = {
    clientId: invoice.clientId,
    invoiceNum: invoice.invoiceNum,
    date: invoice.date.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vat: line.vatRate === "HOOG_21" ? "21" : line.vatRate === "LAAG_9" ? "9" : "0",
    })),
  };

  return (
    <InvoiceForm
      clients={clients}
      mode="edit"
      invoiceId={invoice.id}
      initialInvoice={initialInvoice}
      initialClientName={invoice.client.name}
      korEnabled={profile?.korEnabled ?? false}
    />
  );
}
