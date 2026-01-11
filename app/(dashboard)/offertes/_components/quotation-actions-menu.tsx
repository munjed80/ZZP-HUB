"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Copy,
  FileDown,
  Mail,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EntityActionsMenu } from "@/components/ui/entity-actions-menu";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { calculateInvoiceTotals, type InvoicePdfData } from "@/components/pdf/InvoicePDF";
import { formatBedrag } from "@/lib/utils";
import { ConvertQuotationButton } from "../[id]/convert-quotation-button";
import { SendQuotationEmailButton } from "../[id]/send-quotation-email-button";
import { deleteQuotation, duplicateQuotation } from "../actions";

type Props = {
  pdfQuotation: InvoicePdfData;
  quotationId: string;
  recipientEmail: string;
  shareLink: string;
  className?: string;
};

export function QuotationActionsMenu({ pdfQuotation, quotationId, recipientEmail, shareLink, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    const confirmed = window.confirm("Weet je zeker dat je deze offerte wilt verwijderen?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteQuotation(quotationId);
      if (result?.success) {
        toast.success("Offerte verwijderd");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Verwijderen mislukt.");
      }
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateQuotation(quotationId);
      if (result?.success) {
        toast.success("Offerte gedupliceerd");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Dupliceren mislukt.");
      }
    });
  };

  const handleShareWhatsApp = () => {
    const totals = calculateInvoiceTotals(pdfQuotation.lines);
    const absoluteLink = shareLink.startsWith("http") ? shareLink : `${window.location.origin}${shareLink}`;
    const message = `Offerte ${pdfQuotation.invoiceNum} met totaal ${formatBedrag(totals.total)}. Bekijk: ${absoluteLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (navigator.share) {
      navigator
        .share({ text: message, url: absoluteLink })
        .catch((error) => console.warn("Native share dismissed or failed", error));
      return;
    }

    window.location.href = url;
  };

  const handleShareEmail = () => {
    const totals = calculateInvoiceTotals(pdfQuotation.lines);
    const subject = encodeURIComponent(`Offerte ${pdfQuotation.invoiceNum}`);
    const body = encodeURIComponent(
      `Beste klant,\n\nHierbij de offerte ${pdfQuotation.invoiceNum} ter waarde van ${formatBedrag(
        totals.total,
      )}.\n\nLink: ${window.location.origin}${shareLink}\n\nMet vriendelijke groet,`,
    );
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    const absolute = shareLink.startsWith("http") ? shareLink : `${window.location.origin}${shareLink}`;
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("Link gekopieerd");
    } catch (error) {
      console.error("copy link", error);
      toast.error("Kopiëren mislukt");
    }
  };

  return (
    <EntityActionsMenu
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Offerte acties"
      description={`Offerte ${pdfQuotation.invoiceNum}`}
      triggerClassName={className}
    >
      <div className="flex flex-col gap-2 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Document</p>
        <InvoicePdfDownloadButton
          invoice={pdfQuotation}
          documentType="OFFERTE"
          label="Download PDF"
          className="w-full justify-start"
          variant="secondary"
          icon={<FileDown className="h-4 w-4" aria-hidden />}
        />
        <SendQuotationEmailButton
          quotationId={quotationId}
          recipientEmail={recipientEmail}
          className="w-full justify-start"
          variant="secondary"
          label="Verstuur via e-mail"
        />
        <Button type="button" variant="secondary" className="w-full justify-start gap-2" onClick={handleShareEmail}>
          <Mail className="h-4 w-4" aria-hidden />
          Deel via e-mail
        </Button>
        <Button type="button" variant="secondary" className="w-full justify-start gap-2" onClick={handleShareWhatsApp}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          Deel via WhatsApp
        </Button>
        <Button type="button" variant="secondary" className="w-full justify-start gap-2" onClick={handleCopyLink}>
          <Copy className="h-4 w-4" aria-hidden />
          Kopieer link
        </Button>
      </div>

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Link href={`/offertes/${quotationId}`} className={buttonVariants("ghost", "w-full justify-start gap-2")}>
            <Pencil className="h-4 w-4" aria-hidden />
            Bekijk / bewerk
          </Link>
          <Button
            type="button"
            onClick={handleDuplicate}
            disabled={isPending}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            {isPending ? "Dupliceren..." : "Dupliceer"}
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Verwijder
          </Button>
        </div>

        <ConvertQuotationButton quotationId={quotationId} />
      </div>
    </EntityActionsMenu>
  );
}
