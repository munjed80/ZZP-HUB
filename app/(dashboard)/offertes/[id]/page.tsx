import Link from "next/link";
import { notFound } from "next/navigation";
import { BtwTarief } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { calculateInvoiceTotals, type InvoicePdfData } from "@/components/pdf/InvoicePDF";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import { formatBedrag } from "@/lib/utils";
import { ConvertQuotationButton } from "./convert-quotation-button";
import { SendQuotationEmailButton } from "./send-quotation-email-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function mapVatRate(rate: BtwTarief): "21" | "9" | "0" {
  if (rate === "HOOG_21") return "21";
  if (rate === "LAAG_9") return "9";
  return "0";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("nl-NL");
}

async function getQuotationWithRelations(id: string) {
  const { userId } = await requireTenantContext();

  try {
    return await prisma.quotation.findFirst({
      where: { id, userId },
      include: {
        client: true,
        lines: true,
        user: { include: { companyProfile: true } },
      },
    });
  } catch (error) {
    console.error("Kon offerte niet ophalen", error);
    return null;
  }
}

export default async function OfferteDetailPagina({ params }: PageProps) {
  const { id } = await params;
  const quotation = await getQuotationWithRelations(id);

  if (!quotation) {
    notFound();
  }

  const pdfQuotation: InvoicePdfData = {
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
          iban: quotation.user.companyProfile.iban,
          logoUrl: quotation.user.companyProfile.logoUrl,
        }
      : null,
    lines: quotation.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vatRate: mapVatRate(line.vatRate),
    })),
  };

  const totals = calculateInvoiceTotals(pdfQuotation.lines);
  const statusValue = quotation.status;
  const statusLabel =
    statusValue === "GEACCEPTEERD"
      ? "Geaccepteerd"
      : statusValue === "OMGEZET"
        ? "Omgezet"
      : statusValue === "AFGEWEZEN"
        ? "Geweigerd"
    : statusValue === "VERZONDEN"
      ? "Open"
      : "Concept";
  const statusVariant =
    statusValue === "GEACCEPTEERD"
      ? "success"
      : statusValue === "OMGEZET"
        ? "success"
      : statusValue === "AFGEWEZEN"
        ? "destructive"
        : statusValue === "VERZONDEN"
          ? "info"
          : "muted";

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/offertes" className="hover:text-foreground">
          Offertes
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-foreground">Offerte {pdfQuotation.invoiceNum}</span>
      </nav>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offerte {pdfQuotation.invoiceNum}</h1>
          <p className="text-sm text-muted-foreground">
            Datum: {pdfQuotation.date} · Geldig tot: {pdfQuotation.dueDate}
          </p>
          <p className="text-sm text-muted-foreground">Klant: {pdfQuotation.client.name}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SendQuotationEmailButton quotationId={quotation.id} recipientEmail={quotation.client.email} />
          <ConvertQuotationButton quotationId={quotation.id} />
          <InvoicePdfDownloadButton
            invoice={pdfQuotation}
            documentType="OFFERTE"
            fileName={`offerte-${pdfQuotation.invoiceNum}.pdf`}
          />
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Offertedetails</CardTitle>
            <p className="text-sm text-muted-foreground">Bekijk offerteregels en bedrijfsgegevens.</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-foreground">Klant</p>
              <p className="text-sm text-muted-foreground">{pdfQuotation.client.name}</p>
              <p className="text-sm text-muted-foreground">{pdfQuotation.client.address}</p>
              <p className="text-sm text-muted-foreground">
                {pdfQuotation.client.postalCode} {pdfQuotation.client.city}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-foreground">Bedrijf</p>
              {pdfQuotation.companyProfile ? (
                <>
                  <p className="text-sm text-muted-foreground">{pdfQuotation.companyProfile.companyName}</p>
                  <p className="text-sm text-muted-foreground">{pdfQuotation.companyProfile.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {pdfQuotation.companyProfile.postalCode} {pdfQuotation.companyProfile.city}
                  </p>
                  <p className="text-sm text-muted-foreground">KVK: {pdfQuotation.companyProfile.kvkNumber ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">IBAN: {pdfQuotation.companyProfile.iban ?? "—"}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Geen bedrijfsprofiel gevonden.</p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-6 bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Omschrijving</span>
              <span className="text-center">Aantal</span>
              <span className="text-center">Eenheid</span>
              <span className="text-center">Prijs</span>
              <span className="text-center">BTW</span>
              <span className="text-right">Bedrag</span>
            </div>
            <div className="divide-y divide-border">
              {pdfQuotation.lines.map((line, index) => {
                const lineTotal = line.quantity * line.price;
                return (
                  <div key={index} className="grid grid-cols-6 px-4 py-3 text-sm text-foreground">
                    <span className="pr-4">{line.description}</span>
                    <span className="text-center">{line.quantity}</span>
                    <span className="text-center">{line.unit}</span>
                    <span className="text-center">{formatBedrag(line.price)}</span>
                    <span className="text-center">{line.vatRate}%</span>
                    <span className="text-right font-semibold">{formatBedrag(lineTotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-sm text-foreground">
            <div className="flex w-full max-w-md items-center justify-between">
              <span>Subtotaal (excl. BTW)</span>
              <span className="font-semibold">{formatBedrag(totals.subtotal)}</span>
            </div>
            <div className="flex w-full max-w-md items-center justify-between">
              <span>BTW Hoog (21%)</span>
              <span className="font-semibold">{formatBedrag(totals.vatHigh)}</span>
            </div>
            <div className="flex w-full max-w-md items-center justify-between">
              <span>BTW Laag (9%)</span>
              <span className="font-semibold">{formatBedrag(totals.vatLow)}</span>
            </div>
            <div className="flex w-full max-w-md items-center justify-between text-base font-bold">
              <span>Totaal</span>
              <span>{formatBedrag(totals.total)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Geldig tot {pdfQuotation.dueDate}. Bij akkoord kunnen we direct een factuur opmaken.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
