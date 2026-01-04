"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MessageCircle, Share2, Undo2 } from "lucide-react";
import { InvoiceEmailStatus } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { SendInvoiceEmailButton } from "../[id]/send-invoice-email-button";
import { markAsPaid, markAsUnpaid } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { calculateInvoiceTotals } from "@/components/pdf/InvoicePDF";
import { formatBedrag } from "@/lib/utils";

type Props = {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  recipientEmail: string;
  emailStatus: InvoiceEmailStatus;
};

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, recipientEmail, emailStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsPaid = () => {
    startTransition(async () => {
      const result = await markAsPaid(invoiceId);
      if (result?.success) {
        toast.success("Factuur gemarkeerd als betaald");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Markeren als betaald is mislukt.");
      }
    });
  };

  const handleMarkAsUnpaid = () => {
    const confirmed = window.confirm("Weet je zeker dat je deze factuur wilt terugzetten naar onbetaald?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await markAsUnpaid(invoiceId);
      if (result?.success) {
        toast.success("Factuur teruggezet naar onbetaald");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Ongedaan maken mislukt.");
      }
    });
  };

  const handleShareWhatsApp = () => {
    const totals = calculateInvoiceTotals(pdfInvoice.lines);
    const companyName = pdfInvoice.companyProfile?.companyName ?? "ZZP HUB";
    const message = `Factuur ${pdfInvoice.invoiceNum} van ${companyName}. Totaal: ${formatBedrag(
      totals.total,
    )}. Verstuurd via ZZP HUB.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <details className="relative inline-block" open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
      <summary
        className={buttonVariants("secondary", "cursor-pointer list-none px-3 py-2")}
        role="button"
        aria-label="Open deelopties"
        style={{ listStyle: "none" }}
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Delen
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg shadow-teal-100/60">
        <div className="flex flex-col gap-2 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Deel factuur</p>
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Download PDF"
            className="w-full justify-start"
            variant="secondary"
          />
          <SendInvoiceEmailButton
            invoiceId={invoiceId}
            recipientEmail={recipientEmail}
            className="w-full justify-start"
            variant="secondary"
            label="Verstuur via e-mail"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareWhatsApp}
            className="w-full justify-start gap-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
        </div>
        <div className="border-t border-slate-200 p-3">
          {emailStatus !== InvoiceEmailStatus.BETAALD ? (
            <Button
              type="button"
              onClick={handleMarkAsPaid}
              disabled={isPending}
              className="w-full justify-center gap-2"
              variant="primary"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isPending ? "Markeren..." : "Markeer als betaald"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleMarkAsUnpaid}
              disabled={isPending}
              className="w-full justify-center gap-2"
              variant="destructive"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              {isPending ? "Bezig..." : "Terug naar onbetaald"}
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
