import { prisma } from "@/lib/prisma";
import { BtwTarief, Eenheid, Prisma } from "@prisma/client";
import type { CreateInvoiceAction } from "../schemas/actions";

interface ToolContext {
  userId: string;
}

/**
 * Create an invoice draft via AI
 * Returns the invoice ID and details for preview
 */
export async function toolCreateInvoiceDraft(
  action: CreateInvoiceAction,
  context: ToolContext
) {
  const { userId } = context;

  // Find or suggest client
  const client = await prisma.client.findFirst({
    where: {
      userId,
      name: {
        contains: action.clientName,
        mode: "insensitive",
      },
    },
  });

  if (!client) {
    return {
      success: false,
      needsClientCreation: true,
      message: `Client "${action.clientName}" not found. Would you like to create this client first?`,
    };
  }

  // Generate invoice number (simple sequential)
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { invoiceNum: true },
  });

  const year = new Date().getFullYear();
  const nextNum = lastInvoice 
    ? parseInt(lastInvoice.invoiceNum.split("-").pop() || "0") + 1
    : 1;
  const invoiceNum = `${year}-${String(nextNum).padStart(3, "0")}`;

  // Prepare invoice data
  const invoiceDate = action.date ? new Date(action.date) : new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + action.dueInDays);

  // Build lines from items or single amount
  const lines = action.items || (action.amount ? [{
    description: action.description || "Dienstverlening",
    quantity: 1,
    price: action.amount,
    unit: "STUK" as const,
    vatRate: action.vatRate,
  }] : []);

  if (lines.length === 0) {
    return {
      success: false,
      needsMoreInfo: true,
      message: "Please provide either items or an amount for the invoice.",
    };
  }

  const vatRateMap: Record<string, BtwTarief> = {
    "21": BtwTarief.HOOG_21,
    "9": BtwTarief.LAAG_9,
    "0": BtwTarief.NUL_0,
  };

  const unitMap: Record<string, Eenheid> = {
    UUR: Eenheid.UUR,
    STUK: Eenheid.STUK,
    PROJECT: Eenheid.PROJECT,
    KM: Eenheid.KM,
    LICENTIE: Eenheid.LICENTIE,
    STOP: Eenheid.STOP,
  };

  // Create invoice in transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        userId,
        clientId: client.id,
        invoiceNum,
        date: invoiceDate,
        dueDate,
        emailStatus: "CONCEPT",
      },
      include: {
        client: true,
      },
    });

    await tx.invoiceLine.createMany({
      data: lines.map((line) => ({
        invoiceId: created.id,
        description: line.description,
        quantity: new Prisma.Decimal(line.quantity),
        price: new Prisma.Decimal(line.price),
        amount: new Prisma.Decimal(line.quantity * line.price),
        vatRate: vatRateMap[line.vatRate] || BtwTarief.HOOG_21,
        unit: unitMap[line.unit] || Eenheid.STUK,
      })),
    });

    return tx.invoice.findUnique({
      where: { id: created.id },
      include: {
        client: true,
        lines: true,
      },
    });
  });

  // Calculate totals
  const total = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
  const vatAmount = lines.reduce((sum, line) => {
    const lineTotal = line.quantity * line.price;
    const rate = parseInt(line.vatRate) / 100;
    return sum + lineTotal * rate;
  }, 0);

  return {
    success: true,
    invoice: {
      id: invoice!.id,
      invoiceNum: invoice!.invoiceNum,
      clientName: invoice!.client.name,
      date: invoice!.date.toISOString(),
      dueDate: invoice!.dueDate.toISOString(),
      lines: invoice!.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity.toNumber(),
        price: l.price.toNumber(),
        amount: l.amount.toNumber(),
        unit: l.unit,
        vatRate: l.vatRate,
      })),
      total,
      vatAmount,
      totalWithVat: total + vatAmount,
    },
    message: `Draft invoice ${invoiceNum} created for ${client.name}. Total: €${(total + vatAmount).toFixed(2)}`,
  };
}

/**
 * Finalize an invoice (mark as sent)
 */
export async function toolCreateInvoiceFinal(
  invoiceId: string,
  context: ToolContext
) {
  const { userId } = context;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    return {
      success: false,
      message: "Invoice not found or access denied.",
    };
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { emailStatus: "VERZONDEN" },
    include: {
      client: true,
      lines: true,
    },
  });

  return {
    success: true,
    invoice: updated,
    message: `Invoice ${updated.invoiceNum} marked as sent.`,
  };
}
