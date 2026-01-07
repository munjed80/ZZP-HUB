"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Eye, FileDown, Loader2, MoreVertical, Share2, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { deleteInvoice } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { PortalPopover } from "@/components/ui/portal-popover";
import { cn } from "@/lib/utils";

type Props = {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  editHref?: string;
  shareLink?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type PendingAction = "delete" | null;

function buildShareLink(shareLink: string | undefined, invoiceId: string) {
  const targetPath = shareLink ?? `/facturen/${invoiceId}`;
  if (shareLink && shareLink.startsWith("http")) return shareLink;
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const origin = typeof window !== "undefined" ? window.location.origin : envOrigin;
  if (!origin) return targetPath;
  return `${origin}${targetPath}`;
}

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, editHref, shareLink, isOpen, onOpenChange }: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const menuOpen = isOpen !== undefined ? isOpen : internalOpen;
  const setMenuOpen = onOpenChange || setInternalOpen;
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shareTarget = useMemo(() => buildShareLink(shareLink, invoiceId), [shareLink, invoiceId]);
  useEffect(() => {
    if (!menuOpen && confirmDelete) {
      setConfirmDelete(false);
    }
  }, [confirmDelete, menuOpen]);

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

  const handleShare = async () => {
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

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setPendingAction("delete");
    startTransition(async () => {
      try {
        const result = await deleteInvoice(invoiceId);
        if (result?.success) {
          toast.success("Factuur verwijderd");
          setMenuOpen(false);
          router.refresh();
        } else {
          toast.error(result?.message ?? "Verwijderen mislukt");
        }
      } catch (error) {
        console.error("Actie delete mislukt:", error);
        toast.error("Actie mislukt. Probeer opnieuw.");
      } finally {
        setPendingAction(null);
        setConfirmDelete(false);
      }
    });
  };

  const menuContent = (
    <div className="w-[240px] rounded-2xl border border-[#14544F] bg-gradient-to-br from-[#114C4A] via-[#0F6F68] to-[#0B4D52] p-3 text-white shadow-[0_18px_52px_-28px_rgba(8,71,66,0.6)]">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9FCBC4]">Acties</p>
          <p className="text-sm font-semibold leading-tight">Factuur {pdfInvoice.invoiceNum}</p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-[#CFEDEA]">Snel</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {shareLink ? (
          <Link
            href={shareLink}
            className={buttonVariants(
              "ghost",
               "h-10 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/10",
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
               "h-10 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/10",
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
          className="h-10 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]"
          variant="ghost"
          icon={<FileDown className="h-4 w-4" aria-hidden />}
        />
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            buttonVariants(
              "ghost",
               "h-10 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/10",
            ),
          )}
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Deel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={buttonVariants(
            "ghost",
           "h-10 w-full justify-start gap-2 rounded-xl border border-[#E54848]/40 bg-[#1D1113] text-[#FCA5A5] hover:border-[#E54848]/60 hover:bg-[#2A171A]",
          )}
        >
          {isPending && pendingAction === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden />
          )}
          {isPending && pendingAction === "delete"
            ? "Verwijderen..."
            : confirmDelete
              ? "Klik nogmaals om te verwijderen"
              : "Verwijder"}
        </button>
      </div>
    </div>
  );

  return (
    <PortalPopover
      trigger={
        <button
          type="button"
          className={buttonVariants(
            "ghost",
            "h-10 w-10 rounded-full border border-[#14544F] bg-gradient-to-br from-[#0F7E78] via-[#0FA9A3] to-[#0B6A70] p-0 text-white shadow-[0_14px_34px_-22px_rgba(12,140,135,0.75)] hover:text-white",
          )}
          aria-label="Acties"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
      }
      open={menuOpen}
      onOpenChange={setMenuOpen}
    >
      {menuContent}
    </PortalPopover>
  );
}
