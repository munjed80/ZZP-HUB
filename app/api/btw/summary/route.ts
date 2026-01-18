import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";

/**
 * Get BTW summary for a company
 * Returns BTW to pay, to receive, and difference for the current quarter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required" },
        { status: 400 }
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

    // Get invoices for the quarter
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        lines: true,
      },
    });

    // Get expenses for the quarter
    const expenses = await prisma.expense.findMany({
      where: {
        userId: companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate BTW to pay (from invoices)
    let totalVatToCollect = 0;
    for (const invoice of invoices) {
      for (const line of invoice.lines) {
        const amount = Number(line.amount);
        let vatAmount = 0;

        if (line.vatRate === "HOOG_21") {
          vatAmount = amount * 0.21;
        } else if (line.vatRate === "LAAG_9") {
          vatAmount = amount * 0.09;
        }
        // For NUL_0, VRIJGESTELD, VERLEGD, vatAmount stays 0

        totalVatToCollect += vatAmount;
      }
    }

    // Calculate BTW to receive (from expenses)
    let totalVatToDeduct = 0;
    for (const expense of expenses) {
      const amountExcl = Number(expense.amountExcl);
      let vatAmount = 0;

      if (expense.vatRate === "HOOG_21") {
        vatAmount = amountExcl * 0.21;
      } else if (expense.vatRate === "LAAG_9") {
        vatAmount = amountExcl * 0.09;
      }

      totalVatToDeduct += vatAmount;
    }

    // Convert to cents for consistency
    const tePay = Math.round(totalVatToCollect * 100);
    const toReceive = Math.round(totalVatToDeduct * 100);
    const difference = tePay - toReceive;

    return NextResponse.json({
      success: true,
      data: {
        tePay,
        toReceive,
        difference,
        quarter: currentQuarter,
        year: currentYear,
      },
    });
  } catch (error) {
    console.error("Error fetching BTW summary:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij ophalen BTW-gegevens" },
      { status: 500 }
    );
  }
}
