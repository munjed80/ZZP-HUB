"use server";

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/tenant";
import { createInvite, resolvePermissions, validateInvitedEmail } from "@/lib/accountant/access";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.role !== UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ success: false, message: "Alleen company admins kunnen uitnodigen." }, { status: 403 });
    }

    const body = await req.json();
    const invitedEmail = validateInvitedEmail(body.email);
    const fullAccess = Boolean(body.fullAccess);
    const permissions = resolvePermissions(fullAccess, body.permissions);

    const { token } = await createInvite({
      companyId: session.userId,
      invitedEmail,
      permissions,
    });

    return NextResponse.json({ success: true, token });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 });
  }
}

export async function GET() {
  const session = await requireSession();
  if (session.role !== UserRole.COMPANY_ADMIN) {
    return NextResponse.json({ success: false, message: "Alleen company admins kunnen uitnodigingen bekijken." }, { status: 403 });
  }

  const invites = await prisma.accountantInvite.findMany({
    where: { companyId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, invites });
}
