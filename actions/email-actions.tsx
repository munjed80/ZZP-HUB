"use server";

import { Resend } from "resend";
import { BtwTarief, InvoiceEmailStatus, Prisma, UserRole } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoiceEmail from "@/components/emails/InvoiceEmail";
import { InvoicePDF, type InvoicePdfData } from "@/components/pdf/InvoicePDF";
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
  .map((host) => host.trim())
  .filter(Boolean);

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { client: true; lines: true; user: { include: { companyProfile: true } } };
}>;

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("nl-NL");
}

function mapVatRate(rate: BtwTarief): "21" | "9" | "0" {
  if (rate === BtwTarief.HOOG_21) return "21";
  if (rate === BtwTarief.LAAG_9) return "9";
  return "0";
}

function mapInvoiceToPdfData(invoice: InvoiceWithRelations): InvoicePdfData {
  return {
    invoiceNum: invoice.invoiceNum,
    date: formatDate(invoice.date),
    dueDate: formatDate(invoice.dueDate),
    client: {
      name: invoice.client.name,
      address: invoice.client.address,
      postalCode: invoice.client.postalCode,
      city: invoice.client.city,
    },
    companyProfile: invoice.user.companyProfile
      ? {
          companyName: invoice.user.companyProfile.companyName,
          address: invoice.user.companyProfile.address,
          postalCode: invoice.user.companyProfile.postalCode,
          city: invoice.user.companyProfile.city,
          kvkNumber: invoice.user.companyProfile.kvkNumber,
          iban: invoice.user.companyProfile.iban,
          logoUrl: invoice.user.companyProfile.logoUrl,
        }
      : null,
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vatRate: mapVatRate(line.vatRate),
    })),
  };
}

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
    const isUuid = uuidPattern.test(sanitizedInvoiceId);

    if (!isUuid) {
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

    const resend = new Resend(process.env.RESEND_API_KEY);
    const pdfInvoice = mapInvoiceToPdfData(invoice);
    const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={pdfInvoice} />);
    const viewUrl = buildInvoiceUrl(invoice.id);
    const companyDetails = buildCompanyDetails(invoice.user.companyProfile);
    const logoUrl = pdfInvoice.companyProfile?.logoUrl;
    const trustedLogoUrl = (() => {
      if (!logoUrl) return undefined;
      try {
        const parsed = new URL(logoUrl);
        if (parsed.protocol !== "https:") return undefined;
        if (ALLOWED_LOGO_HOSTS.length > 0 && !ALLOWED_LOGO_HOSTS.includes(parsed.hostname)) {
          return undefined;
        }
        return parsed.toString();
      } catch {
        return undefined;
      }
    })();

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
