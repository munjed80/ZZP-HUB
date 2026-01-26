/**
 * BTW Accountant Snapshot
 *
 * Displays a quick overview card for accountants working on a client's BTW-aangifte.
 * Only shown when an accountant is viewing a client company context.
 */

import { Euro, Calendar, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBedrag } from "@/lib/utils";

interface BTWAccountantSnapshotProps {
  /** BTW balance amount (positive = te betalen, negative = terug te krijgen) */
  btwSaldo: number;
  /** Selected quarter (1-4) */
  quarter: number;
  /** Selected year */
  year: number;
  /** Whether there is revenue data */
  hasRevenue: boolean;
  /** Whether there is expense data */
  hasExpenses: boolean;
  /** Company name being viewed */
  companyName?: string | null;
}

/** Quarter labels for display */
const quarterLabels: Record<number, string> = { 1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4" };

/**
 * Determines the status label for the BTW snapshot
 * Based on available data: "Klaar", "Mogelijk onvolledig", or "Controle aanbevolen"
 */
function getStatusInfo(hasRevenue: boolean, hasExpenses: boolean): {
  label: string;
  variant: "success" | "warning" | "muted";
  description: string;
} {
  if (hasRevenue && hasExpenses) {
    return {
      label: "Klaar",
      variant: "success",
      description: "Alle gegevens lijken volledig.",
    };
  }

  if (!hasRevenue && !hasExpenses) {
    return {
      label: "Mogelijk onvolledig",
      variant: "warning",
      description: "Geen facturen of kosten gevonden voor deze periode.",
    };
  }

  return {
    label: "Controle aanbevolen",
    variant: "muted",
    description: hasRevenue
      ? "Geen kosten gevonden. Controleer of alle uitgaven zijn verwerkt."
      : "Geen facturen gevonden. Controleer of alle omzet is verwerkt.",
  };
}

export function BTWAccountantSnapshot({
  btwSaldo,
  quarter,
  year,
  hasRevenue,
  hasExpenses,
  companyName,
}: BTWAccountantSnapshotProps) {
  const status = getStatusInfo(hasRevenue, hasExpenses);
  const isTeBetalen = btwSaldo >= 0;

  return (
    <Card className="border-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-gradient-to-r from-sky-500 to-sky-600"></span>
            BTW Snapshot
            {companyName && (
              <span className="text-sm font-normal text-muted-foreground">
                · {companyName}
              </span>
            )}
          </CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BTW Saldo */}
        <div className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                isTeBetalen
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <Euro className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BTW Saldo</p>
              <p className="text-lg font-bold text-foreground">
                {formatBedrag(Math.abs(btwSaldo))}
              </p>
            </div>
          </div>
          <Badge variant={isTeBetalen ? "warning" : "success"}>
            {isTeBetalen ? "Te betalen" : "Terug te krijgen"}
          </Badge>
        </div>

        {/* Period Info */}
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Periode:</span>
          <span className="text-sm font-semibold text-foreground">
            {quarterLabels[quarter]} {year}
          </span>
        </div>

        {/* Status Description */}
        <p className="text-xs text-muted-foreground">{status.description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Checklist item interface for accountant review
 */
interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface BTWAccountantChecklistProps {
  /** Whether invoices have been found/processed */
  hasInvoices: boolean;
  /** Whether expenses have been found/processed */
  hasExpenses: boolean;
  /** Selected quarter (1-4) */
  quarter: number;
}

/**
 * BTW Accountant Checklist
 *
 * Visual-only checklist for accountants to see at a glance what's complete.
 * Non-blocking and informational only - does not prevent any actions.
 */
export function BTWAccountantChecklist({
  hasInvoices,
  hasExpenses,
  quarter,
}: BTWAccountantChecklistProps) {
  const checklistItems: ChecklistItem[] = [
    {
      id: "invoices",
      label: "Facturen verwerkt",
      checked: hasInvoices,
    },
    {
      id: "expenses",
      label: "Kosten verwerkt",
      checked: hasExpenses,
    },
    {
      id: "btw-rules",
      label: "BTW-tarieven gecontroleerd",
      checked: true, // Visual reminder only - manual verification required
    },
    {
      id: "period",
      label: "Periode geselecteerd",
      checked: quarter >= 1 && quarter <= 4,
    },
  ];

  const completedCount = checklistItems.filter((item) => item.checked).length;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">Accountant Checklist</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {completedCount}/{checklistItems.length}
        </span>
      </div>
      <ul className="space-y-2">
        {checklistItems.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            {item.checked ? (
              <CheckCircle2
                className="h-4 w-4 text-emerald-500 flex-shrink-0"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="h-4 w-4 text-amber-500 flex-shrink-0"
                aria-hidden="true"
              />
            )}
            <span
              className={
                item.checked ? "text-muted-foreground" : "text-foreground font-medium"
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3">
        Deze checklist is alleen ter informatie en blokkeert geen acties.
      </p>
    </div>
  );
}
