import { Info, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { getVatReport } from "./actions";

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

export default async function BtwPagina({ searchParams }: { searchParams?: SearchParams }) {
  const currentYear = new Date().getFullYear();
  const activeQuarter = getActiveQuarter();

  const selectedYear = parseYear(searchParams?.year, currentYear);
  const selectedQuarter = parseQuarter(searchParams?.quarter, activeQuarter);

  const report = await getVatReport(selectedYear, selectedQuarter);
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const finalLabel = report.totalDue >= 0 ? "Te betalen" : "Terug te vragen";
  const finalVariant = report.totalDue > 0 ? "warning" : "success";
  const finalTone =
    report.totalDue > 0
      ? "from-[#fff4e5] via-white to-[#ffe7c2]"
      : "from-[#e7f6f0] via-white to-[#d5f1e3]";

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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">BTW-aangifte</h1>
        <p className="text-sm text-[var(--muted)]">
          Bereken je aangifte per kwartaal met officiële rubrieken zoals bij de Belastingdienst.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
            <div>
              <CardTitle>Kwartaal & jaar</CardTitle>
              <p className="text-sm text-[var(--muted)]">Directe herberekening zonder het dashboard te verlaten.</p>
            </div>
            <form className="flex flex-wrap gap-3" method="get" aria-live="polite">
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                Jaar
                <select
                  name="year"
                  defaultValue={selectedYear}
                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-inner shadow-slate-100"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                Kwartaal
                <select
                  name="quarter"
                  defaultValue={selectedQuarter}
                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-inner shadow-slate-100"
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
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f4c5c] via-[#1b6b7a] to-[#2f9e7c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-200/50 transition hover:-translate-y-0.5"
              >
                <Percent className="h-4 w-4" aria-hidden="true" />
                Berekenen
              </button>
            </form>
          </CardHeader>
          <CardContent className="space-y-3" aria-live="polite">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
              <Percent className="h-4 w-4 text-[#4a6fa5]" aria-hidden="true" />
              Rubriek berekening voor {quarterLabels[report.quarter]} {report.year}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#8b5b0b] ring-1 ring-[#ffe2b8]">
              <Info className="h-4 w-4" aria-hidden="true" />
              <p>Let op: Als je meedoet aan de KOR, hoef je geen BTW-aangifte te doen.</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${finalTone} border-[var(--border)] shadow-lg shadow-amber-100/40`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Eindbedrag</CardTitle>
              <p className="text-sm text-[var(--muted)]">{finalLabel}</p>
            </div>
            <Badge variant={finalVariant}>{finalLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-white/70 p-4 text-2xl font-semibold text-[var(--foreground)] shadow-inner shadow-white/60">
              {formatBedrag(report.totalDue)}
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                <span className="font-semibold text-[var(--foreground)]">Totaal verschuldigde BTW</span>
                <span className="font-semibold">{formatBedrag(report.totalSalesVat)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                <span className="font-semibold text-[var(--foreground)]">Voorbelasting (5b)</span>
                <span className="font-semibold">{formatBedrag(report.deductibleVat)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Eindbedrag = verschuldigde BTW - voorbelasting. Gebruik deze kaart voor je aangifte of reservering.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
          <CardHeader>
            <CardTitle>Omzet (Prestaties)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {omzetRubrieken.map((rubriek) => (
                <div
                  key={rubriek.key}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{rubriek.title}</p>
                      <p className="text-xs text-[var(--muted)]">{rubriek.description}</p>
                    </div>
                    <Badge variant="info">Rubriek {rubriek.key}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--muted)]">Omzet</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatBedrag(rubriek.base)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--muted)]">BTW</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {rubriek.vat ? formatBedrag(rubriek.vat) : "n.v.t."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[var(--background-secondary)] p-3 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
              Totaal omzet: {formatBedrag(report.revenueTotal)} · Totaal verschuldigde BTW:{" "}
              {formatBedrag(report.totalSalesVat)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
            <CardHeader>
              <CardTitle>Voorbelasting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Rubriek 5b</p>
                  <p className="text-xs text-[var(--muted)]">Aftrekbare BTW op uitgaven</p>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{formatBedrag(report.deductibleVat)}</p>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Totale kosten (excl. BTW): {formatBedrag(report.expenseTotal)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Controlepunten</CardTitle>
                <p className="text-sm text-[var(--muted)]">Align met Belastingdienst rubrieken</p>
              </div>
              <Badge variant="info">Checklist</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#4a6fa5]" />
                  <span>Controleer intracommunautaire prestaties en verlegde BTW (rubriek 3 & 4 indien van toepassing).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#4a6fa5]" />
                  <span>Controleer correcties privégebruik en eventuele kleine ondernemersregeling (KOR).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#4a6fa5]" />
                  <span>Bewaar onderbouwing van omzet, uitgaven en BTW-tarieven voor audit trail.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
