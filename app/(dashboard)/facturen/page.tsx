import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { mapInvoiceToPdfData, type InvoiceWithRelations } from "@/lib/pdf-generator";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatBedrag } from "@/lib/utils";
import { InvoiceActionsMenu } from "./_components/invoice-actions-menu";
import { InvoiceEmailStatus, Prisma, UserRole } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturen",
  description: "Beheer en verstuur facturen. Overzicht van alle openstaande en betaalde facturen.",
};

function statusInfo(status: InvoiceEmailStatus | string) {
  if (status === InvoiceEmailStatus.BETAALD) return { label: "Betaald", variant: "success" as const };
  if (status === InvoiceEmailStatus.CONCEPT) return { label: "Concept", variant: "muted" as const };
  if (status === InvoiceEmailStatus.HERINNERING) return { label: "Herinnering gestuurd", variant: "warning" as const };
  return { label: "Openstaand", variant: "primary" as const };
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
  let facturen: InvoiceWithRelations[] = [];
  let fetchError = false;

  try {
    facturen = await fetchInvoices();
  } catch (error) {
    console.error("Kon facturen niet ophalen", error);
    fetchError = true;
  }
  const mappedInvoices = facturen.map((factuur) => ({
    factuur,
    pdfInvoice: mapInvoiceToPdfData(factuur),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 rounded-3xl border border-[#123C37] bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] p-4 shadow-[0_28px_72px_-36px_rgba(12,94,87,0.78)]">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-14 rounded-full bg-white/35 shadow-[0_8px_20px_-12px_rgba(255,255,255,0.55)]" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Facturen</h1>
        </div>
        <p className="text-sm font-medium text-[#CFEDEA] max-w-2xl">
          Beheer facturen, verstuur herinneringen en volg betalingen met een strak, professioneel overzicht.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/facturen/nieuw"
          className={buttonVariants(
            "primary",
            "bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] text-white shadow-[0_20px_48px_-22px_rgba(15,94,87,0.88)] ring-1 ring-[#1FBF84]/45",
          )}
          data-tour="new-invoice-button"
        >
          Nieuwe factuur
        </Link>
        <Link
          href="/facturen/voorbeeld"
          className={buttonVariants(
            "ghost",
            "border-[#123C37] bg-[#0F2F2C] text-[#CFEDEA] hover:border-[#1FBF84]/45 hover:text-white shadow-[0_16px_44px_-28px_rgba(0,0,0,0.6)]",
          )}
        >
          Voorbeeld PDF
        </Link>
      </div>

      <Card className="p-4 sm:p-6 shadow-2xl border border-[#123C37] bg-gradient-to-br from-[#0F2F2C] via-[#123C37] to-[#0B4E48] text-[#CFEDEA]">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] shadow-[0_10px_26px_-18px_rgba(12,94,87,0.85)]" />
              Alle facturen
            </CardTitle>
            <Badge variant="primary" className="bg-[#0F2F2C] text-white border-[#1FBF84]/40 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.6)]">
              {facturen.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-[15px] text-[#CFEDEA]">
          {facturen.length === 0 ? (
            fetchError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#123C37] bg-[#0F2F2C]/70 px-6 py-10 text-center shadow-[0_18px_46px_-30px_rgba(0,0,0,0.6)]">
                <p className="text-lg font-semibold text-white">Facturen konden niet worden geladen</p>
                <p className="text-sm text-[#9FCBC4]">We konden de facturen niet ophalen. Probeer het later opnieuw.</p>
              </div>
            ) : (
              <EmptyState tone="dark" />
            )
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block divide-y divide-[#123C37]">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => {
                  const formattedDate = new Date(factuur.date).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedDueDate = new Date(factuur.dueDate).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={factuur.id}
                      className="flex items-center justify-between py-3.5 first:pt-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{factuur.invoiceNum}</p>
                        <p className="text-xs text-[#9FCBC4] mt-0.5 flex flex-wrap gap-3">
                          <span>Datum {formattedDate}</span>
                          <span className="text-[#F2B705] font-semibold">Vervalt {formattedDueDate}</span>
                        </p>
                        <p className="text-sm text-[#CFEDEA] mt-0.5">{factuur.client.name}</p>
                      </div>
                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-white">
                            {formatBedrag(invoiceAmount(factuur.lines))}
                          </p>
                          <p className="text-xs font-medium text-[#F2B705] mt-0.5">Vervalt {formattedDueDate}</p>
                        </div>
                        <Badge
                          variant={statusInfo(factuur.emailStatus).variant}
                          className="shadow-[0_12px_30px_-22px_rgba(0,0,0,0.6)] border-[#1FBF84]/40 bg-[#123C37] text-[#CFEDEA]"
                        >
                          {statusInfo(factuur.emailStatus).label}
                        </Badge>
                        <InvoiceActionsMenu
                          pdfInvoice={pdfInvoice}
                          invoiceId={factuur.id}
                          recipientEmail={factuur.client.email}
                          emailStatus={factuur.emailStatus}
                          editHref={`/facturen/${factuur.id}/edit`}
                          shareLink={`/facturen/${factuur.id}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-[#123C37]">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => {
                  const formattedDate = new Date(factuur.date).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedDueDate = new Date(factuur.dueDate).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={factuur.id}
                      className="py-3 first:pt-0"
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{factuur.invoiceNum}</p>
                          <p className="text-xs text-[#9FCBC4] mt-0.5">Datum {formattedDate}</p>
                          <p className="text-sm text-[#CFEDEA] mt-0.5">{factuur.client.name}</p>
                        </div>
                        <Badge
                          variant={statusInfo(factuur.emailStatus).variant}
                          className="border-[#1FBF84]/40 bg-[#123C37] text-[#CFEDEA] shadow-[0_12px_30px_-22px_rgba(0,0,0,0.6)]"
                        >
                          {statusInfo(factuur.emailStatus).label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#F2B705]">Vervalt {formattedDueDate}</p>
                        <p className="text-base font-semibold tabular-nums text-white">
                          {formatBedrag(invoiceAmount(factuur.lines))}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <InvoiceActionsMenu
                          pdfInvoice={pdfInvoice}
                          invoiceId={factuur.id}
                          recipientEmail={factuur.client.email}
                          emailStatus={factuur.emailStatus}
                          editHref={`/facturen/${factuur.id}/edit`}
                          shareLink={`/facturen/${factuur.id}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
