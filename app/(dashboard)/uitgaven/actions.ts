"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext } from "@/lib/auth/company-context";
import { expenseSchema, type ExpenseClientShape, type ExpenseFormValues } from "./schema";
import { Prisma } from "@prisma/client";

export async function getExpenses(): Promise<ExpenseClientShape[]> {
  // Use active company context for accountant support
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;

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
  // For creating expenses, check if user has edit permission
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;
  
  // Check edit permission for accountants
  if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
    throw new Error("Geen toestemming om uitgaven aan te maken.");
  }
  
  const data = expenseSchema.parse(values);

  try {
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

export async function deleteExpense(expenseId: string) {
  // For deleting expenses, check if user has edit permission
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;
  
  // Check edit permission for accountants
  if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
    return { success: false, message: "Geen toestemming om uitgaven te verwijderen." };
  }

  try {
    const deleted = await prisma.expense.deleteMany({
      where: { id: expenseId, userId },
    });
    if (deleted.count === 0) {
      return { success: false, message: "Uitgave niet gevonden." };
    }
    revalidatePath("/uitgaven");
    return { success: true };
  } catch (error) {
    console.error("DELETE_EXPENSE_FAILED", { error, expenseId, userId });
    return { success: false, message: "Verwijderen mislukt." };
  }
}

export async function duplicateExpense(expenseId: string) {
  // For duplicating expenses, check if user has edit permission
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId;
  
  // Check edit permission for accountants
  if (!context.isOwnerContext && !context.activeMembership?.permissions.canEdit) {
    return { success: false, message: "Geen toestemming om uitgaven te dupliceren." };
  }

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
  if (!expense) {
    return { success: false, message: "Uitgave niet gevonden." };
  }

  try {
    await prisma.expense.create({
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
