"use server";

import { Resend } from "resend";
import { InvoiceEmailStatus, UserRole } from "@prisma/client";
import InvoiceEmail from "@/components/emails/InvoiceEmail";
import { generateInvoicePdf, mapInvoiceToPdfData, type InvoiceWithRelations } from "@/lib/pdf-generator";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.APP_FALLBACK_URL ?? "https://zzp-hub.nl");

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "no-reply@zzp-hub.nl";
const ALLOWED_LOGO_HOSTS = (process.env.ALLOWED_LOGO_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function buildCompanyDetails(companyProfile: InvoiceWithRelations["user"]["companyProfile"]) {
  if (!companyProfile) return "ZZP HUB";
  const parts = [
    companyProfile.companyName,
    companyProfile.address,
    `${companyProfile.postalCode} ${companyProfile.city}`,
    companyProfile.kvkNumber ? `KVK: ${companyProfile.kvkNumber}` : null,
    companyProfile.iban ? `IBAN: ${companyProfile.iban}` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

function buildInvoiceUrl(invoiceId: string) {
  return new URL(`/facturen/${invoiceId}`, APP_BASE_URL).toString();
}

export async function sendInvoiceEmail(invoiceId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY ontbreekt");
    return { success: false, message: "E-mailservice is niet geconfigureerd." };
  }

  try {
    const sanitizedInvoiceId = invoiceId.trim();
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(sanitizedInvoiceId)) {
      return { success: false, message: "Ongeldig factuurnummer." };
    }

    const { id: userId, role } = await requireUser();
    const invoice = await prisma.invoice.findFirst({
      where: role === UserRole.SUPERADMIN ? { id: sanitizedInvoiceId } : { id: sanitizedInvoiceId, userId },
      include: { client: true, lines: true, user: { include: { companyProfile: true } } },
    });

    if (!invoice) {
      return { success: false, message: "Factuur niet gevonden." };
    }

    const pdfInvoice = mapInvoiceToPdfData(invoice);
    const pdfBuffer = await generateInvoicePdf(pdfInvoice);
    const viewUrl = buildInvoiceUrl(invoice.id);
    const companyDetails = buildCompanyDetails(invoice.user.companyProfile);
    const trustedLogoUrl = (() => {
      const logoUrl = pdfInvoice.companyProfile?.logoUrl;
      if (!logoUrl) return undefined;
      try {
        const parsed = new URL(logoUrl);
        if (parsed.protocol !== "https:") return undefined;
        const hostname = parsed.hostname.toLowerCase();
        if (ALLOWED_LOGO_HOSTS.length > 0 && !ALLOWED_LOGO_HOSTS.includes(hostname)) {
          return undefined;
        }
        return parsed.toString();
      } catch {
        return undefined;
      }
    })();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${pdfInvoice.companyProfile?.companyName ?? "ZZP HUB"} <${FROM_EMAIL}>`,
      to: invoice.client.email,
      subject: `Factuur ${pdfInvoice.invoiceNum} van ${pdfInvoice.companyProfile?.companyName ?? "ZZP HUB"}`,
      react: (
        <InvoiceEmail
          clientName={invoice.client.name}
          invoiceNumber={pdfInvoice.invoiceNum}
          viewUrl={viewUrl}
          companyName={pdfInvoice.companyProfile?.companyName}
          companyDetails={companyDetails}
          logoUrl={trustedLogoUrl}
        />
      ),
      attachments: [
        {
          filename: `factuur-${pdfInvoice.invoiceNum}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (error) {
      console.error("Verzenden van factuur e-mail mislukt", error);
      return { success: false, message: "Het verzenden van de factuur is mislukt." };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { emailStatus: InvoiceEmailStatus.VERZONDEN },
    });

    return { success: true, recipient: invoice.client.email };
  } catch (error) {
    console.error("Versturen van factuur e-mail is mislukt", { error, invoiceId });
    return { success: false, message: "Het verzenden van de factuur is mislukt." };
  }
}
