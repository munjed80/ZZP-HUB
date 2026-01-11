import { NextResponse } from "next/server";
import { z } from "zod";
import { SupportMessageStatus } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const supportSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.string().email().max(160),
  subject: z.string().min(3).max(160).trim(),
  message: z.string().min(10).max(2000).trim(),
  screenshotUrl: z.string().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  context: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = supportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controleer de invoer.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, subject, message, context, screenshotUrl } = parsed.data;
  const session = await getServerAuthSession();

  const resolvedName = session?.user?.name?.trim() || name;
  const resolvedEmail = session?.user?.email || email;
  const composedMessage = [
    message,
    context ? `\n\nContext: ${context}` : null,
    screenshotUrl ? `\n\nScreenshot: ${screenshotUrl}` : null,
  ]
    .filter(Boolean)
    .join("")
    .trim();

  try {
    await prisma.supportMessage.create({
      data: {
        userId: session?.user?.id ?? null,
        name: resolvedName,
        email: resolvedEmail,
        subject,
        message: composedMessage,
        status: SupportMessageStatus.NEW,
      },
    });
  } catch (error) {
    console.error("Supportbericht opslaan mislukt", error);
    return NextResponse.json({ error: "Opslaan mislukt. Probeer het later opnieuw." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
