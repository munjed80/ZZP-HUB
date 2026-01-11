import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/app/actions/send-invoice";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await sendInvoiceEmail(id);
    
    if (result?.success) {
      return NextResponse.json({
        success: true,
        recipient: result.recipient,
        message: "Factuur succesvol verzonden",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result?.message ?? "Versturen mislukt",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Send invoice email API failed", error);
    return NextResponse.json(
      {
        success: false,
        message: "Er is een fout opgetreden bij het verzenden",
      },
      { status: 500 }
    );
  }
}
