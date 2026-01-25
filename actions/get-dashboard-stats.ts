"use server";

import { BtwTarief, InvoiceEmailStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext } from "@/lib/auth/company-context";
import { DEFAULT_VAT_RATE } from "@/lib/constants";
import {
  getInvoiceNotificationType,
  getInvoiceNotificationSeverity,
  getInvoiceNotificationMessage,
  getAgendaNotificationType,
  getAgendaNotificationMessage,
  type InvoiceNotification,
  type AgendaNotification,
} from "@/lib/notifications";

const MONTH_LABELS = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const createMonthlyChartData = () => MONTH_LABELS.map((name) => ({ name, revenue: 0, expenses: 0 }));
const VAT_PERCENTAGES: Record<BtwTarief, number> = {
  [BtwTarief.HOOG_21]: DEFAULT_VAT_RATE,
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
  // Use active company context - for accountants this returns the client company ID
  // For owners, this returns their own user ID
  const context = await getActiveCompanyContext();
  const userId = context.activeCompanyId; // Use activeCompanyId instead of session userId
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const scope = { userId };
  const finalizedInvoiceFilter = {
    ...scope,
    emailStatus: InvoiceEmailStatus.BETAALD,
  };

  const monthlyChartData = createMonthlyChartData();

  let invoices: InvoiceWithRelations[] = [];
  let recentInvoices: InvoiceWithRelations[] = [];
  let unpaidInvoices: InvoiceWithRelations[] = [];
  let upcomingEvents: { id: string; title: string; description: string | null; start: Date; end: Date }[] = [];
  let expenses: Awaited<ReturnType<typeof prisma.expense.findMany>> = [];
  const sliceRecentExpenses = (list: typeof expenses) => (list ?? []).slice(0, 5);

  try {
    const [invoicesForYear, latestInvoices, expensesForYear, unpaidInvoicesResult, eventsResult] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          ...finalizedInvoiceFilter,
          date: { gte: startOfYear, lt: endOfYear },
        },
        include: { lines: true, client: true },
        orderBy: { date: "desc" },
      }),
      prisma.invoice.findMany({
        where: finalizedInvoiceFilter,
        include: { lines: true, client: true },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.expense.findMany({
        where: { ...scope, date: { gte: startOfYear, lt: endOfYear } },
        orderBy: { date: "desc" },
      }),
      // Get all unpaid invoices for notifications (not BETAALD)
      prisma.invoice.findMany({
        where: {
          ...scope,
          emailStatus: { not: InvoiceEmailStatus.BETAALD },
        },
        include: { lines: true, client: true },
        orderBy: { dueDate: "asc" },
      }),
      // Get upcoming events (next 7 days)
      prisma.event.findMany({
        where: {
          ...scope,
          start: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { start: "asc" },
      }),
    ]);
    invoices = invoicesForYear;
    recentInvoices = latestInvoices;
    unpaidInvoices = unpaidInvoicesResult;
    upcomingEvents = eventsResult;
    expenses = expensesForYear;
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
      invoiceNotifications: [],
      agendaNotifications: [],
    };
  }

  try {
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

    // Build invoice notifications
    const invoiceNotifications: InvoiceNotification[] = [];
    for (const invoice of unpaidInvoices) {
      const notificationType = getInvoiceNotificationType(invoice.dueDate, now);
      if (notificationType) {
        const amount = invoice.lines.reduce((sum, line) => sum + calculateLineAmount(line), 0);
        invoiceNotifications.push({
          invoiceId: invoice.id,
          invoiceNum: invoice.invoiceNum,
          clientName: invoice.client.name,
          amount,
          dueDate: invoice.dueDate,
          notificationType,
          severity: getInvoiceNotificationSeverity(notificationType),
          message: getInvoiceNotificationMessage(notificationType, invoice.invoiceNum, invoice.client.name),
        });
      }
    }

    // Build agenda notifications
    const agendaNotifications: AgendaNotification[] = [];
    for (const event of upcomingEvents) {
      const notificationType = getAgendaNotificationType(event.start, now);
      if (notificationType) {
        agendaNotifications.push({
          eventId: event.id,
          title: event.title,
          start: event.start,
          notificationType,
          severity: notificationType === "event_today" ? "highlight" : "info",
          message: getAgendaNotificationMessage(notificationType, event.title, event.start),
        });
      }
    }

    return {
      yearlyRevenue,
      yearlyExpenses,
      netProfit,
      totalVatCollected,
      totalVatPaid,
      vatToPay,
      incomeTaxReservation,
      monthlyChartData,
      recentInvoices,
      recentExpenses: sliceRecentExpenses(expenses),
      invoiceNotifications,
      agendaNotifications,
    };
  } catch (error) {
    console.error("Kon dashboardstatistieken niet berekenen", { error, userId });
    return {
      yearlyRevenue: 0,
      yearlyExpenses: 0,
      netProfit: 0,
      totalVatCollected: 0,
      totalVatPaid: 0,
      vatToPay: 0,
      incomeTaxReservation: 0,
      monthlyChartData: createMonthlyChartData(),
      recentInvoices,
      recentExpenses: sliceRecentExpenses(expenses),
      invoiceNotifications: [],
      agendaNotifications: [],
    };
  }
}
