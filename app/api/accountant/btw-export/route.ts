import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/tenant";
import { CompanyUserStatus, BtwTarief, InvoiceEmailStatus } from "@prisma/client";
import { type BtwReportData } from "@/lib/export-helpers";

/** UUID v4 validation regex */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Accountant BTW Export Endpoint
 * GET /api/accountant/btw-export?companyId=...&year=...&quarter=...&format=pdf|xlsx
 * 
 * Allows accountants to download BTW reports for their clients without switching context.
 * Validates that the user has canExport or canBTW permission for the specified company.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const format = searchParams.get("format") || "pdf";
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const quarter = parseInt(searchParams.get("quarter") || String(Math.floor(new Date().getMonth() / 3) + 1));

    // Validate companyId
    if (!companyId || !UUID_REGEX.test(companyId)) {
      return NextResponse.json({ error: "Invalid companyId" }, { status: 400 });
    }

    // Validate year and quarter
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (isNaN(quarter) || quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
    }

    // Validate format
    if (format !== "pdf" && format !== "xlsx") {
      return NextResponse.json({ error: "Format must be pdf or xlsx" }, { status: 400 });
    }

    // Check if user has access to this company with export or BTW permission
    // Allow if: user is the company owner OR has an active membership with canExport or canBTW
    const isOwnCompany = companyId === userId;
    
    let hasAccess = isOwnCompany;
    
    if (!isOwnCompany) {
      const membership = await prisma.companyUser.findFirst({
        where: {
          userId,
          companyId,
          status: CompanyUserStatus.ACTIVE,
          OR: [
            { canExport: true },
            { canBTW: true },
          ],
        },
        select: {
          id: true,
          canExport: true,
          canBTW: true,
        },
      });
      
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Geen toegang tot dit bedrijf of onvoldoende rechten" }, { status: 403 });
    }

    // Generate BTW report data
    const reportData = await generateBtwReportData(companyId, year, quarter);
    const filename = `btw-rapport-Q${quarter}-${year}`;

    // Generate and return the file
    if (format === "pdf") {
      const { generateBtwReportPdf } = await import("@/lib/btw-report-generator");
      const pdfBuffer = await generateBtwReportPdf(reportData);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    } else {
      const buffer = await generateBtwReportXLSX(reportData);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Accountant BTW export error:", error);
    if (error instanceof Error && error.message.includes("Niet geauthenticeerd")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

/**
 * Generate BTW Report data for a specific company
 */
async function generateBtwReportData(companyId: string, year: number, quarter: number): Promise<BtwReportData> {
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
    where: { userId: companyId },
  });
  
  // Get invoices and expenses for the quarter
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: companyId,
        date: { gte: start, lt: end },
        NOT: { emailStatus: InvoiceEmailStatus.CONCEPT },
      },
      include: { lines: true },
    }),
    prisma.expense.findMany({
      where: { userId: companyId, date: { gte: start, lt: end } },
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
  
  return {
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
