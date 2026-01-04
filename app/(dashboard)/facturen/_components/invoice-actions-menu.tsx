"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Edit3,
  FileDown,
  Loader2,
  Mail,
  MessageCircle,
  MoreVertical,
  Trash2,
  Undo2,
} from "lucide-react";
import { InvoiceEmailStatus } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { SendInvoiceEmailButton } from "../[id]/send-invoice-email-button";
import { deleteInvoice, markAsPaid, markAsUnpaid } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { calculateInvoiceTotals } from "@/components/pdf/InvoicePDF";
import { formatBedrag } from "@/lib/utils";

type Props = {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  recipientEmail: string;
  emailStatus: InvoiceEmailStatus;
  editHref?: string;
  shareLink?: string;
};

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, recipientEmail, emailStatus, editHref, shareLink }: Props) {
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

  const handleDelete = () => {
    const confirmed = window.confirm("Weet je zeker dat je deze factuur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.success) {
        toast.success("Factuur verwijderd");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Verwijderen mislukt.");
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

  const handleShareEmail = () => {
    const absoluteLink =
      shareLink && shareLink.startsWith("http")
        ? shareLink
        : `${window.location.origin}${shareLink ?? `/facturen/${invoiceId}`}`;
    const subject = encodeURIComponent(`Factuur ${pdfInvoice.invoiceNum}`);
    const body = encodeURIComponent(
      `Beste klant,\n\nHierbij de factuur ${pdfInvoice.invoiceNum} ter waarde van ${formatBedrag(
        calculateInvoiceTotals(pdfInvoice.lines).total,
      )}.\n\nLink: ${absoluteLink}\n\nMet vriendelijke groet,\n${pdfInvoice.companyProfile?.companyName ?? "ZZP HUB"}`,
    );
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    const link =
      shareLink && shareLink.startsWith("http")
        ? shareLink
        : `${window.location.origin}${shareLink ?? `/facturen/${invoiceId}`}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link gekopieerd");
    } catch (error) {
      console.error("copy link", error);
      toast.error("Kopiëren mislukt");
    }
  };

  return (
    <details className="relative inline-block" open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
      <summary
        className={buttonVariants("secondary", "cursor-pointer list-none px-3 py-2")}
        role="button"
        aria-label="Open deelopties"
        style={{ listStyle: "none" }}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
        Acties
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-[var(--border)] bg-white shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-2 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Document</p>
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Download PDF"
            className="w-full justify-start"
            variant="secondary"
            icon={<FileDown className="h-4 w-4" aria-hidden />}
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
            onClick={handleShareEmail}
            className="w-full justify-start gap-2"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Deel via e-mail
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareWhatsApp}
            className="w-full justify-start gap-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyLink}
            className="w-full justify-start gap-2"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Kopieer link
          </Button>
        </div>
        <div className="border-t border-[var(--border)] p-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {editHref ? (
              <Link href={editHref} className={buttonVariants("ghost", "w-full justify-start gap-2")}>
                <Edit3 className="h-4 w-4" aria-hidden />
                Bewerk factuur
              </Link>
            ) : null}
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full justify-start gap-2"
              variant="ghost"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isPending ? "Verwijderen..." : "Verwijder"}
            </Button>
          </div>
          {emailStatus === InvoiceEmailStatus.BETAALD ? (
            <Button
              type="button"
              onClick={handleMarkAsUnpaid}
              disabled={isPending}
              className="w-full justify-center gap-2"
              variant="secondary"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              {isPending ? "Bezig..." : "Markeer als onbetaald"}
            </Button>
          ) : (
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
          )}
        </div>
      </div>
    </details>
  );
}
