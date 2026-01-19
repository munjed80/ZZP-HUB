import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";
import { logAccountantMarkReviewed } from "@/lib/auth/security-audit";

/**
 * Mark an item (invoice, expense, etc.) as reviewed by accountant
 * This creates an audit trail of what has been reviewed
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
    const { companyId, type, id } = body;

    if (!companyId || !type || !id) {
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

    // Check if user has edit permissions (viewing alone isn't enough to mark as reviewed)
    const permissions = JSON.parse(hasAccess.permissions || "{}");
    if (!permissions.edit && hasAccess.role !== "ACCOUNTANT_EDIT") {
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
      userId,
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
          reviewedBy: userId,
          reviewStatus: "approved",
        },
      });
    } else if (type === "expense") {
      await prisma.expense.update({
        where: { id },
        data: {
          reviewedAt: now,
          reviewedBy: userId,
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
