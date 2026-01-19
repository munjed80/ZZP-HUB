"use server";

import { revalidatePath } from "next/cache";
import { BtwTarief, Eenheid, InvoiceEmailStatus, Prisma, QuotationStatus } from "@prisma/client";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import QuotationEmail from "@/components/emails/QuotationEmail";
import { InvoicePDF, type InvoicePdfData } from "@/components/pdf/InvoicePDF";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";
import { formatFromAddress, logEmailSuccess } from "@/lib/email";
import { quotationSchema, type QuotationFormValues, type QuotationLineValues } from "./schema";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.APP_FALLBACK_URL ?? "https://zzp-hub.nl");

const ALLOWED_LOGO_HOSTS = (process.env.ALLOWED_LOGO_HOSTS ?? "zzp-hub.nl")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function mapVatRate(vat: QuotationLineValues["vat"]) {
  const mapping: Record<QuotationLineValues["vat"], BtwTarief> = {
    "21": BtwTarief.HOOG_21,
    "9": BtwTarief.LAAG_9,
    "0": BtwTarief.NUL_0,
  };

  return mapping[vat];
}

function mapUnit(unit: QuotationLineValues["unit"]) {
  const mapping: Record<QuotationLineValues["unit"], Eenheid> = {
    UUR: Eenheid.UUR,
    STUK: Eenheid.STUK,
    PROJECT: Eenheid.PROJECT,
    KM: Eenheid.KM,
    STOP: Eenheid.STOP,
  };

  return mapping[unit];
}

function mapVatRateToString(rate: BtwTarief): "21" | "9" | "0" {
  if (rate === BtwTarief.HOOG_21) return "21";
  if (rate === BtwTarief.LAAG_9) return "9";
  return "0";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("nl-NL");
}

function buildCompanyDetails(companyProfile: { companyName: string; address: string; postalCode: string; city: string; kvkNumber?: string | null; iban?: string | null } | null) {
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

function buildQuotationUrl(quotationId: string) {
  return new URL(`/offertes/${quotationId}`, APP_BASE_URL).toString();
}

function mapQuotationToPdfData(
  quotation: Prisma.QuotationGetPayload<{ include: { client: true; lines: true; user: { include: { companyProfile: true } } } }>,
): InvoicePdfData {
  return {
    invoiceNum: quotation.quoteNum,
    date: formatDate(quotation.date),
    dueDate: formatDate(quotation.validUntil),
    client: {
      name: quotation.client.name,
      address: quotation.client.address,
      postalCode: quotation.client.postalCode,
      city: quotation.client.city,
    },
    companyProfile: quotation.user.companyProfile
      ? {
          companyName: quotation.user.companyProfile.companyName,
          address: quotation.user.companyProfile.address,
          postalCode: quotation.user.companyProfile.postalCode,
          city: quotation.user.companyProfile.city,
          kvkNumber: quotation.user.companyProfile.kvkNumber,
          btwNumber: quotation.user.companyProfile.btwNumber,
          iban: quotation.user.companyProfile.iban,
          bankName: quotation.user.companyProfile.bankName,
          logoUrl: quotation.user.companyProfile.logoUrl,
          email:
            quotation.user.companyProfile.emailReplyTo ??
            quotation.user.companyProfile.emailSenderName ??
            quotation.user.email,
          // Note: website is intentionally omitted from quotation PDFs
        }
      : null,
    lines: quotation.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vatRate: mapVatRateToString(line.vatRate),
    })),
  };
}

export async function getQuotations() {
  const { userId } = await requireTenantContext();

  try {
    return await prisma.quotation.findMany({
      where: { userId },
      include: { client: true, lines: true },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Kon offertes niet ophalen", error);
    return [];
  }
}

export async function createQuotation(values: QuotationFormValues) {
  "use server";

  const { userId } = await requireTenantContext();
  const data = quotationSchema.parse(values);

  const quotation = await prisma.$transaction(async (tx) => {
    const created = await tx.quotation.create({
      data: {
        userId,
        clientId: data.clientId,
        quoteNum: data.quoteNum,
        date: new Date(data.date),
        validUntil: new Date(data.validUntil),
        status: QuotationStatus.CONCEPT,
      },
    });

    await tx.quotationLine.createMany({
      data: data.lines.map((line) => ({
        quotationId: created.id,
        description: line.description,
        quantity: new Prisma.Decimal(line.quantity),
        price: new Prisma.Decimal(line.price),
        amount: new Prisma.Decimal(line.quantity * line.price),
        vatRate: mapVatRate(line.vat),
        unit: mapUnit(line.unit),
      })),
    });

    return created;
  });

  revalidatePath("/offertes");
  revalidatePath("/offertes/nieuw");
  return quotation;
}

export async function updateQuotationStatus(quotationId: string, status: "OPEN" | "GEACCEPTEERD" | "GEWEIGERD") {
  "use server";

  const { userId } = await requireTenantContext();
  const statusMap: Record<typeof status, QuotationStatus> = {
    OPEN: QuotationStatus.VERZONDEN,
    GEACCEPTEERD: QuotationStatus.GEACCEPTEERD,
    GEWEIGERD: QuotationStatus.AFGEWEZEN,
  };

  await prisma.quotation.updateMany({
    where: { id: quotationId, userId },
    data: { status: statusMap[status] },
  });

  revalidatePath("/offertes");
  revalidatePath(`/offertes/${quotationId}`);
}

export async function convertOfferteToInvoice(offerteId: string) {
  "use server";

  const { userId } = await requireTenantContext();

  try {
    const quotation = await prisma.quotation.findFirst({
      where: { id: offerteId, userId },
      include: { lines: true, client: true, user: { include: { companyProfile: true } }, convertedInvoice: true },
    });

    if (!quotation) {
      console.error("OFFERT_TO_FACTUUR_FAILED", {
        offerteId,
        companyId: userId,
        error: "Offerte niet gevonden",
      });
      return { success: false, message: "Offerte niet gevonden." };
    }

    // Check if invoice was already created from this offerte
    if (quotation.convertedInvoice) {
      console.log("OFFERT_TO_FACTUUR_SUCCESS", {
        offerteId,
        invoiceId: quotation.convertedInvoice.id,
        companyId: userId,
        note: "Already converted, returning existing invoice",
      });
      revalidatePath("/offertes");
      revalidatePath(`/offertes/${offerteId}`);
      revalidatePath("/facturen");
      revalidatePath(`/facturen/${quotation.convertedInvoice.id}`);
      return { success: true, invoiceId: quotation.convertedInvoice.id, alreadyConverted: true };
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          userId,
          clientId: quotation.clientId,
          invoiceNum: `INV-${quotation.quoteNum.replace(/^off[-]?/i, "")}`,
          date: new Date(),
          dueDate: quotation.validUntil,
          emailStatus: InvoiceEmailStatus.CONCEPT,
          convertedFromOfferteId: offerteId,
        },
      });

      await tx.invoiceLine.createMany({
        data: quotation.lines.map((line) => ({
          invoiceId: createdInvoice.id,
          description: line.description,
          quantity: line.quantity,
          price: line.price,
          amount: line.amount,
          vatRate: line.vatRate,
          unit: line.unit,
        })),
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: QuotationStatus.OMGEZET },
      });

      return createdInvoice;
    });

    console.log("OFFERT_TO_FACTUUR_SUCCESS", {
      offerteId,
      invoiceId: invoice.id,
      companyId: userId,
    });

    revalidatePath("/offertes");
    revalidatePath(`/offertes/${offerteId}`);
    revalidatePath("/facturen");
    revalidatePath(`/facturen/${invoice.id}`);

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error("OFFERT_TO_FACTUUR_FAILED", {
      offerteId,
      companyId: userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, message: "Omzetten naar factuur is mislukt. Probeer het opnieuw." };
  }
}

export async function convertToInvoice(quotationId: string) {
  /**
   * @deprecated Gebruik convertOfferteToInvoice voor nieuwe aanroepen.
   */
  return convertOfferteToInvoice(quotationId);
}

export async function deleteQuotation(quotationId: string) {
  const { userId } = await requireTenantContext();

  try {
    // Verify ownership of quotation before deleting lines
    await prisma.quotationLine.deleteMany({ 
      where: { 
        quotationId,
        quotation: { userId }
      } 
    });
    const deleted = await prisma.quotation.deleteMany({ where: { id: quotationId, userId } });

    if (deleted.count === 0) {
      return { success: false, message: "Offerte niet gevonden." };
    }

    revalidatePath("/offertes");
    return { success: true };
  } catch (error) {
    console.error("DELETE_QUOTATION_FAILED", { error, quotationId, userId });
    return { success: false, message: "Offerte verwijderen mislukt." };
  }
}

export async function duplicateQuotation(quotationId: string) {
  const { userId } = await requireTenantContext();

  const original = await prisma.quotation.findFirst({
    where: { id: quotationId, userId },
    include: { lines: true },
  });

  if (!original) {
    return { success: false, message: "Offerte niet gevonden." };
  }

  const copyQuoteNum = `${original.quoteNum}-kopie`;

  try {
    const duplicated = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          userId,
          clientId: original.clientId,
          quoteNum: copyQuoteNum,
          date: original.date,
          validUntil: original.validUntil,
          status: QuotationStatus.CONCEPT,
        },
      });

      await tx.quotationLine.createMany({
        data: original.lines.map((line) => ({
          quotationId: created.id,
          description: line.description,
          quantity: line.quantity,
          price: line.price,
          amount: line.amount,
          vatRate: line.vatRate,
          unit: line.unit,
        })),
      });

      return created;
    });

    revalidatePath("/offertes");
    revalidatePath(`/offertes/${duplicated.id}`);
    return { success: true, quotationId: duplicated.id };
  } catch (error) {
    console.error("DUPLICATE_QUOTATION_FAILED", { error, quotationId, userId });
    return { success: false, message: "Dupliceren mislukt." };
  }
}

export async function sendQuotationEmail(quotationId: string) {
  "use server";

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY ontbreekt");
    return { success: false, message: "E-mailservice is niet geconfigureerd." };
  }

  try {
    const { userId } = await requireTenantContext();
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, userId },
      include: { client: true, lines: true, user: { include: { companyProfile: true } } },
    });

    if (!quotation) {
      return { success: false, message: "Offerte niet gevonden." };
    }

    const pdfData = mapQuotationToPdfData(quotation);
    const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={pdfData} documentType="OFFERTE" />);
    const companyDetails = buildCompanyDetails(quotation.user.companyProfile);
    const viewUrl = buildQuotationUrl(quotation.id);
    const logoUrl = pdfData.companyProfile?.logoUrl;
    const trustedLogoUrl = (() => {
      if (!logoUrl) return undefined;
      try {
        const parsed = new URL(logoUrl);
        if (parsed.protocol !== "https:") return undefined;
        const hostname = parsed.hostname.toLowerCase();
        if (!ALLOWED_LOGO_HOSTS.includes(hostname)) return undefined;
        return parsed.toString();
      } catch {
        return undefined;
      }
    })();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = formatFromAddress();
    const subject = `Offerte ${pdfData.invoiceNum} van ${pdfData.companyProfile?.companyName ?? "ZZP HUB"}`;
    const result = await resend.emails.send({
      from: fromAddress,
      to: quotation.client.email,
      subject,
      react: (
        <QuotationEmail
          clientName={quotation.client.name}
          quotationNumber={pdfData.invoiceNum}
          viewUrl={viewUrl}
          companyName={pdfData.companyProfile?.companyName}
          companyDetails={companyDetails}
          logoUrl={trustedLogoUrl}
        />
      ),
      attachments: [
        {
          filename: `offerte-${pdfData.invoiceNum}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (result.error) {
      console.error("Verzenden van offerte e-mail mislukt", {
        error: result.error,
        quotationId,
        recipient: quotation.client.email,
      });
      return { success: false, message: "Het verzenden van de offerte is mislukt." };
    }

    logEmailSuccess(result.data?.id || "no-id", quotation.client.email, subject, fromAddress);

    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: QuotationStatus.VERZONDEN },
    });

    revalidatePath("/offertes");
    revalidatePath(`/offertes/${quotationId}`);

    return { success: true, recipient: quotation.client.email };
  } catch (error) {
    console.error("Versturen van offerte e-mail is mislukt", { error, quotationId });
    return { success: false, message: "Het verzenden van de offerte is mislukt." };
  }
}
