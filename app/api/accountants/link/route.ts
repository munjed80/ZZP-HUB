import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { CompanyRole, CompanyUserStatus } from "@prisma/client";

/**
 * Link an existing accountant user to a company.
 * 
 * Input: { companyId: UUID, accountantEmail: string }
 * 
 * Behavior:
 * - Validate accountantEmail is non-empty and normalized
 * - Find existing user by email; if not found, return 404 "Accountant user not found"
 * - Ensure user has ACCOUNTANT role via existing CompanyUser link; if not, return 400 "User is not an accountant"
 * - Create or upsert the CompanyUser record with default canRead=true
 * - Return { ok: true, companyId, accountantUserId }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { 
    companyId?: unknown; 
    accountantEmail?: unknown 
  } | null;

  // Validate companyId
  if (!body?.companyId || typeof body.companyId !== "string") {
    return NextResponse.json(
      { error: "companyId is required and must be a valid UUID" }, 
      { status: 400 }
    );
  }
  const companyId = body.companyId;

  // Validate and normalize accountantEmail
  let accountantEmail: string;
  try {
    accountantEmail = normalizeEmail(body.accountantEmail);
  } catch {
    return NextResponse.json(
      { error: "accountantEmail is required and must be a valid email" }, 
      { status: 400 }
    );
  }

  // Find the accountant user by email
  const accountantUser = await prisma.user.findUnique({
    where: { email: accountantEmail },
    select: { id: true, email: true },
  });

  if (!accountantUser) {
    return NextResponse.json(
      { error: "Accountant user not found" }, 
      { status: 404 }
    );
  }

  // Check if the user is already an accountant for any company
  // A user is considered an accountant if they have any CompanyUser record with role ACCOUNTANT
  const existingAccountantRole = await prisma.companyUser.findFirst({
    where: {
      userId: accountantUser.id,
      role: CompanyRole.ACCOUNTANT,
    },
  });

  if (!existingAccountantRole) {
    return NextResponse.json(
      { error: "User is not an accountant" }, 
      { status: 400 }
    );
  }

  // Verify the company exists
  const company = await prisma.user.findUnique({
    where: { id: companyId },
    select: { id: true },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Company not found" }, 
      { status: 404 }
    );
  }

  // Create or upsert the CompanyUser record linking accountant to company
  const companyUser = await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: companyId,
        userId: accountantUser.id,
      },
    },
    update: {
      status: CompanyUserStatus.ACTIVE,
      canRead: true, // Default read permission
    },
    create: {
      companyId: companyId,
      userId: accountantUser.id,
      invitedEmail: accountantEmail,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.ACTIVE,
      canRead: true, // Default read permission
      canEdit: false,
      canExport: false,
      canBTW: false,
    },
  });

  return NextResponse.json({
    ok: true,
    companyId: companyId,
    accountantUserId: accountantUser.id,
  });
}
