"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendQuotationEmail } from "../actions";

type Props = {
  quotationId: string;
  recipientEmail: string;
};

export function SendQuotationEmailButton({ quotationId, recipientEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendQuotationEmail(quotationId);
      if (result?.success) {
        toast.success(`Offerte is verzonden naar ${result.recipient ?? recipientEmail}`);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Versturen via e-mail is mislukt.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-amber-600 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? "Versturen..." : "Verstuur via Email"}
    </button>
  );
}
