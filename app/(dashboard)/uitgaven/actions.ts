"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { expenseSchema, type ExpenseFormValues } from "./schema";
import { Prisma, type BtwTarief } from "@prisma/client";

type ExpenseClientShape = {
  id: string;
  description: string;
  category: string;
  amountExcl: number;
  vatRate: BtwTarief;
  date: string;
  receiptUrl: string | null;
};

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

export async function getExpenses(): Promise<ExpenseClientShape[]> {
  const userId = getCurrentUserId();

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    });

    return expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amountExcl: Number(expense.amountExcl),
      vatRate: expense.vatRate,
      date: expense.date.toISOString(),
      receiptUrl: expense.receiptUrl ?? null,
    }));
  } catch (error) {
    console.error("Kon uitgaven niet ophalen", error);
    return [];
  }
}

export async function createExpense(values: ExpenseFormValues) {
  "use server";

  const userId = getCurrentUserId();
  const data = expenseSchema.parse(values);

  await ensureUser(userId);

  await prisma.expense.create({
    data: {
      userId,
      description: data.description,
      category: data.category,
      amountExcl: new Prisma.Decimal(data.amountExcl),
      vatRate: data.vatRate,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl?.trim() ? data.receiptUrl.trim() : null,
    },
  });

  revalidatePath("/uitgaven");
}

export type { ExpenseClientShape };
