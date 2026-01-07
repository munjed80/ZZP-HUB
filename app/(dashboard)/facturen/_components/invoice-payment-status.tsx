"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAsPaid, markAsUnpaid } from "@/app/actions/invoice-actions";

type InvoicePaymentStatusProps = {
  invoiceId: string;
  isPaid: boolean;
  paidDateLabel?: string | null;
};

export function InvoicePaymentStatus({ invoiceId, isPaid, paidDateLabel }: InvoicePaymentStatusProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: () => Promise<{ success?: boolean; message?: string }>, successMessage: string) => {
      startTransition(async () => {
        const result = await action();
        if (result?.success) {
          toast.success(successMessage);
          router.refresh();
        } else {
          toast.error(result?.message ?? "Actie mislukt. Probeer opnieuw.");
        }
      });
    },
    [router],
  );

  const handleMarkPaid = () => runAction(() => markAsPaid(invoiceId), "Factuur gemarkeerd als betaald");
  const handleMarkUnpaid = () => runAction(() => markAsUnpaid(invoiceId), "Betaling ongedaan gemaakt");

  const commonClasses =
    "inline-flex h-8 !min-h-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#10B5A4]";

  if (isPaid) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-white">
        <p className="font-semibold leading-tight">Betaald op {paidDateLabel ?? "onbekende datum"}</p>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={handleMarkUnpaid}
          className={`${commonClasses} border-amber-200/50 bg-white/5 px-3 text-amber-100 hover:bg-amber-50/10 hover:text-amber-50`}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" aria-hidden />}
          Maak open
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-[#E4F7F3]">
      <p className="font-semibold leading-tight">Status: Open</p>
      <Button
        type="button"
        onClick={handleMarkPaid}
        disabled={isPending}
        className={`${commonClasses} border-[#1A8C7B] bg-gradient-to-r from-[#0F7E78] via-[#0FA9A3] to-[#0B6A70] px-3 text-white shadow-[0_12px_32px_-20px_rgba(12,140,135,0.9)] hover:brightness-105`}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />}
        Markeer betaald
      </Button>
    </div>
  );
}
