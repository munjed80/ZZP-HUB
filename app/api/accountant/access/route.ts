"use server";

import { NextResponse } from "next/server";
import { AccountantAccessStatus, InviteStatus, UserRole } from "@prisma/client";
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

  const companyId = session.userId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId);

  if (!isUuid) {
    console.info("ACCOUNTANT_INVITES_LIST_EMPTY_REASON", { companyId, reason: "WRONG_COMPANYID" });
    return NextResponse.json({ success: true, invites: [], accesses: [] });
  }

  const [allInvites, activeAccesses] = await Promise.all([
    prisma.accountantInvite.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountantAccess.findMany({
      where: { companyId, status: AccountantAccessStatus.ACTIVE },
      include: {
        accountant: {
          select: { email: true, naam: true, id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const invites = allInvites.filter((invite) => invite.status === InviteStatus.PENDING);

  console.info("ACCOUNTANT_INVITES_LIST_LOAD", {
    companyId,
    inviteCount: invites.length,
    accessCount: activeAccesses.length,
  });

  if (invites.length === 0 && activeAccesses.length === 0) {
    const reason = allInvites.length > 0 ? "FILTERED_OUT" : "NO_INVITES";
    console.info("ACCOUNTANT_INVITES_LIST_EMPTY_REASON", { companyId, reason });
  }

  return NextResponse.json({ success: true, invites, accesses: activeAccesses });
}
