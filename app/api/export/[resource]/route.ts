import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/company-context";
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
  type BtwReportData,
} from "@/lib/export-helpers";

type RouteContext = {
  params: Promise<{ resource: string }>;
};

/**
 * Export API endpoint
 * GET /api/export/[resource]?format=csv|xlsx|pdf&search=...&status=...
 * 
 * Supports multi-tenant access:
 * - Owners can export their own data
 * - Accountants with canExport permission can export client data
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { resource } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv") as ExportFormat;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Require export permission for non-admin resources
    // This handles both owners (who have all permissions) and accountants with canExport
    let activeCompanyId: string;
    
    if (resource === "companies") {
      // Admin only - companies export
      await requireRole(UserRole.SUPERADMIN);
      activeCompanyId = ""; // Not used for companies export
    } else {
      const exportContext = await requirePermission("canExport");
      activeCompanyId = exportContext.activeCompanyId;
    }

    let data;
    let filename: string;

    switch (resource) {
      case "invoices":
        data = await exportInvoices(activeCompanyId, search, status);
        filename = `facturen-${new Date().toISOString().split("T")[0]}`;
        break;

      case "quotations":
        data = await exportQuotations(activeCompanyId, search, status);
        filename = `offertes-${new Date().toISOString().split("T")[0]}`;
        break;

      case "clients":
        data = await exportClients(activeCompanyId, search);
        filename = `relaties-${new Date().toISOString().split("T")[0]}`;
        break;

      case "expenses":
        data = await exportExpenses(activeCompanyId, search);
        filename = `uitgaven-${new Date().toISOString().split("T")[0]}`;
        break;

      case "time-entries":
        data = await exportTimeEntries(activeCompanyId, search);
        filename = `uren-${new Date().toISOString().split("T")[0]}`;
        break;

      case "companies":
        // Already verified admin role above
        data = await exportCompanies();
        filename = `bedrijven-${new Date().toISOString().split("T")[0]}`;
        break;

      case "btw-report": {
        // BTW Report requires year and quarter parameters
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
        const quarter = parseInt(searchParams.get("quarter") || String(Math.floor(new Date().getMonth() / 3) + 1));
        
        if (isNaN(year) || year < 2000 || year > 2100) {
          return NextResponse.json({ error: "Invalid year" }, { status: 400 });
        }
        if (isNaN(quarter) || quarter < 1 || quarter > 4) {
          return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
        }
        
        const btwReportData = await exportBtwReport(activeCompanyId, year, quarter);
        filename = `btw-rapport-Q${quarter}-${year}`;
        
        // BTW Report has special PDF generation
        if (format === "pdf") {
          const pdfBuffer = await generateBtwReportPDF(btwReportData.reportData);
          return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}.pdf"`,
            },
          });
        } else if (format === "xlsx") {
          const buffer = await generateBtwReportXLSX(btwReportData.reportData);
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
            },
          });
        }
        
        return NextResponse.json({ error: "BTW report only supports PDF and XLSX formats" }, { status: 400 });
      }

      default:
        return NextResponse.json(
          { error: "Invalid resource" },
          { status: 400 }
        );
    }

    // Generate file based on format
    if (format === "xlsx") {
      const buffer = await generateXLSX(data.exportData, data.sheetName);
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
    if (error instanceof Error && (error.message.includes("Toegang geweigerd") || error.message.includes("Geen toestemming"))) {
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
    const upperStatus = statusFilter.toUpperCase();
    // Validate against known QuotationStatus values
    const validStatuses = ["CONCEPT", "VERZONDEN", "GEACCEPTEERD", "AFGEWEZEN", "OMGEZET"];
    if (validStatuses.includes(upperStatus)) {
      whereClause.status = upperStatus as Prisma.EnumQuotationStatusFilter;
    }
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

/**
 * Export BTW Report data
 */
async function exportBtwReport(userId: string, year: number, quarter: number) {
  // Import VAT calculation logic
  const { BtwTarief, InvoiceEmailStatus } = await import("@prisma/client");
  
  const VAT_PERCENTAGES: Record<string, number> = {
    HOOG_21: 0.21,
    LAAG_9: 0.09,
    NUL_0: 0,
    VRIJGESTELD: 0,
    VERLEGD: 0,
  };
  
  // Calculate quarter date range
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 1);
  
  // Get company profile
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId },
  });
  
  // Get invoices and expenses for the quarter
  const [invoices, expenses] = await Promise.all([
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
  
  // Calculate VAT amounts
  let omzet21 = 0, vat21 = 0;
  let omzet9 = 0, vat9 = 0;
  let omzet0 = 0;
  let revenueTotal = 0;
  let expenseTotal = 0;
  let deductibleVat = 0;
  
  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      const base = line.amount !== null ? Number(line.amount) : Number(line.quantity) * Number(line.price);
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
  
  // Format dates for display
  const startDate = start.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const endDate = new Date(end.getTime() - 1).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  
  const reportData: BtwReportData = {
    year,
    quarter,
    startDate,
    endDate,
    companyName: companyProfile?.companyName || "Onbekend bedrijf",
    companyAddress: companyProfile?.address || "",
    companyPostalCode: companyProfile?.postalCode || "",
    companyCity: companyProfile?.city || "",
    kvkNumber: companyProfile?.kvkNumber || "",
    btwNumber: companyProfile?.btwNumber || "",
    rubriek1a: { base: omzet21, vat: vat21 },
    rubriek1b: { base: omzet9, vat: vat9 },
    rubriek1e: { base: omzet0 },
    deductibleVat,
    totalSalesVat,
    totalDue,
    revenueTotal,
    expenseTotal,
  };
  
  return { reportData };
}

/**
 * Generate BTW Report PDF using the BtwReportPDF template
 */
async function generateBtwReportPDF(reportData: BtwReportData): Promise<Uint8Array> {
  const { generateBtwReportPdf } = await import("@/lib/btw-report-generator");
  const buffer = await generateBtwReportPdf(reportData);
  return new Uint8Array(buffer);
}

/**
 * Generate BTW Report XLSX with professional formatting
 */
async function generateBtwReportXLSX(reportData: BtwReportData): Promise<Buffer> {
  const ExcelJS = await import("exceljs");
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("BTW Aangifte");
  
  // Set column widths
  worksheet.columns = [
    { key: "A", width: 40 },
    { key: "B", width: 20 },
    { key: "C", width: 20 },
  ];
  
  // Title
  worksheet.mergeCells("A1:C1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "BTW-aangifte Rapport";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center" };
  
  // Period
  worksheet.mergeCells("A2:C2");
  const periodCell = worksheet.getCell("A2");
  periodCell.value = `Q${reportData.quarter} ${reportData.year} (${reportData.startDate} t/m ${reportData.endDate})`;
  periodCell.alignment = { horizontal: "center" };
  periodCell.font = { italic: true };
  
  // Company info
  worksheet.getCell("A4").value = "Bedrijf:";
  worksheet.getCell("B4").value = reportData.companyName;
  worksheet.getCell("A5").value = "Adres:";
  worksheet.getCell("B5").value = `${reportData.companyAddress}, ${reportData.companyPostalCode} ${reportData.companyCity}`;
  worksheet.getCell("A6").value = "KVK:";
  worksheet.getCell("B6").value = reportData.kvkNumber || "-";
  worksheet.getCell("A7").value = "BTW-nummer:";
  worksheet.getCell("B7").value = reportData.btwNumber || "-";
  
  // Empty row
  const headerRow = 9;
  
  // Table header
  worksheet.getCell(`A${headerRow}`).value = "Rubriek";
  worksheet.getCell(`B${headerRow}`).value = "Omzet / Kosten";
  worksheet.getCell(`C${headerRow}`).value = "BTW";
  
  const headerStyle = {
    font: { bold: true },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE0E0E0" } },
    border: {
      bottom: { style: "thin" as const },
    },
  };
  
  worksheet.getRow(headerRow).eachCell((cell) => {
    cell.font = headerStyle.font;
    cell.fill = headerStyle.fill;
    cell.border = headerStyle.border;
  });
  
  // Data rows
  const dataStartRow = headerRow + 1;
  
  // Rubriek 1a
  worksheet.getCell(`A${dataStartRow}`).value = "1a · Leveringen/diensten 21%";
  worksheet.getCell(`B${dataStartRow}`).value = reportData.rubriek1a.base;
  worksheet.getCell(`C${dataStartRow}`).value = reportData.rubriek1a.vat;
  
  // Rubriek 1b
  worksheet.getCell(`A${dataStartRow + 1}`).value = "1b · Leveringen/diensten 9%";
  worksheet.getCell(`B${dataStartRow + 1}`).value = reportData.rubriek1b.base;
  worksheet.getCell(`C${dataStartRow + 1}`).value = reportData.rubriek1b.vat;
  
  // Rubriek 1e
  worksheet.getCell(`A${dataStartRow + 2}`).value = "1e · Leveringen/diensten 0% of verlegd";
  worksheet.getCell(`B${dataStartRow + 2}`).value = reportData.rubriek1e.base;
  worksheet.getCell(`C${dataStartRow + 2}`).value = 0;
  
  // Total sales
  worksheet.getCell(`A${dataStartRow + 3}`).value = "Totaal omzet";
  worksheet.getCell(`B${dataStartRow + 3}`).value = reportData.revenueTotal;
  worksheet.getCell(`C${dataStartRow + 3}`).value = reportData.totalSalesVat;
  worksheet.getRow(dataStartRow + 3).font = { bold: true };
  
  // Empty row
  worksheet.getCell(`A${dataStartRow + 5}`).value = "5b · Voorbelasting";
  worksheet.getCell(`B${dataStartRow + 5}`).value = reportData.expenseTotal;
  worksheet.getCell(`C${dataStartRow + 5}`).value = reportData.deductibleVat;
  
  // Summary section
  const summaryRow = dataStartRow + 7;
  worksheet.getCell(`A${summaryRow}`).value = "Verschuldigde BTW";
  worksheet.getCell(`C${summaryRow}`).value = reportData.totalSalesVat;
  
  worksheet.getCell(`A${summaryRow + 1}`).value = "Af: Voorbelasting";
  worksheet.getCell(`C${summaryRow + 1}`).value = reportData.deductibleVat;
  
  worksheet.getCell(`A${summaryRow + 2}`).value = reportData.totalDue >= 0 ? "Te betalen" : "Terug te vragen";
  worksheet.getCell(`C${summaryRow + 2}`).value = Math.abs(reportData.totalDue);
  worksheet.getRow(summaryRow + 2).font = { bold: true, size: 12 };
  worksheet.getRow(summaryRow + 2).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: reportData.totalDue >= 0 ? "FFFFF3CD" : "FFD4EDDA" },
  };
  
  // Format currency columns
  for (let row = dataStartRow; row <= summaryRow + 2; row++) {
    const cellB = worksheet.getCell(`B${row}`);
    const cellC = worksheet.getCell(`C${row}`);
    if (typeof cellB.value === "number") {
      cellB.numFmt = "€ #,##0.00";
    }
    if (typeof cellC.value === "number") {
      cellC.numFmt = "€ #,##0.00";
    }
  }
  
  // Footer
  const footerRow = summaryRow + 5;
  worksheet.mergeCells(`A${footerRow}:C${footerRow}`);
  worksheet.getCell(`A${footerRow}`).value = `Gegenereerd op ${new Date().toLocaleDateString("nl-NL")} · ZZP-HUB`;
  worksheet.getCell(`A${footerRow}`).font = { italic: true, color: { argb: "FF666666" } };
  worksheet.getCell(`A${footerRow}`).alignment = { horizontal: "center" };
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
