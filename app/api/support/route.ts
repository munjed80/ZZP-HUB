import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const supportSchema = z.object({
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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "E-mailservice is niet geconfigureerd." }, { status: 500 });
  }

  const { name, email, subject, message, context, screenshotUrl } = parsed.data;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "support@zzp-hub.nl";
  const toEmail = process.env.SUPPORT_EMAIL ?? fromEmail;

  const { error } = await resend.emails.send({
    from: `ZZP HUB Support <${fromEmail}>`,
    to: toEmail,
    replyTo: email,
    subject: `[Support] ${subject}`,
    text: [
      `Naam: ${name}`,
      `E-mail: ${email}`,
      context ? `Context: ${context}` : null,
      screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    console.error("Support e-mail verzenden mislukt", error);
    return NextResponse.json({ error: "Het verzenden is mislukt. Probeer het later opnieuw." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
