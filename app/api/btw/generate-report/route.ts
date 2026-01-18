import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";
import { logAccountantGenerateReport } from "@/lib/auth/security-audit";

/**
 * Generate BTW report for a company
 * Returns a formatted report with all BTW calculations
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const accountantSession = await getAccountantSession();
    const regularSession = await getServerAuthSession();

    const userId = accountantSession?.userId || regularSession?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify access to this company
    const hasAccess = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Geen toegang tot dit bedrijf" },
        { status: 403 }
      );
    }

    // Check BTW permissions
    const permissions = JSON.parse(hasAccess.permissions || "{}");
    if (!permissions.btw && hasAccess.role !== "ACCOUNTANT_EDIT") {
      return NextResponse.json(
        { success: false, message: "Geen BTW-rechten" },
        { status: 403 }
      );
    }

    // Get current quarter
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();

    // Calculate quarter date range
    const quarterStartMonth = (currentQuarter - 1) * 3;
    const startDate = new Date(currentYear, quarterStartMonth, 1);
    const endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);

    // Get company details
    const company = await prisma.user.findUnique({
      where: { id: companyId },
      include: {
        companyProfile: true,
      },
    });

    // Get invoices and expenses
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId: companyId,
          date: { gte: startDate, lte: endDate },
        },
        include: { lines: true, client: true },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          userId: companyId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    // Calculate BTW
    const btwReport = calculateBTW(invoices, expenses);

    // Log the report generation
    await logAccountantGenerateReport({
      userId,
      companyId,
      reportType: "BTW_QUARTER",
    });

    // Generate report text
    const reportText = generateReportText({
      company: company?.companyProfile,
      quarter: currentQuarter,
      year: currentYear,
      startDate,
      endDate,
      btwReport,
      invoicesCount: invoices.length,
      expensesCount: expenses.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        report: btwReport,
        reportText,
        quarter: currentQuarter,
        year: currentYear,
      },
      message: "BTW-rapport gegenereerd",
    });
  } catch (error) {
    console.error("Error generating BTW report:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij genereren BTW-rapport" },
      { status: 500 }
    );
  }
}

function calculateBTW(invoices: any[], expenses: any[]) {
  let totalVatToCollect = 0;
  let totalVatToDeduct = 0;
  let omzetHoog = 0;
  let omzetLaag = 0;
  let omzetNul = 0;

  // Calculate from invoices
  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      const amount = Number(line.amount);
      
      if (line.vatRate === "HOOG_21") {
        omzetHoog += amount;
        totalVatToCollect += amount * 0.21;
      } else if (line.vatRate === "LAAG_9") {
        omzetLaag += amount;
        totalVatToCollect += amount * 0.09;
      } else {
        omzetNul += amount;
      }
    }
  }

  // Calculate from expenses
  for (const expense of expenses) {
    const amountExcl = Number(expense.amountExcl);
    
    if (expense.vatRate === "HOOG_21") {
      totalVatToDeduct += amountExcl * 0.21;
    } else if (expense.vatRate === "LAAG_9") {
      totalVatToDeduct += amountExcl * 0.09;
    }
  }

  return {
    omzetHoog: Math.round(omzetHoog * 100),
    omzetLaag: Math.round(omzetLaag * 100),
    omzetNul: Math.round(omzetNul * 100),
    btwTeVoldoen: Math.round(totalVatToCollect * 100),
    btwTerug: Math.round(totalVatToDeduct * 100),
    saldo: Math.round((totalVatToCollect - totalVatToDeduct) * 100),
  };
}

function generateReportText(params: any): string {
  const { company, quarter, year, btwReport, invoicesCount, expensesCount } = params;

  return `
BTW-AANGIFTE RAPPORT
====================

Bedrijf: ${company?.companyName || "Onbekend"}
KVK: ${company?.kvkNumber || ""}
BTW-nummer: ${company?.btwNumber || ""}

Periode: Q${quarter} ${year}

OMZET
-----
Omzet hoog tarief (21%): € ${(btwReport.omzetHoog / 100).toFixed(2)}
Omzet laag tarief (9%):  € ${(btwReport.omzetLaag / 100).toFixed(2)}
Omzet 0% / verlegd:      € ${(btwReport.omzetNul / 100).toFixed(2)}

BTW BEREKENING
--------------
BTW te voldoen:   € ${(btwReport.btwTeVoldoen / 100).toFixed(2)}
BTW terugvragen:  € ${(btwReport.btwTerug / 100).toFixed(2)}

TOTAAL
------
${btwReport.saldo >= 0 ? "Te betalen:" : "Terug te ontvangen:"} € ${Math.abs(btwReport.saldo / 100).toFixed(2)}

DETAILS
-------
Aantal facturen: ${invoicesCount}
Aantal uitgaven: ${expensesCount}

Gegenereerd op: ${new Date().toLocaleString("nl-NL")}
`.trim();
}
