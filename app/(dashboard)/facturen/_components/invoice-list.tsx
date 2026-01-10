"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { InvoiceCard } from "./invoice-card";

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
            <InvoiceCard
              key={invoice.id}
              id={invoice.id}
              invoiceNum={invoice.invoiceNum}
              clientName={invoice.clientName}
              status={invoice.status}
              formattedDate={invoice.formattedDate}
              formattedDueDate={invoice.formattedDueDate}
              isPaid={invoice.isPaid}
              paidDateLabel={invoice.paidDateLabel}
              dueLabel={invoice.dueLabel}
              amount={invoice.amount}
              pdfInvoice={invoice.pdfInvoice}
              isOpen={openInvoiceId === invoice.id}
              onOpenChange={(open) => setOpenInvoiceId(open ? invoice.id : null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
