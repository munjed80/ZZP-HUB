"use server";

import { requireSession } from "@/lib/auth/tenant";
import { generateAccountantExport } from "@/lib/export-accountant";

/**
 * Export data for accountant
 */
export async function exportForAccountant(
  companyId: string,
  startDate: string,
  endDate: string
) {
  try {
    const session = await requireSession();

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        message: "Ongeldige datums opgegeven.",
      };
    }

    if (start > end) {
      return {
        success: false,
        message: "Startdatum moet voor einddatum liggen.",
      };
    }

    // Generate export
    const exportData = await generateAccountantExport(
      session.userId,
      companyId,
      start,
      end
    );

    return {
      success: true,
      data: {
        invoicesCSV: exportData.invoicesCSV,
        expensesCSV: exportData.expensesCSV,
        vatSummaryJSON: exportData.vatSummaryJSON,
        vatCSV: exportData.vatCSV,
      },
    };
  } catch (error) {
    console.error("Error exporting for accountant:", error);
    const message =
      error instanceof Error ? error.message : "Er is een fout opgetreden bij het exporteren.";
    return {
      success: false,
      message,
    };
  }
}
