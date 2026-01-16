"use client";

import { formatBedrag } from "@/lib/utils";
import { type mapInvoiceToPdfData } from "@/lib/pdf-generator";
import { InvoiceActionsMenu } from "./invoice-actions-menu";
import { InvoicePaymentStatus } from "./invoice-payment-status";

export type InvoiceCardProps = {
  id: string;
  invoiceNum: string;
  clientName: string;
  status: "open" | "paid" | "concept" | "overdue";
  formattedDate: string;
  formattedDueDate: string;
  isPaid: boolean;
  paidDateLabel: string | null;
  dueLabel: string;
  amount: number;
  pdfInvoice: ReturnType<typeof mapInvoiceToPdfData>;
  recipientEmail?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOverdue?: boolean;
};

const statusClasses: Record<InvoiceCardProps["status"], string> = {
  paid: "bg-success/15 text-success dark:bg-success/20",
  concept: "bg-muted text-muted-foreground dark:bg-muted/80",
  open: "bg-warning/15 text-warning-foreground dark:bg-warning/20",
  overdue: "bg-destructive/15 text-destructive dark:bg-destructive/20",
};

const statusLabels: Record<InvoiceCardProps["status"], string> = {
  paid: "Betaald",
  concept: "Concept",
  open: "Open",
  overdue: "Verlopen",
};

export function InvoiceCard({
  id,
  invoiceNum,
  clientName,
  status,
  formattedDate,
  formattedDueDate,
  isPaid,
  paidDateLabel,
  dueLabel,
  amount,
  pdfInvoice,
  recipientEmail,
  isOpen,
  onOpenChange,
}: InvoiceCardProps) {
  return (
    <div className="bg-card border border-border shadow-sm rounded-xl px-4 py-4 transition hover:-translate-y-[1px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-lg font-bold text-foreground">{clientName}</p>
              <p className="truncate text-sm text-muted-foreground">
                #{invoiceNum} • {formattedDate}
              </p>
            </div>
            <InvoiceActionsMenu
              pdfInvoice={pdfInvoice}
              invoiceId={id}
              editHref={`/facturen/${id}/edit`}
              shareLink={`/facturen/${id}`}
              recipientEmail={recipientEmail}
              isOpen={isOpen}
              onOpenChange={onOpenChange}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {dueLabel} {formattedDueDate}
            </span>
            {paidDateLabel ? (
              <span className="rounded-full bg-success/15 px-3 py-1 text-[11px] font-medium text-success dark:bg-success/20">
                Betaald op {paidDateLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums text-foreground">{formatBedrag(amount)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
              {statusLabels[status]}
            </span>
            <InvoicePaymentStatus invoiceId={id} isPaid={isPaid} paidDateLabel={paidDateLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}
