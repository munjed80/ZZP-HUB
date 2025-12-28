"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <Button type="button" onClick={handleClick} disabled={isPending}>
      {isPending ? "Versturen..." : "Verstuur via Email"}
    </Button>
  );
}
