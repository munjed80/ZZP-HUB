"use client";

import { AlertCircle, Archive, FileSpreadsheet, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBedrag } from "@/lib/utils";
import type { NormalizedPeriod } from "@/lib/period";
import Link from "next/link";

type AccountantOverviewProps = {
  period: NormalizedPeriod;
  vatToPay: number;
  unpaidCount: number;
  unpaidTotal: number;
  expensesNeedingReview: number;
  exportHref?: string;
  canEdit?: boolean;
};

const formatRangeLabel = (period: NormalizedPeriod) => {
  const from = period.from.toLocaleDateString("nl-NL");
  const to = period.to.toLocaleDateString("nl-NL");
  return `${from} – ${to}`;
};

export function AccountantOverview({
  period,
  vatToPay,
  unpaidCount,
  unpaidTotal,
  expensesNeedingReview,
  exportHref = "/api/export/invoices?format=csv",
  canEdit = false,
}: AccountantOverviewProps) {
  const cards = [
    {
      title: "BTW positie",
      value: vatToPay === 0 ? "Geen saldo" : formatBedrag(vatToPay),
      subtitle: vatToPay > 0 ? "Te betalen" : vatToPay < 0 ? "Terug te vragen" : "Geen openstaande BTW",
      icon: ReceiptText,
      variant: vatToPay > 0 ? "warning" : vatToPay < 0 ? "success" : "secondary",
    },
    {
      title: "Openstaande facturen",
      value: unpaidCount === 0 ? "Geen" : `${unpaidCount} · ${formatBedrag(unpaidTotal)}`,
      subtitle: unpaidCount === 0 ? "Geen onbetaalde facturen" : "Te innen bij klanten",
      icon: AlertCircle,
      variant: unpaidCount === 0 ? "secondary" : "info",
    },
    {
      title: "Uitgaven review",
      value: expensesNeedingReview === 0 ? "Alles verwerkt" : `${expensesNeedingReview} open`,
      subtitle: expensesNeedingReview === 0 ? "Geen actie nodig" : "Controleer bonnen",
      icon: Archive,
      variant: expensesNeedingReview === 0 ? "secondary" : "accent",
    },
    {
      title: "Exporteren",
      value: "CSV / PDF",
      subtitle: "Snel exporteren",
      icon: FileSpreadsheet,
      variant: "primary",
      action: (
        <Link
          href={exportHref}
          className="inline-flex items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          aria-disabled={!canEdit}
          onClick={(e) => {
            if (!canEdit) e.preventDefault();
          }}
          title={canEdit ? "Download" : "Alleen zichtbaar"}
        >
          Download
        </Link>
      ),
    },
  ];

  const hasData = vatToPay !== 0 || unpaidCount > 0 || expensesNeedingReview > 0;

  return (
    <Card className="border border-primary/15 shadow-sm">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-primary to-emerald-500" />
            Accountant overzicht
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatRangeLabel(period)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/80 p-3 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.14)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {card.title}
                      </p>
                    </div>
                    <Badge variant={card.variant as any}>{card.subtitle}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  {card.action ? <div>{card.action}</div> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Geen data in deze periode"
            description="Er zijn geen facturen of uitgaven gevonden voor de gekozen periode."
          />
        )}
      </CardContent>
    </Card>
  );
}
