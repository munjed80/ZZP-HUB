import { prisma } from "@/lib/prisma";
import { BtwTarief, Prisma } from "@prisma/client";
import type { ExpenseDraft } from "../schemas/drafts";

interface ToolContext {
  userId: string;
}

/**
 * Create an expense via AI
 */
export async function toolCreateExpenseDraft(
  draft: ExpenseDraft,
  context: ToolContext
) {
  const { userId } = context;

  // Map VAT rate
  const vatRateMap: Record<string, BtwTarief> = {
    "21": BtwTarief.HOOG_21,
    "9": BtwTarief.LAAG_9,
    "0": BtwTarief.NUL_0,
  };

  // Calculate amount excluding VAT if not provided
  const vatRate = draft.vatRate || "21";
  const vatMultiplier = parseInt(vatRate) / 100;
  const amountExcl = draft.amountExcl || draft.amount / (1 + vatMultiplier);

  // Create expense
  const expense = await prisma.expense.create({
    data: {
      userId,
      category: draft.category,
      description: draft.description || `${draft.vendor || draft.category}`,
      amountExcl: new Prisma.Decimal(amountExcl),
      vatRate: vatRateMap[vatRate],
      date: draft.date ? new Date(draft.date) : new Date(),
      receiptUrl: draft.receiptUrl,
    },
  });

  const vatAmount = amountExcl * vatMultiplier;
  const totalAmount = amountExcl + vatAmount;

  return {
    success: true,
    expense: {
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amountExcl: expense.amountExcl.toNumber(),
      vatRate: expense.vatRate,
      vatAmount,
      totalAmount,
      date: expense.date.toISOString(),
    },
    message: `Uitgave van €${totalAmount.toFixed(2)} aangemaakt voor ${expense.category}.`,
  };
}

/**
 * List expenses with filters
 */
export async function toolListExpenses(
  filters: {
    category?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  },
  context: ToolContext
) {
  const { userId } = context;

  const where: {
    userId: string;
    category?: { contains: string; mode: Prisma.QueryMode };
    date?: { gte?: Date; lte?: Date };
  } = {
    userId,
  };

  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: "insensitive",
    };
  }

  if (filters.fromDate || filters.toDate) {
    where.date = {};
    if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
    if (filters.toDate) where.date.lte = new Date(filters.toDate);
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: filters.limit || 10,
  });

  const total = expenses.reduce((sum, exp) => {
    const excl = exp.amountExcl.toNumber();
    const vatRate = exp.vatRate === BtwTarief.HOOG_21 ? 0.21 :
                    exp.vatRate === BtwTarief.LAAG_9 ? 0.09 : 0;
    return sum + excl * (1 + vatRate);
  }, 0);

  return {
    success: true,
    expenses: expenses.map((exp) => {
      const excl = exp.amountExcl.toNumber();
      const vatRate = exp.vatRate === BtwTarief.HOOG_21 ? 0.21 :
                      exp.vatRate === BtwTarief.LAAG_9 ? 0.09 : 0;
      return {
        id: exp.id,
        category: exp.category,
        description: exp.description,
        amountExcl: excl,
        vatAmount: excl * vatRate,
        totalAmount: excl * (1 + vatRate),
        date: exp.date.toISOString(),
      };
    }),
    count: expenses.length,
    total,
    summary: `${expenses.length} uitgaven gevonden, totaal €${total.toFixed(2)}`,
  };
}
