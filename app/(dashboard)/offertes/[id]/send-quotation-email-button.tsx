"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <Button type="button" onClick={handleSend} disabled={isPending}>
      {isPending ? "Versturen..." : "Verstuur via Email"}
    </Button>
  );
}
