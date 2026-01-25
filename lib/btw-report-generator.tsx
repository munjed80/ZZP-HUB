import { renderToBuffer } from "@react-pdf/renderer";
import { BtwReportPDF } from "@/components/pdf/BtwReportPDF";
import type { BtwReportData } from "@/lib/export-helpers";

/**
 * Generate a BTW Report PDF buffer
 */
export async function generateBtwReportPdf(report: BtwReportData): Promise<Buffer> {
  return renderToBuffer(<BtwReportPDF report={report} />);
}
