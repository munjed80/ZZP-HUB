"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { expenseSchema, type ExpenseClientShape, type ExpenseFormValues } from "./schema";
import { Prisma } from "@prisma/client";

const DEMO_USER = {
  email: "demo@zzp-hub.nl",
  passwordHash: "demo-placeholder-hash",
  naam: "Demo gebruiker",
};

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      ...DEMO_USER,
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
      category: expense.category as ExpenseClientShape["category"],
      amountExcl: Number(expense.amountExcl),
      vatRate: expense.vatRate,
      date: expense.date.toISOString().split("T")[0],
      receiptUrl: expense.receiptUrl ?? null,
    }));
  } catch (error) {
    console.error("Kon uitgaven niet ophalen", error);
    throw new Error("Uitgaven konden niet worden opgehaald. Controleer de databaseverbinding en probeer opnieuw.");
  }
}

export async function createExpense(values: ExpenseFormValues) {
  const userId = getCurrentUserId();
  const data = expenseSchema.parse(values);

  try {
    await ensureUser(userId);

    const trimmedUrl = data.receiptUrl?.trim() || null;

    await prisma.expense.create({
      data: {
        userId,
        description: data.description,
        category: data.category,
        amountExcl: new Prisma.Decimal(data.amountExcl),
        vatRate: data.vatRate,
        date: new Date(data.date),
        receiptUrl: trimmedUrl,
      },
    });

    revalidatePath("/uitgaven");
  } catch (error) {
    console.error("Uitgave opslaan mislukt", error);
    throw new Error("Uitgave opslaan mislukt. Controleer je invoer en probeer het later opnieuw.");
  }
}
