"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertOfferteToInvoice } from "../actions";

type Props = {
  quotationId: string;
};

export function ConvertQuotationButton({ quotationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertOfferteToInvoice(quotationId);
      if (result?.success && result.invoiceId) {
        if (result.alreadyConverted) {
          toast.success("Factuur al aangemaakt, wordt weergegeven");
        } else {
          toast.success("Factuur aangemaakt");
        }
        router.push(`/facturen/${result.invoiceId}`);
      } else {
        toast.error(result?.message ?? "Omzetten mislukt.");
      }
    });
  };

  return (
    <Button type="button" variant="primary" className="px-3 py-2 text-xs md:text-sm" onClick={handleConvert} disabled={isPending}>
      {isPending ? (
        "Omzetten..."
      ) : (
        <>
          <FilePlus className="h-4 w-4" aria-hidden />
          Maak factuur
        </>
      )}
    </Button>
  );
}
