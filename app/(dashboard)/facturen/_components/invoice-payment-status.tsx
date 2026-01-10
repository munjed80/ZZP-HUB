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
    "inline-flex h-9 !min-h-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2";

  if (isPaid) {
    return (
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={handleMarkUnpaid}
        className={`${commonClasses} border-emerald-600 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
        ) : (
          <Undo2 className="h-4 w-4 text-emerald-700" aria-hidden />
        )}
        Maak open
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleMarkPaid}
      disabled={isPending}
      className={`${commonClasses} bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 text-white border-emerald-600 shadow-[0_14px_32px_-18px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_40px_-18px_rgba(16,185,129,0.5)]`}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />}
      Markeer betaald
    </Button>
  );
}
