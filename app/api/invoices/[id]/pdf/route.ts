import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext, verifyTenantOwnership } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf, mapInvoiceToPdfData } from "@/lib/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sanitizedInvoiceId = id.trim();
    
    // Validate UUID format
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(sanitizedInvoiceId)) {
      return NextResponse.json(
        { success: false, message: "Ongeldig factuurnummer" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { userId } = await requireTenantContext();

    // Fetch invoice with ownership check
    const invoice = await prisma.invoice.findFirst({
      where: { id: sanitizedInvoiceId, userId },
      include: { 
        client: true, 
        lines: true, 
        user: { include: { companyProfile: true } } 
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    // Verify tenant ownership
    await verifyTenantOwnership(invoice.userId, "getPdfInvoice");

    // Generate PDF
    const pdfInvoice = mapInvoiceToPdfData(invoice);
    const pdfBuffer = await generateInvoicePdf(pdfInvoice);

    // Return PDF with proper headers
    const filename = `factuur-${pdfInvoice.invoiceNum}.pdf`;
    
    // Convert buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json(
      { success: false, message: "PDF genereren mislukt" },
      { status: 500 }
    );
  }
}
