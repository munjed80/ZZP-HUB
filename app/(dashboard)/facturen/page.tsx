import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatBedrag } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
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

async function fetchInvoices() {
  const { id: userId, role } = await requireUser();
  const scope = role === UserRole.SUPERADMIN ? {} : { userId };

  return prisma.invoice.findMany({
    where: scope,
    include: { client: true, lines: true },
    orderBy: { date: "desc" },
  });
}

export default async function FacturenPagina() {
  const facturen = await fetchInvoices();

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
                {facturen.map((factuur) => (
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
                    <div className="flex items-center gap-3">
                      <Badge variant={statusVariant(invoiceStatus(factuur.emailStatus))}>
                        {invoiceStatus(factuur.emailStatus)}
                      </Badge>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatBedrag(invoiceAmount(factuur.lines))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {facturen.map((factuur) => (
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
