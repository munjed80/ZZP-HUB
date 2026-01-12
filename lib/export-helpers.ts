/**
 * Export utilities for generating PDF, XLSX, and CSV files
 * Provides type-safe data transformation for various resources
 */

import * as XLSX from "xlsx";
import Papa from "papaparse";

export type ExportFormat = "pdf" | "xlsx" | "csv";

export type ExportData = Record<string, string | number | boolean | null>[];

/**
 * Generate XLSX file from data
 */
export function generateXLSX(data: ExportData, sheetName = "Data"): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}

/**
 * Generate CSV file from data
 */
export function generateCSV(data: ExportData): string {
  return Papa.unparse(data, {
    header: true,
    delimiter: ",",
    newline: "\r\n",
  });
}

/**
 * Format invoice data for export
 */
export function formatInvoicesForExport(invoices: {
  invoiceNum: string;
  date: Date;
  dueDate: Date;
  clientName: string;
  amount: number;
  status: string;
}[]): ExportData {
  return invoices.map((inv) => ({
    "Factuurnummer": inv.invoiceNum,
    "Datum": new Date(inv.date).toLocaleDateString("nl-NL"),
    "Vervaldatum": new Date(inv.dueDate).toLocaleDateString("nl-NL"),
    "Klant": inv.clientName,
    "Bedrag": inv.amount,
    "Status": inv.status,
  }));
}

/**
 * Format quotation data for export
 */
export function formatQuotationsForExport(quotations: {
  quoteNum: string;
  date: Date;
  validUntil: Date;
  clientName: string;
  amount: number;
  status: string;
}[]): ExportData {
  return quotations.map((quote) => ({
    "Offertenummer": quote.quoteNum,
    "Datum": new Date(quote.date).toLocaleDateString("nl-NL"),
    "Geldig tot": new Date(quote.validUntil).toLocaleDateString("nl-NL"),
    "Klant": quote.clientName,
    "Bedrag": quote.amount,
    "Status": quote.status,
  }));
}

/**
 * Format client data for export
 */
export function formatClientsForExport(clients: {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  kvkNumber?: string | null;
  btwId?: string | null;
}[]): ExportData {
  return clients.map((client) => ({
    "Naam": client.name,
    "Email": client.email,
    "Adres": client.address,
    "Postcode": client.postalCode,
    "Plaats": client.city,
    "KVK nummer": client.kvkNumber || "",
    "BTW ID": client.btwId || "",
  }));
}

/**
 * Format expense data for export
 */
export function formatExpensesForExport(expenses: {
  date: Date;
  description: string;
  category: string;
  amountExcl: number;
  vatRate: string;
}[]): ExportData {
  return expenses.map((expense) => ({
    "Datum": new Date(expense.date).toLocaleDateString("nl-NL"),
    "Omschrijving": expense.description,
    "Categorie": expense.category,
    "Bedrag excl. BTW": expense.amountExcl,
    "BTW tarief": expense.vatRate,
  }));
}

/**
 * Format time entry data for export
 */
export function formatTimeEntriesForExport(entries: {
  date: Date;
  hours: number;
  description: string;
}[]): ExportData {
  return entries.map((entry) => ({
    "Datum": new Date(entry.date).toLocaleDateString("nl-NL"),
    "Uren": entry.hours,
    "Omschrijving": entry.description,
  }));
}

/**
 * Format company data for export (admin only)
 */
export function formatCompaniesForExport(companies: {
  email: string;
  naam: string | null;
  role: string;
  isSuspended: boolean;
  createdAt: Date;
  companyName?: string | null;
}[]): ExportData {
  return companies.map((company) => ({
    "Email": company.email,
    "Naam": company.naam || "",
    "Bedrijfsnaam": company.companyName || "",
    "Rol": company.role,
    "Geblokkeerd": company.isSuspended ? "Ja" : "Nee",
    "Aangemaakt": new Date(company.createdAt).toLocaleDateString("nl-NL"),
  }));
}
