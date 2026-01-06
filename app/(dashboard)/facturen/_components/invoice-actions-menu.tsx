"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

type PendingAction = "markPaid" | "markUnpaid" | "delete" | null;

function buildShareLink(shareLink: string | undefined, invoiceId: string) {
  const targetPath = shareLink ?? `/facturen/${invoiceId}`;
  if (shareLink && shareLink.startsWith("http")) return shareLink;
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const origin = typeof window !== "undefined" ? window.location.origin : envOrigin;
  if (!origin) return targetPath;
  return `${origin}${targetPath}`;
}

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, recipientEmail, emailStatus, editHref, shareLink }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmAction, setConfirmAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const shareTarget = useMemo(() => buildShareLink(shareLink, invoiceId), [shareLink, invoiceId]);

  useEffect(() => {
    if (!menuOpen && confirmAction) {
      setConfirmAction(null);
    }
  }, [confirmAction, menuOpen]);

  const runServerAction = (action: PendingAction, fn: () => Promise<{ success?: boolean; message?: string }>) => {
    setConfirmAction(null);
    setPendingAction(action);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result?.success) {
          setMenuOpen(false);
          router.refresh();
        } else {
          toast.error(result?.message ?? "Er ging iets mis. Probeer opnieuw.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Onbekende fout";
        console.error(`Actie ${action} mislukt:`, message);
        toast.error("Actie mislukt. Probeer opnieuw.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleMarkAsPaid = () =>
    runServerAction("markPaid", async () => {
      const result = await markAsPaid(invoiceId);
      if (result?.success) toast.success("Factuur gemarkeerd als betaald");
      return result;
    });

  const handleMarkAsUnpaid = () => {
    if (confirmAction !== "markUnpaid") {
      setConfirmAction("markUnpaid");
      return;
    }
    setConfirmAction(null);
    runServerAction("markUnpaid", async () => {
      const result = await markAsUnpaid(invoiceId);
      if (result?.success) toast.success("Factuur teruggezet naar onbetaald");
      return result;
    });
  };

  const handleDelete = () => {
    if (confirmAction !== "delete") {
      setConfirmAction("delete");
      return;
    }
    setConfirmAction(null);
    runServerAction("delete", async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.success) toast.success("Factuur verwijderd");
      return result;
    });
  };

  const handleShareWhatsApp = () => {
    const totals = calculateInvoiceTotals(pdfInvoice.lines);
    const companyName = pdfInvoice.companyProfile?.companyName ?? "ZZP HUB";
    const message = `Factuur ${pdfInvoice.invoiceNum} van ${companyName}. Totaal: ${formatBedrag(
      totals.total,
    )}. Bekijk: ${shareTarget}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    setMenuOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp geopend");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Factuur ${pdfInvoice.invoiceNum}`);
    const body = encodeURIComponent(
      `Beste klant,\n\nHierbij de factuur ${pdfInvoice.invoiceNum} ter waarde van ${formatBedrag(
        calculateInvoiceTotals(pdfInvoice.lines).total,
      )}.\n\nLink: ${shareTarget}\n\nMet vriendelijke groet,\n${pdfInvoice.companyProfile?.companyName ?? "ZZP HUB"}`,
    );
    setMenuOpen(false);
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareTarget);
      toast.success("Link gekopieerd");
      setMenuOpen(false);
    } catch (error) {
      console.error("copy link", error);
      toast.error("Kopiëren mislukt");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Factuur ${pdfInvoice.invoiceNum}`,
          text: `Factuur ${pdfInvoice.invoiceNum} delen`,
          url: shareTarget,
        });
        toast.success("Factuur gedeeld");
        setMenuOpen(false);
        return;
      } catch (error) {
        console.error("Failed to share invoice via native API", error);
      }
    }

    await handleCopyLink();
  };

  const menuContent = (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-3.5 text-white shadow-[0_30px_60px_-36px_rgba(16,185,129,0.9)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">Snel</p>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-emerald-50">Factuur</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shareLink ? (
            <Link
              href={shareLink}
              className={buttonVariants(
                "ghost",
                "w-full justify-start gap-2 bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 hover:ring-white/25",
              )}
              onClick={() => setMenuOpen(false)}
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
                "w-full justify-start gap-2 bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 hover:ring-white/25",
              )}
              onClick={() => setMenuOpen(false)}
            >
              <Edit3 className="h-4 w-4" aria-hidden />
              Bewerk factuur
            </Link>
          ) : null}
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Download PDF"
            className="w-full justify-start gap-2 bg-gradient-to-br from-emerald-800/80 via-emerald-900/80 to-slate-900/85 text-white ring-1 ring-emerald-400/30 hover:ring-emerald-300/40"
            variant="secondary"
            icon={<FileDown className="h-4 w-4" aria-hidden />}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-emerald-100/70 bg-white/95 p-3 shadow-sm backdrop-blur-md dark:border-emerald-900/50 dark:bg-slate-900/80">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-900/80 dark:text-emerald-100/80">Delen</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareEmail}
            className="justify-start gap-2 border border-sky-100 bg-sky-50 text-sky-900 shadow-[0_10px_28px_-20px_rgba(14,165,233,0.55)] hover:border-sky-200 dark:border-sky-900/60 dark:bg-slate-800/80 dark:text-sky-50"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Deel via e-mail
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareWhatsApp}
            className="justify-start gap-2 border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_10px_28px_-20px_rgba(16,185,129,0.55)] hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleNativeShare}
            className="justify-start gap-2 border border-emerald-200 bg-emerald-50/80 text-emerald-900 shadow-[0_10px_28px_-20px_rgba(16,185,129,0.45)] hover:border-emerald-300 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Deel of kopieer
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/60 to-white p-3 shadow-sm backdrop-blur-md dark:border-slate-700 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-900/80 dark:text-emerald-100/80">Status</p>
        {emailStatus === InvoiceEmailStatus.BETAALD ? (
          <Button
            type="button"
            onClick={handleMarkAsUnpaid}
            disabled={pendingAction !== null}
            className="w-full justify-center gap-2 border border-amber-300/70 bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-[0_14px_32px_-18px_rgba(245,158,11,0.7)] hover:border-amber-400"
            variant="secondary"
          >
            {isPending && pendingAction === "markUnpaid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            {isPending && pendingAction === "markUnpaid"
              ? "Bezig..."
              : confirmAction === "markUnpaid"
                ? "Klik nogmaals om te bevestigen"
                : "Markeer als onbetaald"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={pendingAction !== null}
            className="w-full justify-center gap-2 shadow-[0_16px_36px_-20px_rgba(16,185,129,0.85)]"
            variant="primary"
          >
            {isPending && pendingAction === "markPaid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isPending && pendingAction === "markPaid" ? "Markeren..." : "Markeer als betaald"}
          </Button>
        )}

        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-700 via-rose-600 to-amber-600 px-3 py-3 shadow-[0_12px_32px_-22px_rgba(244,63,94,0.45)] dark:border-rose-500/40">
          <Button
            type="button"
            onClick={handleDelete}
            disabled={pendingAction !== null}
            className="w-full justify-start gap-2 bg-white/10 text-white hover:-translate-y-[1px]"
            variant="destructive"
          >
            {isPending && pendingAction === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isPending && pendingAction === "delete"
              ? "Verwijderen..."
              : confirmAction === "delete"
                ? "Klik nogmaals om te verwijderen"
                : "Verwijder"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <EntityActionsMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
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
