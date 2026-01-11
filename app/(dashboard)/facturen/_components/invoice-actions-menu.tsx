"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { pdf } from "@react-pdf/renderer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Eye, FileDown, Loader2, Mail, MoreVertical, Share2, Trash2 } from "lucide-react";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { deleteInvoice, sendInvoiceEmail } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";

type Props = {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  editHref?: string;
  shareLink?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  recipientEmail?: string;
};

type PendingAction = "delete" | "email" | null;

function buildShareLink(shareLink: string | undefined, invoiceId: string) {
  const targetPath = shareLink ?? `/facturen/${invoiceId}`;
  if (shareLink && shareLink.startsWith("http")) return shareLink;
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const origin = typeof window !== "undefined" ? window.location.origin : envOrigin;
  if (!origin) return targetPath;
  return `${origin}${targetPath}`;
}

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, editHref, shareLink, isOpen, onOpenChange, recipientEmail }: Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(isOpen ?? false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  const shareTarget = useMemo(() => buildShareLink(shareLink, invoiceId), [shareLink, invoiceId]);
  const viewHref = shareTarget;
  const editTarget = editHref ?? `/facturen/${invoiceId}/edit`;
  const hasPdfData = Boolean(pdfInvoice);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen !== undefined) {
      setShowMenu(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showMenu && confirmDelete) {
      setConfirmDelete(false);
    }
  }, [confirmDelete, showMenu]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onOpenChange, showMenu]);

  const closeMenu = () => {
    setShowMenu(false);
    onOpenChange?.(false);
  };

  const handleNavigate = (target: string) => {
    if (target.startsWith("http")) {
      window.location.href = target;
    } else {
      router.push(target);
    }
    closeMenu();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareTarget);
      toast.success("Link gekopieerd");
      closeMenu();
    } catch (error) {
      console.error("copy link", error);
      toast.error("Kopiëren mislukt");
    }
  };

  const handleShare = async () => {
    if (!hasPdfData) return;

    if (navigator.share) {
      try {
        // Try to share with PDF file if supported
        const blob = await pdf(<InvoicePDF invoice={pdfInvoice} />).toBlob();
        const file = new File([blob], `factuur-${pdfInvoice.invoiceNum}.pdf`, { type: 'application/pdf' });
        
        // Check if files can be shared
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Factuur ${pdfInvoice.invoiceNum}`,
            text: `Factuur ${pdfInvoice.invoiceNum}`,
            files: [file],
          });
        } else {
          // Fall back to sharing URL only
          await navigator.share({
            title: `Factuur ${pdfInvoice.invoiceNum}`,
            text: `Factuur ${pdfInvoice.invoiceNum} delen`,
            url: shareTarget,
          });
        }
        toast.success("Factuur gedeeld");
        closeMenu();
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
          closeMenu();
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

  const handleDownloadPdf = async () => {
    if (!hasPdfData) return;
    try {
      setIsDownloading(true);
      const downloadName = `factuur-${pdfInvoice.invoiceNum}.pdf`;
      const blob = await pdf(<InvoicePDF invoice={pdfInvoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Check if we're on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // On iOS, open in new tab as download attribute is not supported
        window.open(url, '_blank');
        toast.success("PDF geopend. Gebruik 'Deel' om op te slaan");
      } else {
        // Standard download for other browsers
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = downloadName;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
          anchor.remove();
          URL.revokeObjectURL(url);
        }, 150);
        toast.success("PDF gedownload");
      }
      closeMenu();
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("Download mislukt");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = () => {
    if (!recipientEmail) {
      toast.error("Geen e-mailadres beschikbaar voor deze klant");
      return;
    }

    setPendingAction("email");
    startTransition(async () => {
      try {
        const result = await sendInvoiceEmail(invoiceId);
        if (result?.success) {
          toast.success(`Factuur verzonden naar ${result.recipient ?? recipientEmail}`);
          closeMenu();
          router.refresh();
        } else {
          toast.error(result?.message ?? "Versturen via e-mail is mislukt");
        }
      } catch (error) {
        console.error("Send email failed:", error);
        toast.error("Versturen mislukt. Probeer opnieuw.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const isDeleting = isPending && pendingAction === "delete";
  const isSendingEmail = isPending && pendingAction === "email";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white p-0 text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
        aria-label="Acties"
        aria-expanded={showMenu}
        onClick={() => {
          const next = !showMenu;
          setShowMenu(next);
          onOpenChange?.(next);
        }}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Acties</p>
              <p className="text-sm font-semibold leading-tight text-gray-800">Factuur {pdfInvoice.invoiceNum}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">Snel</span>
          </div>

          <div className="flex flex-col py-1">
            <button
              type="button"
              className="flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100"
              onClick={() => handleNavigate(viewHref)}
            >
              <Eye className="h-4 w-4 text-gray-800" aria-hidden />
              Bekijk factuur
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100"
              onClick={() => handleNavigate(editTarget)}
            >
              <Edit3 className="h-4 w-4 text-gray-800" aria-hidden />
              Bewerk factuur
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!hasPdfData || isDownloading}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white",
              )}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-800" aria-hidden />
              ) : (
                <FileDown className="h-4 w-4 text-gray-800" aria-hidden />
              )}
              {isDownloading ? "PDF genereren..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!hasPdfData}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white",
              )}
            >
              <Share2 className="h-4 w-4 text-gray-800" aria-hidden />
              Deel
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!recipientEmail || isSendingEmail}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white",
              )}
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-800" aria-hidden />
              ) : (
                <Mail className="h-4 w-4 text-gray-800" aria-hidden />
              )}
              {isSendingEmail ? "Verzenden..." : "Verstuur per e-mail"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white",
              )}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
              )}
              {isDeleting ? "Verwijderen..." : confirmDelete ? "Klik nogmaals om te verwijderen" : "Verwijder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
