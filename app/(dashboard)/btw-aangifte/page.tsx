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
  const finalColor =
    report.totalDue > 0 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">BTW-aangifte</h1>
        <p className="text-sm text-slate-600">
          Bereken je aangifte per kwartaal met officiële rubrieken zoals bij de Belastingdienst.
        </p>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Kwartaal & jaar</CardTitle>
          <form className="flex flex-wrap gap-3" method="get">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Jaar
              <select
                name="year"
                defaultValue={selectedYear}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Kwartaal
              <select
                name="quarter"
                defaultValue={selectedQuarter}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Berekenen
            </button>
          </form>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Percent className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Rubriek berekening voor {quarterLabels[report.quarter]} {report.year}
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
            <Info className="h-4 w-4" aria-hidden="true" />
            <p>Let op: Als je meedoet aan de KOR, hoef je geen BTW-aangifte te doen.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Omzet (Prestaties)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Rubriek 1a · 21%</p>
                  <p className="text-xs text-slate-600">Omzet tegen 21% en verschuldigde BTW</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Omzet: {formatBedrag(report.rubriek1a.base)}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    BTW: {formatBedrag(report.rubriek1a.vat)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Rubriek 1b · 9%</p>
                  <p className="text-xs text-slate-600">Omzet tegen 9% en verschuldigde BTW</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Omzet: {formatBedrag(report.rubriek1b.base)}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    BTW: {formatBedrag(report.rubriek1b.vat)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Rubriek 1e · 0% / verlegd</p>
                  <p className="text-xs text-slate-600">Omzet met 0% of verlegde BTW</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    Omzet: {formatBedrag(report.rubriek1e.base)}
                  </p>
                  <p className="text-xs text-slate-500">BTW: n.v.t.</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Totaal omzet: {formatBedrag(report.revenueTotal)} · Totaal verschuldigde BTW:{" "}
              {formatBedrag(report.totalSalesVat)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Voorbelasting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Rubriek 5b</p>
                  <p className="text-xs text-slate-600">Aftrekbare BTW op uitgaven</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatBedrag(report.deductibleVat)}</p>
              </div>
              <p className="text-xs text-slate-600">
                Totale kosten (excl. BTW): {formatBedrag(report.expenseTotal)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Eindbedrag</CardTitle>
                <p className="text-sm text-slate-600">{finalLabel}</p>
              </div>
              <Badge variant={report.totalDue > 0 ? "warning" : "success"}>{finalLabel}</Badge>
            </CardHeader>
            <CardContent>
              <div className={`rounded-lg p-4 text-lg font-semibold ${finalColor}`}>
                {formatBedrag(report.totalDue)}
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Totaal verschuldigde BTW ({formatBedrag(report.totalSalesVat)}) minus voorbelasting (
                {formatBedrag(report.deductibleVat)}).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Controlepunten</CardTitle>
            <p className="text-sm text-slate-600">Align met Belastingdienst rubrieken</p>
          </div>
          <Badge variant="info">Checklist</Badge>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
              <span>Controleer intracommunautaire prestaties en verlegde BTW (rubriek 3 & 4 indien van toepassing).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
              <span>Controleer correcties privégebruik en eventuele kleine ondernemersregeling (KOR).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
              <span>Bewaar onderbouwing van omzet, uitgaven en BTW-tarieven voor audit trail.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
