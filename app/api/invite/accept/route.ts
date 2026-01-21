"use server";

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { APP_BASE_URL } from "@/config/emails";
import { acceptInvite } from "@/lib/accountant/access";
import { getServerAuthSession } from "@/lib/auth";
import { validateInvitedEmail } from "@/lib/accountant/invite";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, message: "Token ontbreekt.", errorCode: "MISSING_TOKEN" }, { status: 400 });
  }
  const invite = await prisma.accountantInvite.findFirst({
    where: { tokenHash: hashToken(token), status: "PENDING" },
    select: { invitedEmail: true, company: { select: { naam: true } } },
  });
  if (!invite) {
    return NextResponse.json({ success: false, message: "Uitnodiging niet gevonden.", errorCode: "INVITE_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    companyName: invite.company?.naam || "Bedrijf",
    email: invite.invitedEmail,
    isNewUser: true,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const token = body.token as string | undefined;
  if (!token) {
    return NextResponse.json({ success: false, message: "Token ontbreekt.", errorCode: "MISSING_TOKEN" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const invite = await prisma.accountantInvite.findFirst({
    where: { tokenHash, status: "PENDING" },
  });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ success: false, message: "Uitnodiging ongeldig of verlopen.", errorCode: "INVITE_EXPIRED" }, { status: 400 });
  }

  const session = await getServerAuthSession();
  let userId = session?.user?.id;

  // If not logged in, create accountant user
  if (!userId) {
    const email = validateInvitedEmail(invite.invitedEmail);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      userId = existing.id;
    } else {
      const password = await bcrypt.hash(generateVerificationToken(), 10);
      const user = await prisma.user.create({
        data: { email, password, role: UserRole.ACCOUNTANT, emailVerified: true },
      });
      userId = user.id;
      const verificationToken = generateVerificationToken();
      const hashedToken = await hashToken(verificationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, token: hashedToken, expiresAt },
      });
      await sendEmail({
        to: email,
        subject: "Welkom bij ZZP-HUB (accountant)",
        react: VerificationEmail({ verificationUrl: `${APP_BASE_URL}/verify-email?token=${verificationToken}`, userName: email }),
      });
    }
  }

  const result = await acceptInvite(token, userId!);
  await prisma.accountantSession.create({
    data: {
      sessionToken: tokenHash,
      userId: userId!,
      email: invite.invitedEmail,
      companyId: result.companyId,
      role: UserRole.ACCOUNTANT,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  return NextResponse.json({ success: true, message: "Uitnodiging geaccepteerd.", isNewUser: !session?.user, companyId: result.companyId });
}
