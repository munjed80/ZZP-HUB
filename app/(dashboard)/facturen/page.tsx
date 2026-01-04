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
import { Prisma, UserRole } from "@prisma/client";

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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Facturen</h1>
        <p className="text-sm text-slate-600 mt-1">
          Beheer facturen, verstuur herinneringen en volg betalingen
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/facturen/nieuw" className={buttonVariants("primary")}>
          Nieuwe factuur
        </Link>
        <Link href="/facturen/voorbeeld" className={buttonVariants("ghost")}>
          Voorbeeld PDF
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-900">Alle facturen</CardTitle>
            <Badge variant="muted">{facturen.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {facturen.length === 0 ? (
            fetchError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                <p className="text-lg font-semibold text-slate-900">Facturen konden niet worden geladen</p>
                <p className="text-sm text-slate-600">We konden de facturen niet ophalen. Probeer het later opnieuw.</p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block divide-y divide-slate-100">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => (
                  <div
                    key={factuur.id}
                    className="flex items-center justify-between py-4 first:pt-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{factuur.invoiceNum}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{factuur.client.name}</p>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatBedrag(invoiceAmount(factuur.lines))}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Vervalt {new Date(factuur.dueDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Badge variant={statusVariant(invoiceStatus(factuur.emailStatus))}>
                        {invoiceStatus(factuur.emailStatus)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {factuur.emailStatus === "CONCEPT" && (
                          <Link href={`/facturen/${factuur.id}/edit`} className={buttonVariants("ghost", "h-9 px-3")}>
                            Bewerken
                          </Link>
                        )}
                        <InvoiceActionsMenu
                          pdfInvoice={pdfInvoice}
                          invoiceId={factuur.id}
                          recipientEmail={factuur.client.email}
                          emailStatus={factuur.emailStatus}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {mappedInvoices.map(({ factuur, pdfInvoice }) => (
                  <div
                    key={factuur.id}
                    className="py-4 first:pt-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{factuur.invoiceNum}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{factuur.client.name}</p>
                      </div>
                      <Badge variant={statusVariant(invoiceStatus(factuur.emailStatus))}>
                        {invoiceStatus(factuur.emailStatus)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Vervalt {new Date(factuur.dueDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-base font-semibold tabular-nums text-slate-900">
                        {formatBedrag(invoiceAmount(factuur.lines))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {factuur.emailStatus === "CONCEPT" && (
                        <Link href={`/facturen/${factuur.id}/edit`} className={buttonVariants("ghost", "h-9 px-3")}>
                          Bewerken
                        </Link>
                      )}
                      <InvoiceActionsMenu
                        pdfInvoice={pdfInvoice}
                        invoiceId={factuur.id}
                        recipientEmail={factuur.client.email}
                        emailStatus={factuur.emailStatus}
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
