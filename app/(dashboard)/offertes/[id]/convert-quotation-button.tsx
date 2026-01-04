"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToInvoice } from "../actions";

type Props = {
  quotationId: string;
};

export function ConvertQuotationButton({ quotationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertToInvoice(quotationId);
      if (result?.success && result.invoiceId) {
        toast.success("Offerte succesvol omgezet naar factuur!");
        router.push(`/facturen/${result.invoiceId}`);
      } else {
        toast.error(result?.message ?? "Omzetten mislukt.");
      }
    });
  };

  return (
    <Button type="button" onClick={handleConvert} disabled={isPending}>
      {isPending ? (
        "Omzetten..."
      ) : (
        <>
          <FilePlus className="h-4 w-4" aria-hidden />
          Zet om naar factuur
        </>
      )}
    </Button>
  );
}
