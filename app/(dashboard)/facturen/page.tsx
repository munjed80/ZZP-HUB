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
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-primary/90 via-accent/90 to-success/80 shadow-[0_6px_18px_-10px_rgba(16,185,129,0.55)]" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturen</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium max-w-2xl">
          Beheer facturen, verstuur herinneringen en volg betalingen met een strak, professioneel overzicht.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/facturen/nieuw"
          className={buttonVariants("primary", "shadow-[0_18px_40px_-20px_rgba(16,185,129,0.55)]")}
          data-tour="new-invoice-button"
        >
          Nieuwe factuur
        </Link>
        <Link href="/facturen/voorbeeld" className={buttonVariants("ghost", "border-border/70 bg-card/60")}>
          Voorbeeld PDF
        </Link>
      </div>

      <Card className="p-4 sm:p-6 shadow-xl border border-border/80 bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-primary via-accent to-success" />
              Alle facturen
            </CardTitle>
            <Badge variant="primary">{facturen.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-[15px] text-card-foreground">
          {facturen.length === 0 ? (
            fetchError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <p className="text-lg font-semibold text-foreground">Facturen konden niet worden geladen</p>
                <p className="text-sm text-muted-foreground">We konden de facturen niet ophalen. Probeer het later opnieuw.</p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block divide-y divide-border">
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
                        <p className="text-sm font-medium text-foreground">{factuur.invoiceNum}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-3">
                          <span>Datum {formattedDate}</span>
                          <span className="text-warning-foreground font-semibold">Vervalt {formattedDueDate}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{factuur.client.name}</p>
                      </div>
                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatBedrag(invoiceAmount(factuur.lines))}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">Vervalt {formattedDueDate}</p>
                        </div>
                        <Badge variant={statusInfo(factuur.emailStatus).variant} className="shadow-md">
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
              <div className="block md:hidden divide-y divide-border">
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
                          <p className="text-sm font-medium text-foreground">{factuur.invoiceNum}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Datum {formattedDate}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{factuur.client.name}</p>
                        </div>
                        <Badge variant={statusInfo(factuur.emailStatus).variant}>
                          {statusInfo(factuur.emailStatus).label}
                        </Badge>
                      </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">Vervalt {formattedDueDate}</p>
                          <p className="text-base font-semibold tabular-nums text-foreground">
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
