import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantAccessibleCompanyIds, requireAccountantSession } from "@/lib/auth/tenant";
import { logAccountantMarkReviewed } from "@/lib/auth/security-audit";
import { AccountantAccessStatus } from "@prisma/client";

/**
 * Mark an item (invoice, expense, etc.) as reviewed by accountant
 * This creates an audit trail of what has been reviewed
  */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAccountantSession();
    const body = await request.json();
    const { companyId, type, id } = body;

    if (!companyId || !type || !id) {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste velden" },
        { status: 400 }
      );
    }

    const accessibleCompanyIds = await getAccountantAccessibleCompanyIds(session.userId);
    if (!accessibleCompanyIds.includes(companyId)) {
      return NextResponse.json(
        { success: false, message: "Geen toegang tot dit bedrijf" },
        { status: 403 }
      );
    }

    const access = await prisma.accountantAccess.findUnique({
      where: {
        accountantUserId_companyId: {
          accountantUserId: session.userId,
          companyId,
        },
      },
    });

    if (!access || access.status !== AccountantAccessStatus.ACTIVE || !access.canEdit) {
      return NextResponse.json(
        { success: false, message: "Geen bewerkingsrechten" },
        { status: 403 }
      );
    }

    // Verify the item exists and belongs to this company
    let itemExists = false;
    if (type === "invoice") {
      const invoice = await prisma.invoice.findFirst({
        where: { id, userId: companyId },
      });
      itemExists = !!invoice;
    } else if (type === "expense") {
      const expense = await prisma.expense.findFirst({
        where: { id, userId: companyId },
      });
      itemExists = !!expense;
    }

    if (!itemExists) {
      return NextResponse.json(
        { success: false, message: "Item niet gevonden" },
        { status: 404 }
      );
    }

    // Log the review action
    await logAccountantMarkReviewed({
      userId: session.userId,
      companyId,
      itemType: type,
      itemId: id,
    });

    // Update the reviewed status in the database
    const now = new Date();
    if (type === "invoice") {
      await prisma.invoice.update({
        where: { id },
        data: {
          reviewedAt: now,
          reviewedBy: session.userId,
          reviewStatus: "approved",
        },
      });
    } else if (type === "expense") {
      await prisma.expense.update({
        where: { id },
        data: {
          reviewedAt: now,
          reviewedBy: session.userId,
          reviewStatus: "approved",
        },
      });
    }

    // Create a notification for the company owner
    let entityName = "";
    if (type === "invoice") {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        select: { invoiceNum: true },
      });
      entityName = invoice?.invoiceNum || "";
    } else if (type === "expense") {
      const expense = await prisma.expense.findUnique({
        where: { id },
        select: { description: true },
      });
      entityName = expense?.description || "";
    }

    await prisma.notification.create({
      data: {
        userId: companyId,
        type: `${type}_reviewed`,
        title: `${type === "invoice" ? "Factuur" : "Uitgave"} goedgekeurd`,
        message: `Uw accountant heeft ${entityName} gecontroleerd en goedgekeurd`,
        entityType: type,
        entityId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gemarkeerd als gecontroleerd",
    });
  } catch (error) {
    console.error("Error marking as reviewed:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij markeren als gecontroleerd" },
      { status: 500 }
    );
  }
}
