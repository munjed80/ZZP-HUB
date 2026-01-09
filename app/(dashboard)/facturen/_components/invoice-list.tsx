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
  status: "open" | "paid" | "concept";
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
const statusClasses: Record<InvoiceListItem["status"], string> = {
  paid: "bg-[#ECFDF3] text-[#166534]",
  concept: "bg-[#F3F4F6] text-[#4B5563]",
  open: "bg-[#FFF7ED] text-[#C2410C]",
};
const statusLabels: Record<InvoiceListItem["status"], string> = {
  paid: "Betaald",
  concept: "Concept",
  open: "Open",
};

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
        (status === "paid" && invoice.status === "paid") ||
        (status === "open" && invoice.status !== "paid");
      return matchesQuery && matchesStatus;
    });
  }, [invoices, searchQuery, status]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[#111827] shadow-[0_6px_16px_-12px_rgba(15,23,42,0.18)] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <Search className="h-4 w-4 text-[#6B7280]" aria-hidden />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="search"
              placeholder="Zoek op factuurnummer of klant"
              className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
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
                  className={`flex items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-chip-active-border bg-chip-active text-chip-active-foreground shadow-[0_10px_24px_-18px_rgba(67,56,202,0.35)]"
                      : "border-chip-border bg-chip text-chip-foreground hover:bg-chip-hover"
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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#6B7280]">
          Geen facturen gevonden. Pas je zoekopdracht of status aan.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_44px_-32px_rgba(15,23,42,0.25)] transition hover:-translate-y-[1px]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-lg font-semibold text-[#111827]">{invoice.clientName}</p>
                      <p className="truncate text-sm text-[#6B7280]">
                        #{invoice.invoiceNum} • {invoice.formattedDate}
                      </p>
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
                  <div className="flex flex-wrap gap-3 text-xs text-[#6B7280]">
                    <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[11px] font-medium text-[#4B5563]">
                      {invoice.dueLabel} {invoice.formattedDueDate}
                    </span>
                    {invoice.paidDateLabel ? (
                      <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-[11px] font-medium text-[#166534]">
                        Betaald op {invoice.paidDateLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums text-[#111827]">{formatBedrag(invoice.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[invoice.status]}`}
                    >
                      {statusLabels[invoice.status]}
                    </span>
                    <InvoicePaymentStatus
                      invoiceId={invoice.id}
                      isPaid={invoice.isPaid}
                      paidDateLabel={invoice.paidDateLabel}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
