"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { sendInvoiceEmail } from "@/app/actions/invoice-actions";

type Props = {
  invoiceId: string;
  recipientEmail: string;
  className?: string;
  variant?: ButtonVariant;
  label?: string;
};

export function SendInvoiceEmailButton({ invoiceId, recipientEmail, className, variant = "primary", label }: Props) {
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
    <Button type="button" variant={variant} onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? "Versturen..." : label ?? "Verstuur via Email"}
    </Button>
  );
}
