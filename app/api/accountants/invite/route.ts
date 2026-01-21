import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/utils";
import crypto from "crypto";
import { CompanyRole, CompanyUserStatus, UserRole } from "@prisma/client";
import { logInviteCreated } from "@/lib/auth/security-audit";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  if (session.user.role !== UserRole.COMPANY_ADMIN && session.user.role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: "Alleen eigenaren kunnen uitnodigingen versturen" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  let email: string;
  try {
    email = normalizeEmail(body?.email);
  } catch (error) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const existing = await prisma.companyUser.findFirst({
    where: {
      companyId: session.user.id,
      invitedEmail: email,
      role: CompanyRole.ACCOUNTANT,
    },
  });

  if (existing?.status === CompanyUserStatus.ACTIVE) {
    return NextResponse.json({ error: "Uitnodiging bestaat al en is geaccepteerd" }, { status: 400 });
  }

  if (existing) {
    await prisma.companyUser.update({
      where: { id: existing.id },
      data: {
        tokenHash,
        status: CompanyUserStatus.PENDING,
        userId: null,
      },
    });
  } else {
    console.log("[accountant-invite] create.email", email);
    await prisma.companyUser.create({
      data: {
        companyId: session.user.id,
        invitedEmail: email,
        tokenHash,
        role: CompanyRole.ACCOUNTANT,
        status: CompanyUserStatus.PENDING,
      },
    });
  }

  await logInviteCreated({
    userId: session.user.id,
    email,
    role: "ACCOUNTANT",
    companyId: session.user.id,
  });

  return NextResponse.json({ token });
}
