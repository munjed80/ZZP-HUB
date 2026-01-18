/**
 * Export bundle generator for accountants
 * 
 * Generates a comprehensive export package including:
 * - Invoices (PDF + CSV)
 * - Expenses (CSV)
 * - VAT Summary (JSON + CSV)
 */

import "server-only";
import { prisma } from "./prisma";
import { requireCompanyAccess } from "./auth/company-access";
import { BtwTarief, type Invoice, type Expense } from "@prisma/client";
import Papa from "papaparse";

/**
 * VAT rates mapping
 */
const VAT_RATES: Record<BtwTarief, number> = {
  HOOG_21: 0.21,
  LAAG_9: 0.09,
  NUL_0: 0.0,
  VRIJGESTELD: 0.0,
  VERLEGD: 0.0,
};

/**
 * Generate export data for accountant
 */
export async function generateAccountantExport(
  userId: string,
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  // Verify access
  await requireCompanyAccess(userId, companyId, "export");

  // Fetch invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      userId: companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      client: true,
      lines: true,
    },
    orderBy: { date: "asc" },
  });

  // Fetch expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId: companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Generate CSV files
  const invoicesCSV = generateInvoicesCSV(invoices);
  const expensesCSV = generateExpensesCSV(expenses);
  const vatSummary = generateVATSummary(invoices, expenses, startDate, endDate);
  const vatCSV = generateVATCSV(vatSummary);

  return {
    invoicesCSV,
    expensesCSV,
    vatSummaryJSON: JSON.stringify(vatSummary, null, 2),
    vatCSV,
    invoices,
    expenses,
    vatSummary,
  };
}

/**
 * Generate invoices CSV
 */
function generateInvoicesCSV(
  invoices: Array<
    Invoice & {
      client: { name: string; btwId: string | null };
      lines: Array<{
        description: string;
        quantity: any;
        price: any;
        amount: any;
        vatRate: BtwTarief;
      }>;
    }
  >
): string {
  const rows = invoices.flatMap((invoice) => {
    return invoice.lines.map((line) => {
      const vatRate = VAT_RATES[line.vatRate] || 0;
      const amount = Number(line.amount);
      const vatAmount = amount * vatRate;
      const total = amount + vatAmount;

      return {
        Factuurnummer: invoice.invoiceNum,
        Datum: invoice.date.toISOString().split("T")[0],
        Vervaldatum: invoice.dueDate.toISOString().split("T")[0],
        Klant: invoice.client.name,
        BTW_ID_Klant: invoice.client.btwId || "",
        Status: invoice.emailStatus,
        Omschrijving: line.description,
        Aantal: Number(line.quantity),
        Prijs: Number(line.price),
        Bedrag_Excl: amount.toFixed(2),
        BTW_Tarief: line.vatRate,
        BTW_Percentage: (vatRate * 100).toFixed(0) + "%",
        BTW_Bedrag: vatAmount.toFixed(2),
        Totaal_Incl: total.toFixed(2),
      };
    });
  });

  return Papa.unparse(rows, {
    delimiter: ";",
    header: true,
  });
}

/**
 * Generate expenses CSV
 */
function generateExpensesCSV(expenses: Expense[]): string {
  const rows = expenses.map((expense) => {
    const vatRate = VAT_RATES[expense.vatRate] || 0;
    const amountExcl = Number(expense.amountExcl);
    const vatAmount = amountExcl * vatRate;
    const total = amountExcl + vatAmount;

    return {
      Datum: expense.date.toISOString().split("T")[0],
      Categorie: expense.category,
      Omschrijving: expense.description,
      Bedrag_Excl: amountExcl.toFixed(2),
      BTW_Tarief: expense.vatRate,
      BTW_Percentage: (vatRate * 100).toFixed(0) + "%",
      BTW_Bedrag: vatAmount.toFixed(2),
      Totaal_Incl: total.toFixed(2),
      Bonnetje_URL: expense.receiptUrl || "",
    };
  });

  return Papa.unparse(rows, {
    delimiter: ";",
    header: true,
  });
}

/**
 * Generate VAT summary
 */
function generateVATSummary(
  invoices: Array<{
    lines: Array<{
      amount: any;
      vatRate: BtwTarief;
    }>;
  }>,
  expenses: Expense[],
  startDate: Date,
  endDate: Date
) {
  const summary = {
    period: {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    },
    sales: {
      high_21: { net: 0, vat: 0, gross: 0 },
      low_9: { net: 0, vat: 0, gross: 0 },
      zero_0: { net: 0, vat: 0, gross: 0 },
      exempt: { net: 0, vat: 0, gross: 0 },
      reversed: { net: 0, vat: 0, gross: 0 },
      total: { net: 0, vat: 0, gross: 0 },
    },
    purchases: {
      high_21: { net: 0, vat: 0, gross: 0 },
      low_9: { net: 0, vat: 0, gross: 0 },
      zero_0: { net: 0, vat: 0, gross: 0 },
      exempt: { net: 0, vat: 0, gross: 0 },
      reversed: { net: 0, vat: 0, gross: 0 },
      total: { net: 0, vat: 0, gross: 0 },
    },
    netVatOwed: 0,
  };

  // Calculate sales (invoices)
  invoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      const amount = Number(line.amount);
      const vatRate = VAT_RATES[line.vatRate] || 0;
      const vatAmount = amount * vatRate;
      const gross = amount + vatAmount;

      const categoryKey = line.vatRate.toLowerCase().replace("_", "_") as keyof typeof summary.sales;
      if (summary.sales[categoryKey]) {
        summary.sales[categoryKey].net += amount;
        summary.sales[categoryKey].vat += vatAmount;
        summary.sales[categoryKey].gross += gross;
      }

      summary.sales.total.net += amount;
      summary.sales.total.vat += vatAmount;
      summary.sales.total.gross += gross;
    });
  });

  // Calculate purchases (expenses)
  expenses.forEach((expense) => {
    const amount = Number(expense.amountExcl);
    const vatRate = VAT_RATES[expense.vatRate] || 0;
    const vatAmount = amount * vatRate;
    const gross = amount + vatAmount;

    const categoryKey = expense.vatRate.toLowerCase().replace("_", "_") as keyof typeof summary.purchases;
    if (summary.purchases[categoryKey]) {
      summary.purchases[categoryKey].net += amount;
      summary.purchases[categoryKey].vat += vatAmount;
      summary.purchases[categoryKey].gross += gross;
    }

    summary.purchases.total.net += amount;
    summary.purchases.total.vat += vatAmount;
    summary.purchases.total.gross += gross;
  });

  // Calculate net VAT owed
  summary.netVatOwed = summary.sales.total.vat - summary.purchases.total.vat;

  // Round all values
  Object.keys(summary.sales).forEach((key) => {
    const category = summary.sales[key as keyof typeof summary.sales];
    category.net = Math.round(category.net * 100) / 100;
    category.vat = Math.round(category.vat * 100) / 100;
    category.gross = Math.round(category.gross * 100) / 100;
  });

  Object.keys(summary.purchases).forEach((key) => {
    const category = summary.purchases[key as keyof typeof summary.purchases];
    category.net = Math.round(category.net * 100) / 100;
    category.vat = Math.round(category.vat * 100) / 100;
    category.gross = Math.round(category.gross * 100) / 100;
  });

  summary.netVatOwed = Math.round(summary.netVatOwed * 100) / 100;

  return summary;
}

/**
 * Generate VAT summary CSV
 */
function generateVATCSV(summary: any): string {
  const rows = [
    {
      Type: "Verkopen",
      Categorie: "Hoog (21%)",
      Netto: summary.sales.high_21.net.toFixed(2),
      BTW: summary.sales.high_21.vat.toFixed(2),
      Bruto: summary.sales.high_21.gross.toFixed(2),
    },
    {
      Type: "Verkopen",
      Categorie: "Laag (9%)",
      Netto: summary.sales.low_9.net.toFixed(2),
      BTW: summary.sales.low_9.vat.toFixed(2),
      Bruto: summary.sales.low_9.gross.toFixed(2),
    },
    {
      Type: "Verkopen",
      Categorie: "Nul (0%)",
      Netto: summary.sales.zero_0.net.toFixed(2),
      BTW: summary.sales.zero_0.vat.toFixed(2),
      Bruto: summary.sales.zero_0.gross.toFixed(2),
    },
    {
      Type: "Verkopen",
      Categorie: "Vrijgesteld",
      Netto: summary.sales.exempt.net.toFixed(2),
      BTW: summary.sales.exempt.vat.toFixed(2),
      Bruto: summary.sales.exempt.gross.toFixed(2),
    },
    {
      Type: "Verkopen",
      Categorie: "Verlegd",
      Netto: summary.sales.reversed.net.toFixed(2),
      BTW: summary.sales.reversed.vat.toFixed(2),
      Bruto: summary.sales.reversed.gross.toFixed(2),
    },
    {
      Type: "Verkopen",
      Categorie: "TOTAAL",
      Netto: summary.sales.total.net.toFixed(2),
      BTW: summary.sales.total.vat.toFixed(2),
      Bruto: summary.sales.total.gross.toFixed(2),
    },
    { Type: "", Categorie: "", Netto: "", BTW: "", Bruto: "" },
    {
      Type: "Inkopen",
      Categorie: "Hoog (21%)",
      Netto: summary.purchases.high_21.net.toFixed(2),
      BTW: summary.purchases.high_21.vat.toFixed(2),
      Bruto: summary.purchases.high_21.gross.toFixed(2),
    },
    {
      Type: "Inkopen",
      Categorie: "Laag (9%)",
      Netto: summary.purchases.low_9.net.toFixed(2),
      BTW: summary.purchases.low_9.vat.toFixed(2),
      Bruto: summary.purchases.low_9.gross.toFixed(2),
    },
    {
      Type: "Inkopen",
      Categorie: "Nul (0%)",
      Netto: summary.purchases.zero_0.net.toFixed(2),
      BTW: summary.purchases.zero_0.vat.toFixed(2),
      Bruto: summary.purchases.zero_0.gross.toFixed(2),
    },
    {
      Type: "Inkopen",
      Categorie: "Vrijgesteld",
      Netto: summary.purchases.exempt.net.toFixed(2),
      BTW: summary.purchases.exempt.vat.toFixed(2),
      Bruto: summary.purchases.exempt.gross.toFixed(2),
    },
    {
      Type: "Inkopen",
      Categorie: "Verlegd",
      Netto: summary.purchases.reversed.net.toFixed(2),
      BTW: summary.purchases.reversed.vat.toFixed(2),
      Bruto: summary.purchases.reversed.gross.toFixed(2),
    },
    {
      Type: "Inkopen",
      Categorie: "TOTAAL",
      Netto: summary.purchases.total.net.toFixed(2),
      BTW: summary.purchases.total.vat.toFixed(2),
      Bruto: summary.purchases.total.gross.toFixed(2),
    },
    { Type: "", Categorie: "", Netto: "", BTW: "", Bruto: "" },
    {
      Type: "Saldo",
      Categorie: "Te betalen BTW",
      Netto: "",
      BTW: summary.netVatOwed.toFixed(2),
      Bruto: "",
    },
  ];

  return Papa.unparse(rows, {
    delimiter: ";",
    header: true,
  });
}
