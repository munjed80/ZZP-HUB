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

function buildShareLink(shareLink: string | undefined, invoiceId: string) {
  if (shareLink && shareLink.startsWith("http")) return shareLink;
  return `${window.location.origin}${shareLink ?? `/facturen/${invoiceId}`}`;
}

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
    const link = buildShareLink(shareLink, invoiceId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link gekopieerd");
    } catch (error) {
      console.error("copy link", error);
      toast.error("Kopiëren mislukt");
    }
  };

  const handleNativeShare = async () => {
    const link = buildShareLink(shareLink, invoiceId);

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
        console.error("Failed to share invoice via native API", error);
      }
    }

    await handleCopyLink();
  };

  const menuContent = (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-3.5 shadow-[0_26px_60px_-32px_rgba(16,185,129,0.9)] ring-1 ring-emerald-500/25">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">Belangrijk</p>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-emerald-50 shadow-inner shadow-emerald-900/60">
            Factuur
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {shareLink ? (
            <Link
              href={shareLink}
              className={buttonVariants(
                "ghost",
                "w-full justify-start gap-2 bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10 hover:text-white hover:ring-white/20",
              )}
            >
              <Eye className="h-4 w-4" aria-hidden />
              Bekijk factuur
            </Link>
          ) : null}
          {editHref ? (
            <Link
              href={editHref}
              className={buttonVariants(
                "ghost",
                "w-full justify-start gap-2 bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10 hover:text-white hover:ring-white/20",
              )}
            >
              <Edit3 className="h-4 w-4" aria-hidden />
              Bewerk factuur
            </Link>
          ) : null}
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Download PDF"
            className="w-full justify-start gap-2 bg-gradient-to-br from-emerald-900/85 via-emerald-900/80 to-slate-950/80 text-white ring-1 ring-emerald-400/25 hover:ring-emerald-300/30"
            variant="secondary"
            icon={<FileDown className="h-4 w-4" aria-hidden />}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-emerald-100/70 bg-white/90 p-3 shadow-sm backdrop-blur-md dark:border-emerald-900/50 dark:bg-slate-900/85">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-900/70 dark:text-emerald-100/80">
          Delen
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareEmail}
            className="flex-1 min-w-[140px] justify-start gap-2 border border-sky-100 bg-sky-50 text-sky-900 shadow-[0_10px_28px_-20px_rgba(14,165,233,0.6)] hover:border-sky-200 dark:border-sky-900/60 dark:bg-slate-800/80 dark:text-sky-50"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Deel via e-mail
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareWhatsApp}
            className="flex-1 min-w-[140px] justify-start gap-2 border border-emerald-100 bg-emerald-50 text-emerald-900 shadow-[0_10px_28px_-20px_rgba(16,185,129,0.55)] hover:border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleNativeShare}
            className="flex-1 min-w-[140px] justify-start gap-2 border border-amber-100 bg-amber-50 text-amber-900 shadow-[0_10px_28px_-20px_rgba(245,158,11,0.55)] hover:border-amber-200 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Deel of kopieer
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-emerald-100/80 bg-white/95 p-3 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/85">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-900/70 dark:text-emerald-100/80">
          Status
        </p>
        {emailStatus === InvoiceEmailStatus.BETAALD ? (
          <Button
            type="button"
            onClick={handleMarkAsUnpaid}
            disabled={isPending}
            className="w-full justify-center gap-2 border border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-900 shadow-[0_12px_30px_-22px_rgba(245,158,11,0.55)] hover:border-amber-300 dark:border-amber-700/70 dark:bg-amber-900/30 dark:text-amber-100"
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
            className="w-full justify-center gap-2 shadow-[0_14px_32px_-18px_rgba(16,185,129,0.75)]"
            variant="primary"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isPending ? "Markeren..." : "Markeer als betaald"}
          </Button>
        )}

        <div className="rounded-xl border border-rose-100/80 bg-gradient-to-br from-rose-50 to-amber-50 px-3 py-3 shadow-[0_10px_32px_-26px_rgba(244,63,94,0.4)] dark:border-rose-500/40 dark:from-rose-950/30 dark:to-amber-950/20">
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="w-full justify-start gap-2 shadow-none hover:-translate-y-[1px]"
            variant="destructive"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isPending ? "Verwijderen..." : "Verwijder"}
          </Button>
        </div>
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
      triggerClassName="h-10 w-10 rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-emerald-900/80 to-emerald-700/70 text-emerald-50 shadow-[0_12px_32px_-20px_rgba(16,185,129,0.9)] hover:text-white"
    >
      {menuContent}
    </EntityActionsMenu>
  );
}
