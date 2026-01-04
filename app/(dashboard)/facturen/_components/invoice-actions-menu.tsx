"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { InvoiceEmailStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { InvoicePdfDownloadButton } from "@/components/pdf/InvoicePdfDownloadButton";
import { SendInvoiceEmailButton } from "../[id]/send-invoice-email-button";
import { markAsPaid } from "@/app/actions/invoice-actions";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";

type Props = {
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  invoiceId: string;
  recipientEmail: string;
  emailStatus: InvoiceEmailStatus;
};

export function InvoiceActionsMenu({ pdfInvoice, invoiceId, recipientEmail, emailStatus }: Props) {
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

  return (
    <details className="relative inline-block" open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
      <summary
        className={buttonVariants("secondary", "cursor-pointer list-none px-3 py-2")}
        role="button"
        aria-label="Acties"
        style={{ listStyle: "none" }}
      >
        Acties
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col gap-2 p-2">
          <InvoicePdfDownloadButton
            invoice={pdfInvoice}
            label="Delen / Downloaden"
            className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800"
          />
          <SendInvoiceEmailButton
            invoiceId={invoiceId}
            recipientEmail={recipientEmail}
            className="w-full justify-center"
          />
          {emailStatus !== InvoiceEmailStatus.BETAALD && (
            <Button
              type="button"
              onClick={handleMarkAsPaid}
              disabled={isPending}
              className="w-full justify-center gap-2"
              variant="primary"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isPending ? "Markeren..." : "Markeren als betaald"}
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
