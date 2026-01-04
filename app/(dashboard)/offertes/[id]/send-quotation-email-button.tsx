"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { sendQuotationEmail } from "../actions";

type Props = {
  quotationId: string;
  recipientEmail: string;
  className?: string;
  variant?: ButtonVariant;
  label?: string;
  icon?: ReactNode;
};

export function SendQuotationEmailButton({ 
  quotationId, 
  recipientEmail, 
  className,
  variant = "primary",
  label,
  icon,
}: Props) {
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

  const buttonLabel = label ?? "Verstuur via Email";

  return (
    <Button type="button" variant={variant} onClick={handleSend} disabled={isPending} className={className}>
      {isPending ? (
        "Versturen..."
      ) : (
        <>
          {icon ?? <Mail className="h-4 w-4" aria-hidden="true" />}
          {buttonLabel}
        </>
      )}
    </Button>
  );
}
