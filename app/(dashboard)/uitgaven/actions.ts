"use server";

import { revalidatePath } from "next/cache";
import { tenantPrisma } from "@/lib/prismaTenant";
import { getCurrentUserId } from "@/lib/auth";
import { expenseSchema, type ExpenseClientShape, type ExpenseFormValues } from "./schema";
import { Prisma } from "@prisma/client";

export async function getExpenses(): Promise<ExpenseClientShape[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

  try {
    const expenses = await tenantPrisma.expense.findMany({
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
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const data = expenseSchema.parse(values);

  try {
    const trimmedUrl = data.receiptUrl?.trim() || null;

    await tenantPrisma.expense.create({
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

export async function deleteExpense(expenseId: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

  try {
    await tenantPrisma.expense.delete({
      where: { id: expenseId },
    });
    
    revalidatePath("/uitgaven");
    return { success: true };
  } catch (error) {
    console.error("DELETE_EXPENSE_FAILED", { error, expenseId, userId });
    return { success: false, message: "Verwijderen mislukt." };
  }
}

export async function duplicateExpense(expenseId: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

  try {
    const expense = await tenantPrisma.expense.findUnique({
      where: { id: expenseId },
    });
    
    if (!expense) {
      return { success: false, message: "Uitgave niet gevonden." };
    }

    await tenantPrisma.expense.create({
      data: {
        userId,
        description: `${expense.description} (kopie)`,
        category: expense.category,
        amountExcl: expense.amountExcl,
        vatRate: expense.vatRate,
        date: expense.date,
        receiptUrl: expense.receiptUrl,
      },
    });
    revalidatePath("/uitgaven");
    return { success: true };
  } catch (error) {
    console.error("DUPLICATE_EXPENSE_FAILED", { error, expenseId, userId });
    return { success: false, message: "Dupliceren mislukt." };
  }
}
