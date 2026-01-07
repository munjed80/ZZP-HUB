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
    <div className="space-y-8">
      <div className="flex flex-col gap-2 rounded-3xl border border-[#124D48] bg-gradient-to-r from-[#0F7E78] via-[#0FA9A3] to-[#0B6A70] p-4 shadow-[0_28px_72px_-32px_rgba(12,140,135,0.7)]">
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

       <Card className="p-4 sm:p-6 shadow-2xl border border-[#124D48]/70 bg-gradient-to-br from-[#0F3E42] via-[#0F5655] to-[#0A3B40] text-[#E4F7F3]">
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
             <InvoiceList invoices={mappedInvoices} />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
