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

  const menuItemClasses =
    "h-10 w-full justify-start gap-2 rounded-xl border-[rgb(var(--btn-border))] bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-fg))] hover:bg-[rgb(var(--btn-hover-bg))]";
  const menuContent = (
    <div className="w-[240px] rounded-2xl border border-slate-200 bg-white p-3 text-[rgb(var(--btn-fg))] shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Acties</p>
          <p className="text-sm font-semibold leading-tight">Factuur {pdfInvoice.invoiceNum}</p>
        </div>
        <span className="rounded-full bg-[rgb(var(--muted-bg))] px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted-fg))]">Snel</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {shareLink ? (
          <Link href={shareLink} className={buttonVariants("ghost", menuItemClasses)} onClick={() => setMenuOpen(false)}>
            <Eye className="h-4 w-4" aria-hidden />
            Bekijk factuur
          </Link>
        ) : null}
        {editHref ? (
          <Link href={editHref} className={buttonVariants("ghost", menuItemClasses)} onClick={() => setMenuOpen(false)}>
            <Edit3 className="h-4 w-4" aria-hidden />
            Bewerk factuur
          </Link>
        ) : null}
        <InvoicePdfDownloadButton
          invoice={pdfInvoice}
          label="Download PDF"
          className={menuItemClasses}
          variant="ghost"
          icon={<FileDown className="h-4 w-4" aria-hidden />}
        />
        <button type="button" onClick={handleShare} className={cn(buttonVariants("ghost", menuItemClasses))}>
          <Share2 className="h-4 w-4" aria-hidden />
          Deel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={buttonVariants(
            "ghost",
            cn(menuItemClasses, "border-[rgb(var(--danger-border))] bg-[rgb(var(--danger-bg))] text-[rgb(var(--danger-fg))] hover:bg-[rgb(var(--danger-hover-bg))]"),
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
            "h-9 w-9 rounded-full border border-slate-200 bg-white p-0 text-[#6B7280] shadow-sm hover:bg-slate-50 hover:text-[#111827]",
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
