"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendInvoiceEmail } from "@/actions/email-actions";

type Props = {
  invoiceId: string;
  recipientEmail: string;
};

export function SendInvoiceEmailButton({ invoiceId, recipientEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await sendInvoiceEmail(invoiceId);
      if (result?.success) {
        toast.success(`Factuur is verzonden naar ${result.recipient ?? recipientEmail}`);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Versturen via e-mail is mislukt.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-blue-600 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? "Versturen..." : "Verstuur via Email"}
    </button>
  );
}
