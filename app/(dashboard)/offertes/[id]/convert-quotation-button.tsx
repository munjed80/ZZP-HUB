"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
        router.push(`/facturen/${result.invoiceId}`);
      } else {
        toast.error(result?.message ?? "Omzetten mislukt.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleConvert}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-amber-600 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? "Omzetten..." : "Omzetten naar Factuur"}
    </button>
  );
}
