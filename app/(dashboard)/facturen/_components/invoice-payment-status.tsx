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

  if (isPaid) {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <p className="text-[13px] font-semibold leading-tight text-white">
          Betaald op {paidDateLabel ?? "onbekende datum"}
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={handleMarkUnpaid}
          className="min-h-0 h-8 px-3 text-xs font-semibold text-[#9FCBC4] ring-1 ring-[#123C37] hover:bg-[#123C37]/60 hover:text-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" aria-hidden />}
          Ongedaan maken
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <p className="text-[13px] font-semibold leading-tight text-[#CFEDEA]">Status: Open</p>
      <Button
        type="button"
        onClick={handleMarkPaid}
        disabled={isPending}
        className="min-h-0 h-9 rounded-full bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] px-4 text-xs font-semibold text-white shadow-[0_16px_44px_-26px_rgba(12,94,87,0.95)] ring-1 ring-[#1FBF84]/45 hover:-translate-y-[1px]"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />}
        Markeer als betaald
      </Button>
    </div>
  );
}
