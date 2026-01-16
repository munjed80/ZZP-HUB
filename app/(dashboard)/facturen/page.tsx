import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { mapInvoiceToPdfData, type InvoiceWithRelations } from "@/lib/pdf-generator";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";
import { InvoiceList } from "./_components/invoice-list";
import { InvoiceEmailStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturen",
  description: "Beheer en verstuur facturen. Overzicht van alle openstaande en betaalde facturen.",
};

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
  // Facturen page is NOT an admin page - always scope by tenant
  const { userId } = await requireTenantContext();

  return prisma.invoice.findMany({
    where: { userId },
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
  const now = new Date();
  const mappedInvoices = facturen.map((factuur) => {
    const formattedDate = new Date(factuur.date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedDueDate = new Date(factuur.dueDate).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    });
    const isPaid = factuur.emailStatus === InvoiceEmailStatus.BETAALD;
    const isOverdue = !isPaid && factuur.emailStatus !== InvoiceEmailStatus.CONCEPT && new Date(factuur.dueDate) < now;
    
    // Determine status: paid > overdue > open > concept
    let status: "paid" | "concept" | "open" | "overdue";
    if (isPaid) {
      status = "paid";
    } else if (isOverdue) {
      status = "overdue";
    } else if (factuur.emailStatus === InvoiceEmailStatus.CONCEPT) {
      status = "concept";
    } else {
      status = "open";
    }
    const paidDateLabel = isPaid
      ? new Date(factuur.updatedAt ?? factuur.date).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

    return {
      id: factuur.id,
      invoiceNum: factuur.invoiceNum,
      clientName: factuur.client.name,
      status,
      amount: invoiceAmount(factuur.lines),
      pdfInvoice: mapInvoiceToPdfData(factuur),
      recipientEmail: factuur.client.email,
      formattedDate,
      formattedDueDate,
      isPaid,
      paidDateLabel,
      dueToneClass: isOverdue ? "text-[#D8A446]" : "text-[#A8E6DB]",
      dueLabel: isOverdue ? "Te laat ·" : "Vervalt",
      isOverdue,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Facturen</h1>
          <p className="text-sm text-muted-foreground">
            Beheer facturen, volg betalingen en houd alles overzichtelijk bij.
          </p>
        </div>
        <Link
          href="/facturen/nieuw"
          className={buttonVariants(
            "primary",
            "bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 text-white border-emerald-600 shadow-[0_14px_32px_-18px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_40px_-18px_rgba(16,185,129,0.5)]",
          )}
          data-tour="new-invoice-button"
        >
          Nieuwe factuur
        </Link>
      </div>

      <Card className="border border-border bg-card p-4 shadow-sm sm:p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Alle facturen</CardTitle>
            <Badge
              variant="muted"
              className="rounded-full border border-border bg-muted text-xs font-semibold text-foreground shadow-none"
            >
              {facturen.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-[15px] text-foreground">
          {facturen.length === 0 ? (
            fetchError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted px-6 py-10 text-center">
                <p className="text-lg font-semibold text-foreground">Facturen konden niet worden geladen</p>
                <p className="text-sm text-muted-foreground">We konden de facturen niet ophalen. Probeer het later opnieuw.</p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <InvoiceList invoices={mappedInvoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
