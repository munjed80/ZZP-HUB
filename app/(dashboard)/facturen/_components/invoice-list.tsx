"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { formatBedrag } from "@/lib/utils";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { InvoiceActionsMenu } from "./invoice-actions-menu";
import { InvoicePaymentStatus } from "./invoice-payment-status";

export type InvoiceListItem = {
  id: string;
  invoiceNum: string;
  clientName: string;
  formattedDate: string;
  formattedDueDate: string;
  isPaid: boolean;
  paidDateLabel: string | null;
  dueToneClass: string;
  dueLabel: string;
  amount: number;
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
};

type InvoiceListProps = {
  invoices: InvoiceListItem[];
};

const statusOptions = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Open" },
  { value: "paid", label: "Betaald" },
] as const;

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("all");
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesQuery =
        !query ||
        invoice.invoiceNum.toLowerCase().includes(query) ||
        invoice.clientName.toLowerCase().includes(query);
      const matchesStatus =
        status === "all" ||
        (status === "paid" && invoice.isPaid) ||
        (status === "open" && !invoice.isPaid);
      return matchesQuery && matchesStatus;
    });
  }, [invoices, searchQuery, status]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-white/[0.06] p-3 shadow-[0_18px_52px_-30px_rgba(9,95,90,0.6)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white shadow-[0_16px_46px_-32px_rgba(12,140,135,0.7)] ring-1 ring-[#1FBF84]/10">
            <Search className="h-4 w-4 text-[#A8E6DB]" aria-hidden />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="search"
              placeholder="Zoek op factuurnummer of klant"
              className="w-full bg-transparent text-sm placeholder:text-[#9FCBC4] focus:outline-none"
              aria-label="Zoek facturen"
            />
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
            {statusOptions.map((option) => {
              const active = status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-[#0F7E78] via-[#0FA9A3] to-[#0B6A70] text-white shadow-[0_16px_38px_-22px_rgba(12,140,135,0.85)] ring-1 ring-[#1FBF84]/50"
                      : "bg-white/5 text-[#CFEDEA] ring-1 ring-white/5 hover:bg-white/10"
                  }`}
                  aria-pressed={active}
                >
                  <Filter className="h-3.5 w-3.5" aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#CFEDEA] shadow-[0_18px_52px_-32px_rgba(9,95,90,0.6)]">
          Geen facturen gevonden. Pas je zoekopdracht of status aan.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_22px_58px_-32px_rgba(8,71,66,0.65)] backdrop-blur-xl ring-1 ring-[#1FBF84]/12 transition hover:-translate-y-[1px]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{invoice.invoiceNum}</p>
                      <p className="truncate text-sm text-[#CFEDEA]">{invoice.clientName}</p>
                    </div>
                    <InvoiceActionsMenu
                      pdfInvoice={invoice.pdfInvoice}
                      invoiceId={invoice.id}
                      editHref={`/facturen/${invoice.id}/edit`}
                      shareLink={`/facturen/${invoice.id}`}
                      isOpen={openInvoiceId === invoice.id}
                      onOpenChange={(open) => setOpenInvoiceId(open ? invoice.id : null)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[#9FCBC4]">
                    <span>Datum {invoice.formattedDate}</span>
                    <span className={`font-semibold ${invoice.dueToneClass}`}>
                      {invoice.dueLabel} {invoice.formattedDueDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="flex w-full items-start justify-between gap-3 md:w-auto md:justify-end">
                    <div className="text-right">
                      <p className="text-xl font-semibold tabular-nums text-white">{formatBedrag(invoice.amount)}</p>
                      <p className={`text-[12px] ${invoice.dueToneClass}`}>
                        {invoice.dueLabel} {invoice.formattedDueDate}
                      </p>
                    </div>
                  </div>
                  <InvoicePaymentStatus
                    invoiceId={invoice.id}
                    isPaid={invoice.isPaid}
                    paidDateLabel={invoice.paidDateLabel}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
