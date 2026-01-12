import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, requireRole } from "@/lib/auth/tenant";
import { UserRole, InvoiceEmailStatus, Prisma } from "@prisma/client";
import {
  generateXLSX,
  generateCSV,
  formatInvoicesForExport,
  formatQuotationsForExport,
  formatClientsForExport,
  formatExpensesForExport,
  formatTimeEntriesForExport,
  formatCompaniesForExport,
  type ExportFormat,
} from "@/lib/export-helpers";

type RouteContext = {
  params: Promise<{ resource: string }>;
};

/**
 * Export API endpoint
 * GET /api/export/[resource]?format=csv|xlsx|pdf&search=...&status=...
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { resource } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv") as ExportFormat;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Get tenant context
    const { userId } = await requireTenantContext();

    let data;
    let filename: string;

    switch (resource) {
      case "invoices":
        data = await exportInvoices(userId, search, status);
        filename = `facturen-${new Date().toISOString().split("T")[0]}`;
        break;

      case "quotations":
        data = await exportQuotations(userId, search, status);
        filename = `offertes-${new Date().toISOString().split("T")[0]}`;
        break;

      case "clients":
        data = await exportClients(userId, search);
        filename = `relaties-${new Date().toISOString().split("T")[0]}`;
        break;

      case "expenses":
        data = await exportExpenses(userId, search);
        filename = `uitgaven-${new Date().toISOString().split("T")[0]}`;
        break;

      case "time-entries":
        data = await exportTimeEntries(userId, search);
        filename = `uren-${new Date().toISOString().split("T")[0]}`;
        break;

      case "companies":
        // Admin only
        await requireRole(UserRole.SUPERADMIN);
        data = await exportCompanies();
        filename = `bedrijven-${new Date().toISOString().split("T")[0]}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid resource" },
          { status: 400 }
        );
    }

    // Generate file based on format
    if (format === "xlsx") {
      const buffer = generateXLSX(data.exportData, data.sheetName);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    } else if (format === "csv") {
      const csv = generateCSV(data.exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF, we'll generate a simple table view
      const pdfBuffer = await generateListPDF(data.exportData, data.title);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    if (error instanceof Error && error.message.includes("Niet geauthenticeerd")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Toegang geweigerd")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

async function exportInvoices(userId: string, search: string, statusFilter: string) {
  const whereClause: Prisma.InvoiceWhereInput = { userId };

  if (search) {
    whereClause.OR = [
      { invoiceNum: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter && statusFilter !== "all") {
    if (statusFilter === "paid") {
      whereClause.emailStatus = InvoiceEmailStatus.BETAALD;
    } else if (statusFilter === "open") {
      whereClause.emailStatus = { not: InvoiceEmailStatus.BETAALD };
    }
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: { client: true, lines: true },
    orderBy: { date: "desc" },
  });

  const formattedData = formatInvoicesForExport(
    invoices.map((inv) => ({
      invoiceNum: inv.invoiceNum,
      date: inv.date,
      dueDate: inv.dueDate,
      clientName: inv.client.name,
      amount: inv.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0),
      status: inv.emailStatus === InvoiceEmailStatus.BETAALD ? "Betaald" : 
              inv.emailStatus === InvoiceEmailStatus.CONCEPT ? "Concept" : "Open",
    }))
  );

  return {
    exportData: formattedData,
    sheetName: "Facturen",
    title: "Facturen Overzicht",
  };
}

async function exportQuotations(userId: string, search: string, statusFilter: string) {
  const whereClause: Prisma.QuotationWhereInput = { userId };

  if (search) {
    whereClause.OR = [
      { quoteNum: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter && statusFilter !== "all") {
    whereClause.status = statusFilter.toUpperCase() as Prisma.EnumQuotationStatusFilter;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    include: { client: true, lines: true },
    orderBy: { date: "desc" },
  });

  const formattedData = formatQuotationsForExport(
    quotations.map((quote) => ({
      quoteNum: quote.quoteNum,
      date: quote.date,
      validUntil: quote.validUntil,
      clientName: quote.client?.name || "",
      amount: quote.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0),
      status: quote.status,
    }))
  );

  return {
    exportData: formattedData,
    sheetName: "Offertes",
    title: "Offertes Overzicht",
  };
}

async function exportClients(userId: string, search: string) {
  const whereClause: Prisma.ClientWhereInput = { userId };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
  });

  const formattedData = formatClientsForExport(clients);

  return {
    exportData: formattedData,
    sheetName: "Relaties",
    title: "Relaties Overzicht",
  };
}

async function exportExpenses(userId: string, search: string) {
  const whereClause: Prisma.ExpenseWhereInput = { userId };

  if (search) {
    whereClause.description = { contains: search, mode: "insensitive" };
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });

  const formattedData = formatExpensesForExport(
    expenses.map((exp) => ({
      date: exp.date,
      description: exp.description,
      category: exp.category,
      amountExcl: Number(exp.amountExcl),
      vatRate: exp.vatRate,
    }))
  );

  return {
    exportData: formattedData,
    sheetName: "Uitgaven",
    title: "Uitgaven Overzicht",
  };
}

async function exportTimeEntries(userId: string, search: string) {
  const whereClause: Prisma.TimeEntryWhereInput = { userId };

  if (search) {
    whereClause.description = { contains: search, mode: "insensitive" };
  }

  const entries = await prisma.timeEntry.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });

  const formattedData = formatTimeEntriesForExport(
    entries.map((entry) => ({
      date: entry.date,
      hours: Number(entry.hours),
      description: entry.description,
    }))
  );

  return {
    exportData: formattedData,
    sheetName: "Uren",
    title: "Uren Registratie",
  };
}

async function exportCompanies() {
  const companies = await prisma.user.findMany({
    include: { companyProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const formattedData = formatCompaniesForExport(
    companies.map((company) => ({
      email: company.email,
      naam: company.naam,
      role: company.role,
      isSuspended: company.isSuspended,
      createdAt: company.createdAt,
      companyName: company.companyProfile?.companyName,
    }))
  );

  return {
    exportData: formattedData,
    sheetName: "Bedrijven",
    title: "Bedrijven Overzicht",
  };
}

/**
 * Generate a simple PDF from tabular data
 */
async function generateListPDF(data: Record<string, string | number | boolean | null>[], title: string): Promise<Uint8Array> {
  // Import react-pdf components
  const React = await import("react");
  const { Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const { pdf } = await import("@react-pdf/renderer");
  
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: "Helvetica",
    },
    title: {
      fontSize: 18,
      marginBottom: 20,
      fontWeight: "bold",
    },
    table: {
      display: "flex",
      width: "auto",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#bfbfbf",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#bfbfbf",
    },
    tableHeader: {
      backgroundColor: "#f0f0f0",
      fontWeight: "bold",
    },
    tableCell: {
      padding: 5,
      flex: 1,
      fontSize: 9,
    },
  });

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const PDFDocument = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page, orientation: "landscape" },
      React.createElement(Text, { style: styles.title }, title),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableHeader] },
          ...headers.map((header, i) =>
            React.createElement(Text, { key: i, style: styles.tableCell }, header)
          )
        ),
        ...data.map((row, rowIndex) =>
          React.createElement(
            View,
            { key: rowIndex, style: styles.tableRow },
            ...headers.map((header, cellIndex) =>
              React.createElement(
                Text,
                { key: cellIndex, style: styles.tableCell },
                String(row[header] ?? "")
              )
            )
          )
        )
      )
    )
  );

  // Get blob and convert to array buffer
  const instance = pdf(PDFDocument);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
