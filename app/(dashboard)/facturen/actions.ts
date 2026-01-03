"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
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

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
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

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const data = invoiceSchema.parse(values);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.updateMany({
      where: { id: invoiceId, userId },
      data: {
        clientId: data.clientId,
        invoiceNum: data.invoiceNum,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
      },
    });

    await tx.invoiceLine.deleteMany({ where: { invoiceId } });

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
