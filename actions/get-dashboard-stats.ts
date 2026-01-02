"use server";

import { BtwTarief, InvoiceEmailStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const MONTH_LABELS = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const VAT_PERCENTAGES: Record<BtwTarief, number> = {
  [BtwTarief.HOOG_21]: 0.21,
  [BtwTarief.LAAG_9]: 0.09,
  [BtwTarief.NUL_0]: 0,
  [BtwTarief.VRIJGESTELD]: 0,
  [BtwTarief.VERLEGD]: 0,
};
type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: { lines: true; client: true } }>;

function calculateLineAmount(line: { amount: Prisma.Decimal | number | null; quantity: Prisma.Decimal | number; price: Prisma.Decimal | number }) {
  if (line.amount !== null && line.amount !== undefined) return Number(line.amount);
  return Number(line.quantity) * Number(line.price);
}

export async function getDashboardStats() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

  const monthlyChartData = MONTH_LABELS.map((name) => ({ name, revenue: 0, expenses: 0 }));

  let invoices: InvoiceWithRelations[] = [];
  let expenses: Awaited<ReturnType<typeof prisma.expense.findMany>> = [];

  try {
    [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId,
          date: { gte: startOfYear, lt: endOfYear },
          NOT: { emailStatus: InvoiceEmailStatus.CONCEPT },
        },
        include: { lines: true, client: true },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: startOfYear, lt: endOfYear } },
        orderBy: { date: "desc" },
      }),
    ]);
  } catch (error) {
    console.error("Kon dashboardstatistieken niet ophalen", { error, userId });
    return {
      yearlyRevenue: 0,
      yearlyExpenses: 0,
      netProfit: 0,
      totalVatCollected: 0,
      totalVatPaid: 0,
      vatToPay: 0,
      incomeTaxReservation: 0,
      monthlyChartData,
      recentInvoices: [],
      recentExpenses: [],
    };
  }

  let yearlyRevenue = 0;
  let totalVatCollected = 0;

  for (const invoice of invoices) {
    let invoiceBase = 0;
    for (const line of invoice.lines) {
      const base = calculateLineAmount(line);
      const vatRate = VAT_PERCENTAGES[line.vatRate] ?? 0;
      invoiceBase += base;
      totalVatCollected += base * vatRate;
    }
    yearlyRevenue += invoiceBase;
    monthlyChartData[invoice.date.getMonth()].revenue += invoiceBase;
  }

  let yearlyExpenses = 0;
  let totalVatPaid = 0;

  for (const expense of expenses) {
    const base = Number(expense.amountExcl);
    const vatRate = VAT_PERCENTAGES[expense.vatRate] ?? 0;
    yearlyExpenses += base;
    totalVatPaid += base * vatRate;
    monthlyChartData[expense.date.getMonth()].expenses += base;
  }

  const netProfit = yearlyRevenue - yearlyExpenses;
  const vatToPay = totalVatCollected - totalVatPaid;
  const incomeTaxReservation = Math.max(0, netProfit * 0.35);

  return {
    yearlyRevenue,
    yearlyExpenses,
    netProfit,
    totalVatCollected,
    totalVatPaid,
    vatToPay,
    incomeTaxReservation,
    monthlyChartData,
    recentInvoices: invoices.slice(0, 5),
    recentExpenses: expenses.slice(0, 5),
  };
}
