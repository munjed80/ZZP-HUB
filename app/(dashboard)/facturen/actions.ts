"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext } from "@/lib/auth/company-context";
import { invoiceSchema, type InvoiceFormValues, type InvoiceLineValues } from "./schema";
import { BtwTarief, Eenheid, Prisma } from "@prisma/client";

function mapVatRate(vat: InvoiceLineValues["vat"]) {
  const mapping: Record<InvoiceLineValues["vat"], BtwTarief> = {
    "21": BtwTarief.HOOG_21,
    "9": BtwTarief.LAAG_9,
    "0": BtwTarief.NUL_0,
  };

  return mapping[vat];
}

function mapUnit(unit: InvoiceLineValues["unit"]) {
  const mapping: Record<InvoiceLineValues["unit"], Eenheid> = {
    UUR: Eenheid.UUR,
    STUK: Eenheid.STUK,
    PROJECT: Eenheid.PROJECT,
    LICENTIE: Eenheid.LICENTIE,
    KM: Eenheid.KM,
    STOP: Eenheid.STOP,
  };

  return mapping[unit];
}

export async function createInvoice(values: InvoiceFormValues) {
  "use server";

  // For creating invoices, check if user has edit permission
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;
  
  // Check edit permission for accountants
  if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
    throw new Error("Geen toestemming om facturen aan te maken.");
  }
  
  const data = invoiceSchema.parse(values);

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        userId,
        clientId: data.clientId,
        invoiceNum: data.invoiceNum,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
      },
    });

    await tx.invoiceLine.createMany({
      data: data.lines.map((line) => ({
        invoiceId: createdInvoice.id,
        description: line.description,
        quantity: new Prisma.Decimal(line.quantity),
        price: new Prisma.Decimal(line.price),
        amount: new Prisma.Decimal(line.quantity * line.price),
        vatRate: mapVatRate(line.vat),
        unit: mapUnit(line.unit),
      })),
    });

    return createdInvoice;
  });

  revalidatePath("/facturen");
  revalidatePath("/facturen/nieuw");
  return invoice;
}

export async function updateInvoice(invoiceId: string, values: InvoiceFormValues) {
  "use server";

  // For updating invoices, check if user has edit permission
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;
  
  // Check edit permission for accountants
  if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
    throw new Error("Geen toestemming om facturen te bewerken.");
  }
  
  const data = invoiceSchema.parse(values);

  await prisma.$transaction(async (tx) => {
    // Verify ownership before update
    const updated = await tx.invoice.updateMany({
      where: { id: invoiceId, userId },
      data: {
        clientId: data.clientId,
        invoiceNum: data.invoiceNum,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
      },
    });
    
    if (updated.count === 0) {
      throw new Error("Factuur niet gevonden of geen toegang.");
    }

    // Delete lines - scoped by parent invoice ownership
    await tx.invoiceLine.deleteMany({ 
      where: { 
        invoiceId,
        invoice: { userId }
      } 
    });

    await tx.invoiceLine.createMany({
      data: data.lines.map((line) => ({
        invoiceId,
        description: line.description,
        quantity: new Prisma.Decimal(line.quantity),
        price: new Prisma.Decimal(line.price),
        amount: new Prisma.Decimal(line.quantity * line.price),
        vatRate: mapVatRate(line.vat),
        unit: mapUnit(line.unit),
      })),
    });
  });

  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
  revalidatePath(`/facturen/${invoiceId}/edit`);

  return { success: true };
}
