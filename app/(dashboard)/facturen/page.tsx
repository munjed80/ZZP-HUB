import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { mapInvoiceToPdfData, type InvoiceWithRelations } from "@/lib/pdf-generator";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { InvoiceList } from "./_components/invoice-list";
import { InvoiceEmailStatus, Prisma, UserRole } from "@prisma/client";
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
    let status: "paid" | "concept" | "open";
    if (isPaid) {
      status = "paid";
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
    const isOverdue = !isPaid && new Date(factuur.dueDate) < now;

    return {
      id: factuur.id,
      invoiceNum: factuur.invoiceNum,
      clientName: factuur.client.name,
      status,
      amount: invoiceAmount(factuur.lines),
      pdfInvoice: mapInvoiceToPdfData(factuur),
      formattedDate,
      formattedDueDate,
      isPaid,
      paidDateLabel,
      dueToneClass: isOverdue ? "text-[#D8A446]" : "text-[#A8E6DB]",
      dueLabel: isOverdue ? "Te laat ·" : "Vervalt",
    };
  });

  return (
    <div className="space-y-6 bg-[#F9FAFB] text-[#111827]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Facturen</h1>
          <p className="text-sm text-[#6B7280]">
            Beheer facturen, volg betalingen en houd alles overzichtelijk bij.
          </p>
        </div>
        <Link
          href="/facturen/nieuw"
          className={buttonVariants(
            "primary",
            "bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 text-white border-indigo-500 shadow-[0_14px_32px_-18px_rgba(79,70,229,0.35)] hover:shadow-[0_16px_40px_-18px_rgba(79,70,229,0.45)]",
          )}
          data-tour="new-invoice-button"
        >
          Nieuwe factuur
        </Link>
      </div>

      <Card className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-[#111827]">Alle facturen</CardTitle>
            <Badge
              variant="muted"
              className="rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-[#111827] shadow-none"
            >
              {facturen.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-[15px] text-[#111827]">
          {facturen.length === 0 ? (
            fetchError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-[#F9FAFB] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-[#111827]">Facturen konden niet worden geladen</p>
                <p className="text-sm text-[#6B7280]">We konden de facturen niet ophalen. Probeer het later opnieuw.</p>
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
