import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatBedrag } from "@/lib/utils";
import { getQuotations } from "./actions";
import { QuotationActionsMenu } from "./_components/quotation-actions-menu";
import { type InvoicePdfData } from "@/components/pdf/InvoicePDF";
import { ExportButton } from "@/components/ui/export-button";
import { requireOwnerPage } from "@/lib/auth/route-guards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offertes",
  description: "Maak en beheer offertes. Converteer geaccepteerde offertes naar facturen.",
};

function statusVariant(status: string) {
  if (status === "GEACCEPTEERD" || status === "OMGEZET") return "success" as const;
  if (status === "AFGEWEZEN") return "destructive" as const;
  if (status === "VERZONDEN" || status === "OPEN") return "info" as const;
  return "muted" as const;
}

function statusLabel(status: string) {
  if (status === "GEACCEPTEERD") return "Geaccepteerd";
  if (status === "OMGEZET") return "Omgezet";
  if (status === "AFGEWEZEN") return "Geweigerd";
  if (status === "VERZONDEN") return "Open";
  return "Concept";
}

function mapQuotationToPdfData(offerte: Awaited<ReturnType<typeof getQuotations>>[number]): InvoicePdfData {
  return {
    invoiceNum: offerte.quoteNum,
    date: new Date(offerte.date).toLocaleDateString("nl-NL"),
    dueDate: new Date(offerte.validUntil).toLocaleDateString("nl-NL"),
    client: {
      name: offerte.client?.name ?? "",
      address: offerte.client?.address ?? "",
      postalCode: offerte.client?.postalCode ?? "",
      city: offerte.client?.city ?? "",
    },
    companyProfile: null,
    lines: offerte.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      price: Number(line.price),
      vatRate: line.vatRate === "HOOG_21" ? "21" : line.vatRate === "LAAG_9" ? "9" : "0",
    })),
  };
}

export default async function OffertesPagina() {
  // Owner-only page guard
  await requireOwnerPage();
  
  const offertes = await getQuotations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Offertes</h1>
            <p className="text-sm text-muted-foreground">
              Maak offertes, verstuur per mail en zet geaccepteerde offertes om naar facturen.
            </p>
          </div>
          <Link href="/offertes/nieuw" className={buttonVariants("primary")}>
            <Plus className="h-4 w-4" aria-hidden />
            Nieuwe offerte
          </Link>
        </div>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardHeader className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" aria-hidden />
            <CardTitle>Laatste offertes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Converteren naar factuur</Badge>
            <ExportButton resource="quotations" />
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {offertes.length === 0 ? (
            <EmptyState />
          ) : (
             offertes.map((offerte) => {
               const pdfQuotation = mapQuotationToPdfData(offerte);
               const totalAmount = offerte.lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);

               return (
                 <div
                   key={offerte.id}
                   className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                 >
                   <div className="space-y-1">
                     <Link href={`/offertes/${offerte.id}`} className="text-sm font-semibold text-foreground hover:underline">
                       {offerte.quoteNum}
                     </Link>
                     <p className="text-sm text-muted-foreground">{offerte.client?.name}</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-2">
                     <Badge variant={statusVariant(offerte.status)}>{statusLabel(offerte.status)}</Badge>
                     <p className="text-sm font-semibold text-foreground">
                       {formatBedrag(totalAmount)}
                     </p>
                     <QuotationActionsMenu
                       pdfQuotation={pdfQuotation}
                       quotationId={offerte.id}
                       recipientEmail={offerte.client?.email ?? ""}
                       shareLink={`/offertes/${offerte.id}`}
                     />
                   </div>
                 </div>
               );
             })
           )}
        </CardContent>
      </Card>
    </div>
  );
}
