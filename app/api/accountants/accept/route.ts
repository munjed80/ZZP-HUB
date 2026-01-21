import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/utils";
import { CompanyUserStatus } from "@prisma/client";
import crypto from "crypto";
import { logInviteAccepted } from "@/lib/auth/security-audit";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { token?: unknown; email?: unknown } | null;
  if (!body?.token) {
    return NextResponse.json({ error: "Token vereist" }, { status: 400 });
  }
  let email: string;
  try {
    email = body.email ? normalizeEmail(body.email) : normalizeEmail(session.user.email);
  } catch {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }
  console.log("[accountant-accept] create.email", email);
  const tokenHash = hashToken(String(body.token));

  const companyUser = await prisma.companyUser.findUnique({
    where: { tokenHash },
  });

  if (!companyUser || companyUser.status !== CompanyUserStatus.PENDING) {
    return NextResponse.json({ error: "Ongeldige of gebruikte uitnodiging" }, { status: 400 });
  }

  if (companyUser.invitedEmail && companyUser.invitedEmail !== email) {
    return NextResponse.json({ error: "E-mailadres komt niet overeen met uitnodiging" }, { status: 400 });
  }

  const updated = await prisma.companyUser.update({
    where: { id: companyUser.id },
    data: {
      userId: session.user.id,
      invitedEmail: email,
      status: CompanyUserStatus.ACTIVE,
      tokenHash: null,
    },
  });

  await logInviteAccepted({
    userId: session.user.id,
    email,
    companyId: companyUser.companyId,
    role: "ACCOUNTANT",
    isNewUser: false,
  });

  return NextResponse.json({ success: true, companyUserId: updated.id });
}
