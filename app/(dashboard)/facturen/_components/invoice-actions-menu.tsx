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
  const viewHref = shareTarget;
  const editTarget = editHref ?? `/facturen/${invoiceId}/edit`;
  const hasPdfData = Boolean(pdfInvoice);
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
    if (!hasPdfData) return;

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
    "group h-10 w-full justify-start gap-2 rounded-xl border border-transparent bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-400 disabled:opacity-60 disabled:hover:text-gray-400 disabled:hover:bg-white";
  const menuIconClasses = "h-4 w-4 text-gray-700";
  const menuContent = (
    <div className="w-[240px] rounded-2xl border border-gray-200 bg-white p-3 text-gray-900 shadow-lg z-50">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Acties</p>
          <p className="text-sm font-semibold leading-tight text-gray-900">Factuur {pdfInvoice.invoiceNum}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">Snel</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <Link href={viewHref} className={buttonVariants("ghost", menuItemClasses)} onClick={() => setMenuOpen(false)}>
          <Eye className={menuIconClasses} aria-hidden />
          Bekijk factuur
        </Link>
        <Link href={editTarget} className={buttonVariants("ghost", menuItemClasses)} onClick={() => setMenuOpen(false)}>
          <Edit3 className={menuIconClasses} aria-hidden />
          Bewerk factuur
        </Link>
        <InvoicePdfDownloadButton
          invoice={pdfInvoice}
          label="Download PDF"
          className={menuItemClasses}
          variant="ghost"
          icon={<FileDown className={menuIconClasses} aria-hidden />}
        />
        <button
          type="button"
          onClick={handleShare}
          disabled={!hasPdfData}
          className={cn(buttonVariants("ghost", menuItemClasses))}
        >
          <Share2 className={menuIconClasses} aria-hidden />
          Deel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={buttonVariants(
            "ghost",
            cn(menuItemClasses, "border-transparent text-red-600 hover:bg-gray-50 hover:text-red-700"),
          )}
        >
          {isPending && pendingAction === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
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
            "h-9 w-9 rounded-full border border-gray-200 bg-white p-0 text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900",
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
