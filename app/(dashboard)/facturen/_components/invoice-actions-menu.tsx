"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Edit3,
  Eye,
  FileDown,
  Loader2,
  Mail,
  MessageCircle,
  Trash2,
  Undo2,
} from "lucide-react";
import { InvoiceEmailStatus } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { deleteInvoice, markAsPaid, markAsUnpaid } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { calculateInvoiceTotals } from "@/components/pdf/InvoicePDF";
import { formatBedrag } from "@/lib/utils";
import { EntityActionsMenu } from "@/components/ui/entity-actions-menu";

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
    const link =
      shareLink && shareLink.startsWith("http")
        ? shareLink
        : `${window.location.origin}${shareLink ?? `/facturen/${invoiceId}`}`;
    const message = `Factuur ${pdfInvoice.invoiceNum} van ${companyName}. Totaal: ${formatBedrag(
      totals.total,
    )}. Bekijk: ${link}`;
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

  const handleNativeShare = async () => {
    const link =
      shareLink && shareLink.startsWith("http")
        ? shareLink
        : `${window.location.origin}${shareLink ?? `/facturen/${invoiceId}`}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Factuur ${pdfInvoice.invoiceNum}`,
          text: `Factuur ${pdfInvoice.invoiceNum} delen`,
          url: link,
        });
        toast.success("Factuur gedeeld");
        setIsOpen(false);
        return;
      } catch (error) {
        console.error("native share", error);
      }
    }

    await handleCopyLink();
  };

  const menuContent = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Snel</p>
        {shareLink ? (
          <Link href={shareLink} className={buttonVariants("ghost", "w-full justify-start gap-2 bg-white")}>
            <Eye className="h-4 w-4" aria-hidden />
            Bekijk factuur
          </Link>
        ) : null}
        {editHref ? (
          <Link href={editHref} className={buttonVariants("ghost", "w-full justify-start gap-2 bg-white")}>
            <Edit3 className="h-4 w-4" aria-hidden />
            Bewerk factuur
          </Link>
        ) : null}
        <InvoicePdfDownloadButton
          invoice={pdfInvoice}
          label="Download PDF"
          className="w-full justify-start"
          variant="secondary"
          icon={<FileDown className="h-4 w-4" aria-hidden />}
        />
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200/80 p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleShareEmail} className="flex-1 min-w-[140px] justify-start gap-2">
            <Mail className="h-4 w-4" aria-hidden />
            Deel via e-mail
          </Button>
          <Button type="button" variant="secondary" onClick={handleShareWhatsApp} className="flex-1 min-w-[140px] justify-start gap-2">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
          <Button type="button" variant="secondary" onClick={handleNativeShare} className="flex-1 min-w-[140px] justify-start gap-2">
            <Copy className="h-4 w-4" aria-hidden />
            Deel of kopieer
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200/80 p-3 shadow-sm">
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
    </div>
  );

  return (
    <EntityActionsMenu
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Factuur acties"
      description={`Factuur ${pdfInvoice.invoiceNum}`}
      iconOnly
      ariaLabel="Factuur acties"
      triggerClassName="h-9 w-9 border border-slate-200 shadow-none"
    >
      {menuContent}
    </EntityActionsMenu>
  );
}
