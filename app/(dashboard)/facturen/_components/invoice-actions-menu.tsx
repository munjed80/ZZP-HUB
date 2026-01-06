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
  const totals = useMemo(() => calculateInvoiceTotals(pdfInvoice.lines), [pdfInvoice.lines]);

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
        totals.total,
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
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] p-4 text-white shadow-[0_26px_64px_-36px_rgba(12,94,87,0.85)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9FCBC4]">Factuur</p>
            <p className="text-lg font-semibold leading-tight">#{pdfInvoice.invoiceNum}</p>
            <p className="text-sm text-[#CFEDEA]">
              Totaal {formatBedrag(totals.total)}
              {pdfInvoice.dueDate ? ` · Vervalt ${pdfInvoice.dueDate}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#CFEDEA]">
            {emailStatus === InvoiceEmailStatus.BETAALD
              ? "Betaald"
              : emailStatus === InvoiceEmailStatus.HERINNERING
                ? "Herinnering"
                : "Openstaand"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {shareLink ? (
            <Link
              href={shareLink}
              className={buttonVariants(
                "ghost",
                "w-full justify-start gap-2 rounded-xl bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:ring-white/30",
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
                "w-full justify-start gap-2 rounded-xl bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:ring-white/30",
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
            className="w-full justify-start gap-2 rounded-xl bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20 hover:ring-white/30"
            variant="primary"
            icon={<FileDown className="h-4 w-4" aria-hidden />}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-[#123C37] bg-[#0F2F2C]/95 p-3 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.55)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9FCBC4]">Delen</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleShareEmail}
            className="justify-start gap-2 rounded-2xl border border-[#123C37] bg-[#123C37]/70 text-[#CFEDEA] shadow-[0_12px_32px_-22px_rgba(0,0,0,0.65)] hover:border-[#1FBF84]/45 hover:bg-[#123C37]"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Deel via e-mail
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleShareWhatsApp}
            className="justify-start gap-2 rounded-2xl border border-[#123C37] bg-[#123C37]/70 text-[#CFEDEA] shadow-[0_12px_32px_-22px_rgba(0,0,0,0.65)] hover:border-[#1FBF84]/45 hover:bg-[#123C37]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Deel via WhatsApp
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleNativeShare}
            className="justify-start gap-2 rounded-2xl border border-[#123C37] bg-[#123C37]/70 text-[#CFEDEA] shadow-[0_12px_32px_-22px_rgba(0,0,0,0.65)] hover:border-[#1FBF84]/45 hover:bg-[#123C37]"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Deel of kopieer
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#123C37] bg-gradient-to-br from-[#0F2F2C] via-[#0B4E48] to-[#0E6F64] p-3 text-white shadow-[0_18px_52px_-28px_rgba(0,0,0,0.6)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9FCBC4]">Status</p>
        {emailStatus === InvoiceEmailStatus.BETAALD ? (
          <Button
            type="button"
            onClick={handleMarkAsUnpaid}
            disabled={pendingAction !== null}
            className="mt-2 w-full justify-center gap-2 rounded-xl border border-[#F2B705]/60 bg-[#0F2F2C]/60 text-[#F2B705] ring-1 ring-[#F2B705]/30 hover:border-[#F2B705] hover:bg-[#123C37]/60"
            variant="ghost"
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
            className="mt-2 w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] text-white ring-1 ring-[#1FBF84]/50 shadow-[0_18px_46px_-26px_rgba(15,94,87,0.85)] hover:shadow-[0_20px_54px_-24px_rgba(15,94,87,0.92)]"
            variant="primary"
          >
            {isPending && pendingAction === "markPaid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isPending && pendingAction === "markPaid" ? "Markeren..." : "Markeer als betaald"}
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-[#E54848]/55 bg-[#0F2F2C] p-3 shadow-[0_16px_46px_-32px_rgba(229,72,72,0.55)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E54848]">Verwijderen</p>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={pendingAction !== null}
          className="mt-2 w-full justify-start gap-2 rounded-xl border border-[#E54848]/70 bg-transparent text-[#E54848] hover:-translate-y-[1px] hover:bg-[#123C37]/70 hover:text-white"
          variant="ghost"
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
  );

  return (
    <EntityActionsMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
      title="Factuur acties"
      description={`Factuur ${pdfInvoice.invoiceNum}`}
      iconOnly
      ariaLabel="Factuur acties"
      triggerClassName="h-10 w-10 rounded-full border border-[#123C37] bg-gradient-to-br from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] text-white shadow-[0_14px_34px_-22px_rgba(12,94,87,0.85)] hover:text-white"
    >
      {menuContent}
    </EntityActionsMenu>
  );
}
