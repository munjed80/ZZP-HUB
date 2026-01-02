"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { BtwTarief, InvoiceEmailStatus, Prisma } from "@prisma/client";

export type VatReport = {
  year: number;
  quarter: number;
  rubriek1a: { base: number; vat: number };
  rubriek1b: { base: number; vat: number };
  rubriek1e: { base: number };
  deductibleVat: number;
  totalSalesVat: number;
  totalDue: number;
  revenueTotal: number;
  expenseTotal: number;
};

const VAT_PERCENTAGES: Record<BtwTarief, number> = {
  [BtwTarief.HOOG_21]: 0.21,
  [BtwTarief.LAAG_9]: 0.09,
  [BtwTarief.NUL_0]: 0,
  [BtwTarief.VRIJGESTELD]: 0,
  [BtwTarief.VERLEGD]: 0,
};
type InvoiceWithLines = Prisma.InvoiceGetPayload<{ include: { lines: true } }>;

function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 1);
  return { start, end };
}

function calculateLineAmount(line: { amount: Prisma.Decimal | number | null; quantity: Prisma.Decimal | number; price: Prisma.Decimal | number }) {
  const amount = line.amount;
  if (amount !== null && amount !== undefined) {
    return Number(amount);
  }
  return Number(line.quantity) * Number(line.price);
}

export async function getVatReport(year: number, quarter: number): Promise<VatReport> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const { start, end } = quarterRange(year, quarter);

  let invoices: InvoiceWithLines[] = [];
  let expenses: Awaited<ReturnType<typeof prisma.expense.findMany>> = [];

  try {
    [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId,
          date: { gte: start, lt: end },
          NOT: { emailStatus: InvoiceEmailStatus.CONCEPT },
        },
        include: { lines: true },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: start, lt: end } },
      }),
    ]);
  } catch (error) {
    console.error("Kon BTW-gegevens niet ophalen", { error, year, quarter, userId });
    return {
      year,
      quarter,
      rubriek1a: { base: 0, vat: 0 },
      rubriek1b: { base: 0, vat: 0 },
      rubriek1e: { base: 0 },
      deductibleVat: 0,
      totalSalesVat: 0,
      totalDue: 0,
      revenueTotal: 0,
      expenseTotal: 0,
    };
  }

  let omzet21 = 0;
  let vat21 = 0;
  let omzet9 = 0;
  let vat9 = 0;
  let omzet0 = 0;
  let revenueTotal = 0;
  let expenseTotal = 0;
  let deductibleVat = 0;

  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      const base = calculateLineAmount(line);
      const percentage = VAT_PERCENTAGES[line.vatRate] ?? 0;
      revenueTotal += base;

      if (line.vatRate === BtwTarief.HOOG_21) {
        omzet21 += base;
        vat21 += base * percentage;
      } else if (line.vatRate === BtwTarief.LAAG_9) {
        omzet9 += base;
        vat9 += base * percentage;
      } else {
        omzet0 += base;
      }
    }
  }

  for (const expense of expenses) {
    const base = Number(expense.amountExcl);
    const percentage = VAT_PERCENTAGES[expense.vatRate] ?? 0;
    expenseTotal += base;
    deductibleVat += base * percentage;
  }

  const totalSalesVat = vat21 + vat9;
  const totalDue = totalSalesVat - deductibleVat;

  return {
    year,
    quarter,
    rubriek1a: { base: omzet21, vat: vat21 },
    rubriek1b: { base: omzet9, vat: vat9 },
    rubriek1e: { base: omzet0 },
    deductibleVat,
    totalSalesVat,
    totalDue,
    revenueTotal,
    expenseTotal,
  };
}
