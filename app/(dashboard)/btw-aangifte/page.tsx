import { Info, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatBedrag } from "@/lib/utils";
import { getVatReport } from "./actions";
import { BtwReportDownloadButton } from "@/components/pdf/BtwReportDownloadButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BTW Aangifte",
  description: "Overzicht en beheer van uw BTW-aangiften per kwartaal.",
};

type SearchParams = { year?: string; quarter?: string };

function getActiveQuarter() {
  const now = new Date();
  return Math.floor(now.getMonth() / 3) + 1;
}

function parseQuarter(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 4) return parsed;
  return fallback;
}

function parseYear(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 2000 && parsed < 2100) return parsed;
  return fallback;
}

const quarterLabels: Record<number, string> = { 1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4" };

export default async function BtwPagina({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const currentYear = new Date().getFullYear();
  const activeQuarter = getActiveQuarter();

  const selectedYear = parseYear(resolvedSearchParams?.year, currentYear);
  const selectedQuarter = parseQuarter(resolvedSearchParams?.quarter, activeQuarter);

  const report = await getVatReport(selectedYear, selectedQuarter);
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const finalLabel = report.totalDue >= 0 ? "Te betalen" : "Terug te vragen";
  const finalVariant = report.totalDue > 0 ? "warning" : "success";
  const finalTone =
    report.totalDue > 0
      ? "bg-warning/10 border-warning/30 shadow-[0_18px_40px_-26px_rgba(var(--warning),0.35)]"
      : "bg-success/10 border-success/25 shadow-[0_18px_40px_-26px_rgba(var(--success),0.28)]";

  const omzetRubrieken = [
    {
      key: "1a",
      title: "Rubriek 1a · 21%",
      description: "Omzet tegen 21% en verschuldigde BTW",
      base: report.rubriek1a.base,
      vat: report.rubriek1a.vat,
    },
    {
      key: "1b",
      title: "Rubriek 1b · 9%",
      description: "Omzet tegen 9% en verschuldigde BTW",
      base: report.rubriek1b.base,
      vat: report.rubriek1b.vat,
    },
    {
      key: "1e",
      title: "Rubriek 1e · 0% / verlegd",
      description: "Omzet met 0% of verlegde BTW",
      base: report.rubriek1e.base,
      vat: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-warning via-accent to-primary"></div>
            <h1 className="text-3xl font-bold text-foreground">BTW-aangifte</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Bereken je aangifte per kwartaal met officiële rubrieken zoals bij de Belastingdienst.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="shadow-lg border-2 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
            <div>
              <CardTitle className="text-card-foreground font-bold flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-gradient-to-r from-warning to-primary"></span>
                Kwartaal & jaar
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">Directe herberekening zonder het dashboard te verlaten.</p>
            </div>
            <form className="flex flex-wrap gap-3" method="get" aria-live="polite">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Jaar
                <select
                  name="year"
                  defaultValue={selectedYear}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Kwartaal
                <select
                  name="quarter"
                  defaultValue={selectedQuarter}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {([1, 2, 3, 4] as const).map((q) => (
                    <option key={q} value={q}>
                      {quarterLabels[q]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className={buttonVariants(
                  "primary",
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-lg shadow-primary/25"
                )}
              >
                <Percent className="h-4 w-4" aria-hidden="true" />
                Berekenen
              </button>
            </form>
            <BtwReportDownloadButton year={selectedYear} quarter={selectedQuarter} />
          </CardHeader>
          <CardContent className="space-y-3" aria-live="polite">
            <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
              <Percent className="h-4 w-4 text-primary" aria-hidden="true" />
              Rubriek berekening voor {quarterLabels[report.quarter]} {report.year}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning-foreground ring-1 ring-warning/25">
              <Info className="h-4 w-4" aria-hidden="true" />
              <p>Let op: Als je meedoet aan de KOR, hoef je geen BTW-aangifte te doen.</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${finalTone}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Eindbedrag</CardTitle>
              <p className="text-sm text-muted-foreground">{finalLabel}</p>
            </div>
            <Badge variant={finalVariant}>{finalLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-card/90 p-4 text-2xl font-semibold text-foreground ring-1 ring-border/60 shadow-sm">
              {formatBedrag(report.totalDue)}
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg bg-card/90 px-3 py-2 ring-1 ring-border/60">
                <span className="font-semibold text-foreground">Totaal verschuldigde BTW</span>
                <span className="font-semibold">{formatBedrag(report.totalSalesVat)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card/90 px-3 py-2 ring-1 ring-border/60">
                <span className="font-semibold text-foreground">Voorbelasting (5b)</span>
                <span className="font-semibold">{formatBedrag(report.deductibleVat)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Eindbedrag = verschuldigde BTW - voorbelasting. Gebruik deze kaart voor je aangifte of reservering.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Omzet (Prestaties)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {omzetRubrieken.map((rubriek) => (
                <div
                  key={rubriek.key}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rubriek.title}</p>
                      <p className="text-xs text-muted-foreground">{rubriek.description}</p>
                    </div>
                    <Badge variant="info">Rubriek {rubriek.key}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Omzet</p>
                    <p className="text-sm font-semibold text-foreground">{formatBedrag(rubriek.base)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">BTW</p>
                    <p className="text-sm font-semibold text-foreground">
                      {rubriek.vat ? formatBedrag(rubriek.vat) : "n.v.t."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground ring-1 ring-border">
              Totaal omzet: {formatBedrag(report.revenueTotal)} · Totaal verschuldigde BTW:{" "}
              {formatBedrag(report.totalSalesVat)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Voorbelasting (5b)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Aftrekbare BTW</p>
                <p className="text-xs text-muted-foreground">BTW op ingevoerde uitgaven</p>
              </div>
              <p className="text-lg font-bold text-foreground">{formatBedrag(report.deductibleVat)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Totale kosten (excl. BTW): {formatBedrag(report.expenseTotal)}
            </p>
            <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground ring-1 ring-border">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p>Controleer intracommunautaire prestaties en verlegde BTW indien van toepassing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
