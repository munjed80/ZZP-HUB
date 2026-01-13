import { prisma } from "@/lib/prisma";
import type { QueryInvoicesAction, ComputeBTWAction } from "../schemas/actions";
import { InvoiceEmailStatus, BtwTarief } from "@prisma/client";

interface ToolContext {
  userId: string;
}

/**
 * List invoices with filters
 */
export async function toolListInvoices(
  action: QueryInvoicesAction,
  context: ToolContext
) {
  const { userId } = context;

  const where: any = { userId };

  if (action.status) {
    where.emailStatus = action.status as InvoiceEmailStatus;
  }

  if (action.fromDate || action.toDate) {
    where.date = {};
    if (action.fromDate) {
      where.date.gte = new Date(action.fromDate);
    }
    if (action.toDate) {
      where.date.lte = new Date(action.toDate);
    }
  }

  if (action.clientName) {
    where.client = {
      name: {
        contains: action.clientName,
        mode: "insensitive",
      },
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: true,
      lines: true,
    },
    orderBy: { date: "desc" },
    take: action.limit,
  });

  const invoicesWithTotals = invoices.map((invoice) => {
    const subtotal = invoice.lines.reduce(
      (sum, line) => sum + line.amount.toNumber(),
      0
    );
    const vatAmount = invoice.lines.reduce((sum, line) => {
      const rate = line.vatRate === BtwTarief.HOOG_21 ? 0.21 :
                   line.vatRate === BtwTarief.LAAG_9 ? 0.09 : 0;
      return sum + line.amount.toNumber() * rate;
    }, 0);

    return {
      id: invoice.id,
      invoiceNum: invoice.invoiceNum,
      clientName: invoice.client.name,
      date: invoice.date.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.emailStatus,
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
    };
  });

  return {
    success: true,
    invoices: invoicesWithTotals,
    count: invoicesWithTotals.length,
  };
}

/**
 * Compute BTW/VAT summary
 */
export async function toolComputeBTW(
  action: ComputeBTWAction,
  context: ToolContext
) {
  const { userId } = context;

  // Determine date range
  let fromDate: Date;
  let toDate: Date;

  if (action.period === "month") {
    const now = new Date();
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (action.period === "quarter") {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    fromDate = new Date(now.getFullYear(), quarter * 3, 1);
    toDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  } else if (action.period === "year") {
    const now = new Date();
    fromDate = new Date(now.getFullYear(), 0, 1);
    toDate = new Date(now.getFullYear(), 11, 31);
  } else {
    fromDate = action.fromDate ? new Date(action.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    toDate = action.toDate ? new Date(action.toDate) : new Date();
  }

  // Get invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      lines: true,
    },
  });

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });

  // Calculate revenue by VAT rate
  let revenue21 = 0;
  let vat21 = 0;
  let revenue9 = 0;
  let vat9 = 0;
  let revenue0 = 0;

  invoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      const amount = line.amount.toNumber();
      if (line.vatRate === BtwTarief.HOOG_21) {
        revenue21 += amount;
        vat21 += amount * 0.21;
      } else if (line.vatRate === BtwTarief.LAAG_9) {
        revenue9 += amount;
        vat9 += amount * 0.09;
      } else {
        revenue0 += amount;
      }
    });
  });

  // Calculate expense VAT (voorbelasting)
  let expenseVat = 0;
  let totalExpenses = 0;

  expenses.forEach((expense) => {
    const amount = expense.amountExcl.toNumber();
    totalExpenses += amount;
    if (expense.vatRate === BtwTarief.HOOG_21) {
      expenseVat += amount * 0.21;
    } else if (expense.vatRate === BtwTarief.LAAG_9) {
      expenseVat += amount * 0.09;
    }
  });

  const totalRevenue = revenue21 + revenue9 + revenue0;
  const totalVatCharged = vat21 + vat9;
  const netVat = totalVatCharged - expenseVat;

  return {
    success: true,
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    revenue: {
      total: totalRevenue,
      at21: revenue21,
      at9: revenue9,
      at0: revenue0,
    },
    vat: {
      charged: totalVatCharged,
      charged21: vat21,
      charged9: vat9,
      deductible: expenseVat,
      netToPay: netVat,
    },
    expenses: {
      total: totalExpenses,
      vatDeductible: expenseVat,
    },
    summary: `Voor de periode ${fromDate.toLocaleDateString("nl-NL")} tot ${toDate.toLocaleDateString("nl-NL")}: Omzet €${totalRevenue.toFixed(2)}, BTW verschuldigd €${totalVatCharged.toFixed(2)}, Voorbelasting €${expenseVat.toFixed(2)}, Netto te betalen €${netVat.toFixed(2)}`,
  };
}
