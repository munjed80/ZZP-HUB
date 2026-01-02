import Link from "next/link";
import { notFound } from "next/navigation";
import { BtwTarief, UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { calculateInvoiceTotals, type InvoicePdfData } from "@/components/pdf/InvoicePDF";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBedrag } from "@/lib/utils";
import { SendInvoiceEmailButton } from "./send-invoice-email-button";

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

async function getInvoiceWithRelations(id: string) {
  const { id: userId, role } = await requireUser();

  try {
    return await prisma.invoice.findFirst({
      where: role === UserRole.SUPERADMIN ? { id } : { id, userId },
      include: {
        client: true,
        lines: true,
        user: { include: { companyProfile: true } },
      },
    });
  } catch (error) {
    console.error("Kon factuur niet ophalen", error);
    return null;
  }
}

export default async function FactuurDetailPagina({ params }: PageProps) {
  const { id } = await params;
  const invoice = await getInvoiceWithRelations(id);
  if (!invoice) {
    notFound();
  }

  const pdfInvoice: InvoicePdfData = {
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

  const totals = calculateInvoiceTotals(pdfInvoice.lines);
  const statusValue = invoice?.emailStatus ?? "CONCEPT";
  const statusLabel =
    statusValue === "BETAALD"
      ? "Betaald"
      : statusValue === "HERINNERING"
        ? "Herinnering"
        : statusValue === "VERZONDEN"
          ? "Verzonden"
          : "Concept";
  const statusVariant =
    statusValue === "BETAALD"
      ? "success"
      : statusValue === "HERINNERING"
        ? "destructive"
        : statusValue === "VERZONDEN"
          ? "info"
          : "muted";

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/facturen" className="hover:text-slate-900">
          Facturen
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-slate-900">Factuur {pdfInvoice.invoiceNum}</span>
      </nav>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Factuur {pdfInvoice.invoiceNum}</h1>
          <p className="text-sm text-slate-600">
            Datum: {pdfInvoice.date} · Vervaldatum: {pdfInvoice.dueDate}
          </p>
          <p className="text-sm text-slate-600">Klant: {pdfInvoice.client.name}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {invoice ? (
            <SendInvoiceEmailButton invoiceId={invoice.id} recipientEmail={invoice.client.email} />
          ) : null}
          <InvoicePdfDownloadButton invoice={pdfInvoice} />
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Factuurdetails</CardTitle>
            <p className="text-sm text-slate-600">Bekijk factuurregels en bedrijfsgegevens.</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Klant</p>
              <p className="text-sm text-slate-700">{pdfInvoice.client.name}</p>
              <p className="text-sm text-slate-700">{pdfInvoice.client.address}</p>
              <p className="text-sm text-slate-700">
                {pdfInvoice.client.postalCode} {pdfInvoice.client.city}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Bedrijf</p>
              {pdfInvoice.companyProfile ? (
                <>
                  <p className="text-sm text-slate-700">{pdfInvoice.companyProfile.companyName}</p>
                  <p className="text-sm text-slate-700">{pdfInvoice.companyProfile.address}</p>
                  <p className="text-sm text-slate-700">
                    {pdfInvoice.companyProfile.postalCode} {pdfInvoice.companyProfile.city}
                  </p>
                  <p className="text-sm text-slate-700">KVK: {pdfInvoice.companyProfile.kvkNumber ?? "—"}</p>
                  <p className="text-sm text-slate-700">IBAN: {pdfInvoice.companyProfile.iban ?? "—"}</p>
                </>
              ) : (
                <p className="text-sm text-slate-700">Geen bedrijfsprofiel gevonden.</p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-6 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Omschrijving</span>
              <span className="text-center">Aantal</span>
              <span className="text-center">Eenheid</span>
              <span className="text-center">Prijs</span>
              <span className="text-center">BTW</span>
              <span className="text-right">Bedrag</span>
            </div>
            <div className="divide-y divide-slate-200">
              {pdfInvoice.lines.map((line, index) => {
                const lineTotal = line.quantity * line.price;
                return (
                  <div key={index} className="grid grid-cols-6 px-4 py-3 text-sm text-slate-800">
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

          <div className="flex flex-col items-end gap-1 text-sm text-slate-800">
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
              <span>Totaal te betalen</span>
              <span>{formatBedrag(totals.total)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Gelieve te betalen voor {pdfInvoice.dueDate} op rekening {pdfInvoice.companyProfile?.iban ?? "—"} t.n.v.{" "}
              {pdfInvoice.companyProfile?.companyName ?? "uw bedrijfsnaam"}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
