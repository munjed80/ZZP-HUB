import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatBedrag } from "@/lib/utils";
import { getQuotations } from "./actions";
import { ConvertQuotationButton } from "./[id]/convert-quotation-button";

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

export default async function OffertesPagina() {
  const offertes = await getQuotations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Offertes</h1>
            <p className="text-sm text-slate-600">
              Maak offertes, verstuur per mail en zet geaccepteerde offertes om naar facturen.
            </p>
          </div>
          <Link href="/offertes/nieuw" className={buttonVariants("primary")}>
            <Plus className="h-4 w-4" aria-hidden />
            Nieuwe offerte
          </Link>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Laatste offertes</CardTitle>
          </div>
          <Badge variant="warning">Converteren naar factuur</Badge>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200">
          {offertes.length === 0 ? (
            <EmptyState />
          ) : (
            offertes.map((offerte) => (
              <div
                key={offerte.id}
                className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <Link href={`/offertes/${offerte.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
                    {offerte.quoteNum}
                  </Link>
                  <p className="text-sm text-slate-600">{offerte.client?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(offerte.status)}>{statusLabel(offerte.status)}</Badge>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatBedrag(
                      offerte.lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0),
                    )}
                  </p>
                  <ConvertQuotationButton quotationId={offerte.id} />
                  <Link
                    href={`/offertes/${offerte.id}`}
                    className={buttonVariants("secondary", "px-3 py-1 text-xs")}
                  >
                    Bekijk
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
