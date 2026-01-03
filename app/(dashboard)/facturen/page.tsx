import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { mapInvoiceToPdfData, type InvoiceWithRelations } from "@/lib/pdf-generator";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatBedrag } from "@/lib/utils";
import { SendInvoiceEmailButton } from "./[id]/send-invoice-email-button";
import { Prisma, UserRole } from "@prisma/client";

function InvoiceActionsMenu({
  pdfInvoice,
  invoiceId,
  recipientEmail,
}: {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  recipientEmail: string;
}) {
  return (
    <details className="relative inline-block">
      <summary
        className={buttonVariants("secondary", "cursor-pointer list-none px-3 py-2")}
        role="button"
        aria-label="Acties"
        style={{ listStyle: "none" }}
      >
        Acties
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col gap-2 p-2">
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Download PDF"
            className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800"
          />
          <SendInvoiceEmailButton
            invoiceId={invoiceId}
            recipientEmail={recipientEmail}
            className="w-full justify-center"
          />
        </div>
      </div>
    </details>
  );
}

function statusVariant(status: string) {
  if (status === "Betaald" || status === "Geaccepteerd") return "success" as const;
  if (status === "Open" || status === "Verzonden") return "info" as const;
  if (status === "Concept") return "muted" as const;
  return "destructive" as const;
}

function invoiceStatus(status: string) {
  if (status === "BETAALD") return "Betaald";
  if (status === "VERZONDEN") return "Verzonden";
  if (status === "HERINNERING") return "Herinnering";
  return "Concept";
}

function invoiceAmount(
  lines: { amount: Prisma.Decimal | number | null; quantity: Prisma.Decimal | number; price: Prisma.Decimal | number }[],
) {
  return lines.reduce((total, line) => {
    if (line.amount !== null && line.amount !== undefined) {
      return total + Number(line.amount);
    }
    return total + Number(line.quantity) * Number(line.price);
  }, 0);
}

async function fetchInvoices(): Promise<InvoiceWithRelations[]> {
  const { id: userId, role } = await requireUser();
  const scope = role === UserRole.SUPERADMIN ? {} : { userId };

  return prisma.invoice.findMany({
    where: scope,
    include: { client: true, lines: true, user: { include: { companyProfile: true } } },
    orderBy: { date: "desc" },
  });
}

export default async function FacturenPagina() {
  const facturen = await fetchInvoices();
  const mappedInvoices = facturen.map((factuur) => ({
    factuur,
    pdfInvoice: mapInvoiceToPdfData(factuur),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Facturen</h1>
        <p className="text-sm text-slate-600">
          Beheer openstaande facturen, verstuur herinneringen en volg betalingen. BTW 21%, 9%, 0% en verlegd worden ondersteund.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/facturen/nieuw" className={buttonVariants("primary")}>
            Nieuwe factuur (concept)
          </Link>
          <Link href="/facturen/voorbeeld" className={buttonVariants("secondary")}>
            Voorbeeld weergave / PDF
          </Link>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Laatste facturen</CardTitle>
          <Badge variant="info">{facturen.length} items</Badge>
        </CardHeader>
        <CardContent>
          {facturen.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block divide-y divide-slate-200">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => (
                  <div
                    key={factuur.id}
                    className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{factuur.invoiceNum}</p>
                      <p className="text-sm text-slate-600">{factuur.client.name}</p>
                      <p className="text-xs text-slate-500">
                        Vervaldatum: {new Date(factuur.dueDate).toLocaleDateString("nl-NL")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant(invoiceStatus(factuur.emailStatus))}>
                          {invoiceStatus(factuur.emailStatus)}
                        </Badge>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBedrag(invoiceAmount(factuur.lines))}
                        </p>
                      </div>
                      <InvoiceActionsMenu
                        pdfInvoice={pdfInvoice}
                        invoiceId={factuur.id}
                        recipientEmail={factuur.client.email}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => (
                  <div
                    key={factuur.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{factuur.invoiceNum}</p>
                        <p className="text-sm text-slate-600 mt-1">{factuur.client.name}</p>
                      </div>
                      <Badge variant={statusVariant(invoiceStatus(factuur.emailStatus))}>
                        {invoiceStatus(factuur.emailStatus)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Vervalt: {new Date(factuur.dueDate).toLocaleDateString("nl-NL")}
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatBedrag(invoiceAmount(factuur.lines))}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-3">
                      <InvoiceActionsMenu
                        pdfInvoice={pdfInvoice}
                        invoiceId={factuur.id}
                        recipientEmail={factuur.client.email}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
