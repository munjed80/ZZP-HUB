import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";
import { requireCompanyContext } from "@/lib/auth/company-context";

/**
 * Get all notes for an invoice
 */
export async function GET(request: NextRequest) {
  try {
    const accountantSession = await getAccountantSession();
    const regularSession = await getServerAuthSession();
    const userId = accountantSession?.userId || regularSession?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const companyId = searchParams.get("companyId");

    if (!invoiceId || !companyId) {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste parameters" },
        { status: 400 }
      );
    }

    // Verify access to this company using strict company context
    await requireCompanyContext({ companyId });

    // Verify invoice belongs to this company
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: companyId },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    // Get all notes for this invoice
    const notes = await prisma.invoiceNote.findMany({
      where: { invoiceId },
      include: {
        user: {
          select: {
            id: true,
            naam: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Error fetching invoice notes:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij ophalen van notities" },
      { status: 500 }
    );
  }
}

/**
 * Create a new note for an invoice
 */
export async function POST(request: NextRequest) {
  try {
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
    const { invoiceId, companyId, content } = body;

    if (!invoiceId || !companyId || !content || content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste velden" },
        { status: 400 }
      );
    }

    // Verify access to this company using strict company context
    await requireCompanyContext({ companyId });

    // Verify invoice belongs to this company
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: companyId },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    // Create the note
    const note = await prisma.invoiceNote.create({
      data: {
        invoiceId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            naam: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create a notification for the company owner if note is from accountant
    if (accountantSession) {
      await prisma.notification.create({
        data: {
          userId: companyId,
          type: "invoice_note",
          title: "Nieuwe notitie op factuur",
          message: `Accountant heeft een notitie geplaatst op factuur ${invoice.invoiceNum}`,
          entityType: "invoice",
          entityId: invoiceId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      note,
      message: "Notitie toegevoegd",
    });
  } catch (error) {
    console.error("Error creating invoice note:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij toevoegen van notitie" },
      { status: 500 }
    );
  }
}
