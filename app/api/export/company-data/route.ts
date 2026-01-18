import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";
import { logAccountantExportData } from "@/lib/auth/security-audit";

/**
 * Export complete company data for accountants
 * Returns CSV/JSON data for invoices, expenses, and clients
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

    // Check export permission
    const permissions = JSON.parse(hasAccess.permissions || "{}");
    if (!permissions.export) {
      return NextResponse.json(
        { success: false, message: "Geen exportrechten" },
        { status: 403 }
      );
    }

    // Get company data
    const [invoices, expenses, clients] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId: companyId },
        include: {
          client: true,
          lines: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: { userId: companyId },
        orderBy: { date: "desc" },
      }),
      prisma.client.findMany({
        where: { userId: companyId },
        orderBy: { name: "asc" },
      }),
    ]);

    // Log export action
    await logAccountantExportData({
      userId,
      companyId,
      exportType: "complete_data",
      recordCount: invoices.length + expenses.length + clients.length,
    });

    // Convert to CSV format
    const invoicesCsv = convertInvoicesToCsv(invoices);
    const expensesCsv = convertExpensesToCsv(expenses);
    const clientsCsv = convertClientsToCsv(clients);

    // In a real implementation, you would:
    // 1. Create ZIP file with all CSVs
    // 2. Upload to storage (S3, etc.)
    // 3. Return download URL
    // For now, return the data directly

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoicesCsv,
        expenses: expensesCsv,
        clients: clientsCsv,
      },
      message: "Data succesvol geëxporteerd",
    });
  } catch (error) {
    console.error("Error exporting company data:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij exporteren van gegevens" },
      { status: 500 }
    );
  }
}

function convertInvoicesToCsv(invoices: any[]): string {
  const headers = ["Factuurnummer", "Datum", "Klant", "Bedrag", "Status"];
  const rows = invoices.map((inv) => {
    const total = inv.lines.reduce((sum: number, line: any) => sum + Number(line.amount), 0);
    return [
      inv.invoiceNum,
      new Date(inv.date).toLocaleDateString("nl-NL"),
      inv.client.name,
      `€${(total / 100).toFixed(2)}`,
      inv.emailStatus,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function convertExpensesToCsv(expenses: any[]): string {
  const headers = ["Datum", "Categorie", "Beschrijving", "Bedrag (excl.)", "BTW"];
  const rows = expenses.map((exp) => [
    new Date(exp.date).toLocaleDateString("nl-NL"),
    exp.category,
    exp.description,
    `€${(Number(exp.amountExcl) / 100).toFixed(2)}`,
    exp.vatRate,
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

function convertClientsToCsv(clients: any[]): string {
  const headers = ["Naam", "Email", "KVK", "BTW-ID"];
  const rows = clients.map((client) => [
    client.name,
    client.email,
    client.kvkNumber || "",
    client.btwId || "",
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}
