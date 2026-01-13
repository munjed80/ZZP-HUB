import { prisma } from "@/lib/prisma";
import { BtwTarief, Eenheid, Prisma } from "@prisma/client";
import type { CreateOfferteAction } from "../schemas/actions";

interface ToolContext {
  userId: string;
}

/**
 * Create a quotation/offerte draft via AI
 */
export async function toolCreateOfferteDraft(
  action: CreateOfferteAction,
  context: ToolContext
) {
  const { userId } = context;

  // Find client
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

  // Generate quotation number
  const lastQuote = await prisma.quotation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { quoteNum: true },
  });

  const year = new Date().getFullYear();
  const nextNum = lastQuote 
    ? parseInt(lastQuote.quoteNum.split("-").pop() || "0") + 1
    : 1;
  const quoteNum = `OFF-${year}-${String(nextNum).padStart(3, "0")}`;

  const quoteDate = action.date ? new Date(action.date) : new Date();
  const validUntil = new Date(quoteDate);
  validUntil.setDate(validUntil.getDate() + action.validForDays);

  // Build lines
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
      message: "Please provide either items or an amount for the quotation.",
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

  const quotation = await prisma.$transaction(async (tx) => {
    const created = await tx.quotation.create({
      data: {
        userId,
        clientId: client.id,
        quoteNum,
        date: quoteDate,
        validUntil,
        status: "CONCEPT",
      },
      include: {
        client: true,
      },
    });

    await tx.quotationLine.createMany({
      data: lines.map((line) => ({
        quotationId: created.id,
        description: line.description,
        quantity: new Prisma.Decimal(line.quantity),
        price: new Prisma.Decimal(line.price),
        amount: new Prisma.Decimal(line.quantity * line.price),
        vatRate: vatRateMap[line.vatRate] || BtwTarief.HOOG_21,
        unit: unitMap[line.unit] || Eenheid.STUK,
      })),
    });

    return tx.quotation.findUnique({
      where: { id: created.id },
      include: {
        client: true,
        lines: true,
      },
    });
  });

  const total = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
  const vatAmount = lines.reduce((sum, line) => {
    const lineTotal = line.quantity * line.price;
    const rate = parseInt(line.vatRate) / 100;
    return sum + lineTotal * rate;
  }, 0);

  return {
    success: true,
    quotation: {
      id: quotation!.id,
      quoteNum: quotation!.quoteNum,
      clientName: quotation!.client.name,
      date: quotation!.date.toISOString(),
      validUntil: quotation!.validUntil.toISOString(),
      lines: quotation!.lines.map((l) => ({
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
    message: `Draft quotation ${quoteNum} created for ${client.name}. Total: €${(total + vatAmount).toFixed(2)}`,
  };
}
