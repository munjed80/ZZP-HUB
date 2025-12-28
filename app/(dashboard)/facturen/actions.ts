"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { invoiceSchema, type InvoiceFormValues, type InvoiceLineValues } from "./schema";
import { BtwTarief, Eenheid, Prisma } from "@prisma/client";

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "demo@zzp-hub.nl",
      passwordHash: "demo-placeholder-hash",
      naam: "Demo gebruiker",
    },
  });
}

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
    KM: Eenheid.KM,
  };

  return mapping[unit];
}

export async function createInvoice(values: InvoiceFormValues) {
  "use server";

  const userId = getCurrentUserId();
  const data = invoiceSchema.parse(values);

  await ensureUser(userId);

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
