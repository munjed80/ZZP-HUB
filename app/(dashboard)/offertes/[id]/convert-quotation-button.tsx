"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertQuotationToInvoice } from "../actions";

type Props = {
  quotationId: string;
};

export function ConvertQuotationButton({ quotationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertQuotationToInvoice(quotationId);
      if (result?.success && result.invoiceId) {
        toast.success("Offerte omgezet naar factuur.");
        router.push(`/facturen/${result.invoiceId}/edit`);
      } else {
        toast.error(result?.message ?? "Omzetten mislukt.");
      }
    });
  };

  return (
    <Button type="button" onClick={handleConvert} disabled={isPending}>
      {isPending ? "Omzetten..." : "Omzetten naar Factuur"}
    </Button>
  );
}
