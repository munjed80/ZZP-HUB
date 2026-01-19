import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Get all notes for an expense
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
    const expenseId = searchParams.get("expenseId");
    const companyId = searchParams.get("companyId");

    if (!expenseId || !companyId) {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste parameters" },
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

    // Verify expense belongs to this company
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId: companyId },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Uitgave niet gevonden" },
        { status: 404 }
      );
    }

    // Get all notes for this expense
    const notes = await prisma.expenseNote.findMany({
      where: { expenseId },
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
    console.error("Error fetching expense notes:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij ophalen van notities" },
      { status: 500 }
    );
  }
}

/**
 * Create a new note for an expense
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
    const { expenseId, companyId, content } = body;

    if (!expenseId || !companyId || !content || content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste velden" },
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

    // Verify expense belongs to this company
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId: companyId },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Uitgave niet gevonden" },
        { status: 404 }
      );
    }

    // Create the note
    const note = await prisma.expenseNote.create({
      data: {
        expenseId,
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
          type: "expense_note",
          title: "Nieuwe notitie op uitgave",
          message: `Accountant heeft een notitie geplaatst op uitgave: ${expense.description}`,
          entityType: "expense",
          entityId: expenseId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      note,
      message: "Notitie toegevoegd",
    });
  } catch (error) {
    console.error("Error creating expense note:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij toevoegen van notitie" },
      { status: 500 }
    );
  }
}
