"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, CheckCircle2, XCircle, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { approveDraft, rejectDraft, deleteDraft } from "./actions";
import { formatBedrag } from "@/lib/utils";
import type { BtwTarief, DraftStatus } from "@prisma/client";

interface DraftExpense {
  id: string;
  description: string;
  category: string;
  amountExcl: number;
  vatRate: BtwTarief;
  date: string;
  receiptUrl: string | null;
  status: DraftStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface DraftsClientProps {
  drafts: DraftExpense[];
  errorMessage?: string;
}

const vatPercentages: Record<BtwTarief, number> = {
  HOOG_21: 0.21,
  LAAG_9: 0.09,
  NUL_0: 0,
  VRIJGESTELD: 0,
  VERLEGD: 0,
};

const vatLabels: Record<BtwTarief, string> = {
  HOOG_21: "21%",
  LAAG_9: "9%",
  NUL_0: "0%",
  VRIJGESTELD: "Vrijgesteld",
  VERLEGD: "Verlegd",
};

const statusLabels: Record<DraftStatus, string> = {
  DRAFT: "Concept",
  PENDING_REVIEW: "Wacht op goedkeuring",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

const statusColors: Record<DraftStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function calculateTotal(amountExcl: number, vatRate: BtwTarief) {
  const vatAmount = amountExcl * (vatPercentages[vatRate] ?? 0);
  return amountExcl + vatAmount;
}

export function DraftsClient({ drafts, errorMessage }: DraftsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (draftId: string) => {
    setProcessingId(draftId);
    startTransition(async () => {
      try {
        const result = await approveDraft(draftId);
        if (result.success) {
          toast.success("Uitgave goedgekeurd!");
          router.refresh();
        }
      } catch (error) {
        console.error("Approve error:", error);
        toast.error(error instanceof Error ? error.message : "Goedkeuren mislukt");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleReject = async (draftId: string) => {
    setProcessingId(draftId);
    startTransition(async () => {
      try {
        const result = await rejectDraft(draftId);
        if (result.success) {
          toast.success("Uitgave afgekeurd");
          router.refresh();
        }
      } catch (error) {
        console.error("Reject error:", error);
        toast.error(error instanceof Error ? error.message : "Afkeuren mislukt");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm("Weet je zeker dat je dit concept wilt verwijderen?")) return;

    setProcessingId(draftId);
    startTransition(async () => {
      try {
        const result = await deleteDraft(draftId);
        if (result.success) {
          toast.success("Concept verwijderd");
          router.refresh();
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error instanceof Error ? error.message : "Verwijderen mislukt");
      } finally {
        setProcessingId(null);
      }
    });
  };

  if (errorMessage) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-destructive">
              <p className="font-medium">Fout bij laden van concepten</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Concepten</h1>
          <p className="text-muted-foreground">
            Gescande ontvangstbewijzen die wachten op goedkeuring
          </p>
        </div>
        <Button onClick={() => router.push("/upload")}>
          <Upload className="w-4 h-4 mr-2" />
          Upload nieuw
        </Button>
      </div>

      {drafts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Geen concepten"
          description="Upload ontvangstbewijzen om concepten te maken die je kunt goedkeuren."
          action={{
            label: "Upload ontvangstbewijs",
            onClick: () => router.push("/upload"),
          }}
        />
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const total = calculateTotal(draft.amountExcl, draft.vatRate);
            const isProcessing = processingId === draft.id;

            return (
              <Card key={draft.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{draft.description}</h3>
                        <Badge className={statusColors[draft.status]}>
                          {statusLabels[draft.status]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Categorie:</span>
                          <p className="font-medium">{draft.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Datum:</span>
                          <p className="font-medium">{formatDate(draft.date)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bedrag (excl.):</span>
                          <p className="font-medium">{formatBedrag(draft.amountExcl)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Totaal (incl. BTW):</span>
                          <p className="font-medium">{formatBedrag(total)}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        BTW: {vatLabels[draft.vatRate]}
                        {draft.receiptUrl && (
                          <span className="ml-3">📎 Bijlage beschikbaar</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {draft.status === "DRAFT" || draft.status === "PENDING_REVIEW" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(draft.id)}
                            disabled={isProcessing || isPending}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            Goedkeuren
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(draft.id)}
                            disabled={isProcessing || isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Afkeuren
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(draft.id)}
                            disabled={isProcessing || isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(draft.id)}
                          disabled={isProcessing || isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Verwijderen
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
