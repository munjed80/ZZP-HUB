import { AlertTriangle, ArrowDownRight, ArrowUpRight, Euro, Gauge, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatBedrag } from "@/lib/utils";
import { RevenueExpensesChart } from "@/components/dashboard/revenue-expenses-chart";
import { DistributionDonut } from "@/components/dashboard/distribution-donut";
import { getDashboardStats } from "@/actions/get-dashboard-stats";
import { DEFAULT_VAT_RATE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overzicht van uw financiële situatie, omzet, uitgaven en BTW-aangifte.",
};

export default async function DashboardPagina() {
  const stats = await getDashboardStats();
  const now = new Date();
  const thisMonthIndex = now.getMonth();
  const previousMonthIndex = thisMonthIndex === 0 ? 0 : thisMonthIndex - 1;
  const thisMonth = stats.monthlyChartData[thisMonthIndex] ?? { revenue: 0, expenses: 0 };
  const previousMonth = stats.monthlyChartData[previousMonthIndex] ?? { revenue: 0, expenses: 0 };
  const thisMonthProfit = thisMonth.revenue - thisMonth.expenses;
  const previousMonthProfit = previousMonth.revenue - previousMonth.expenses;
  const VAT_TREND_RATE = DEFAULT_VAT_RATE;
  const currentVatBalance = (thisMonth.revenue - thisMonth.expenses) * VAT_TREND_RATE;
  const previousVatBalance = (previousMonth.revenue - previousMonth.expenses) * VAT_TREND_RATE;

  const buildTrend = (current: number, previous: number, invert = false) => {
    const change =
      previous === 0
        ? current === 0
          ? 0
          : 100
        : ((current - previous) / previous) * 100;
    const label = `${change >= 0 ? "+" : ""}${Number.isFinite(change) ? change.toFixed(0) : "0"}% vs vorige maand`;
    const positive = invert ? change <= 0 : change >= 0;

    return {
      label,
      variant: change === 0 ? "muted" : positive ? "success" : "destructive",
    } as const;
  };

  const chartData = stats.monthlyChartData.map((item) => ({
    month: item.name,
    omzet: item.revenue,
    kosten: item.expenses,
  }));

  const kpis = [
    {
      label: "Omzet (jaar)",
      value: stats.yearlyRevenue,
      icon: ArrowUpRight,
      iconColor: "text-[#2f9e7c]",
      iconBg: "bg-[#e7f6f0]",
      gradient: "from-white via-[#e7f3f8] to-[#e0f2ec]",
      trend: buildTrend(thisMonth.revenue, previousMonth.revenue),
    },
    {
      label: "Uitgaven (jaar)",
      value: stats.yearlyExpenses,
      icon: ArrowDownRight,
      iconColor: "text-[#4a6fa5]",
      iconBg: "bg-[#e8f0fa]",
      gradient: "from-white via-[#eef3fa] to-[#e6edf7]",
      trend: buildTrend(thisMonth.expenses, previousMonth.expenses, true),
    },
    {
      label: "Winst",
      value: stats.netProfit,
      icon: Euro,
      iconColor: "text-[#0f4c5c]",
      iconBg: "bg-[#e5f0f4]",
      gradient: "from-white via-[#e7f1f5] to-[#d9e8ef]",
      trend: buildTrend(thisMonthProfit, previousMonthProfit),
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      iconColor: "text-[#c56d0a]",
      iconBg: "bg-[#fff4e5]",
      gradient: "from-white via-[#fff6eb] to-[#ffe9cc]",
      trend: buildTrend(currentVatBalance, previousVatBalance, true),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">
          Financieel overzicht {now.getFullYear()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.label}
              className={cn(
                "relative overflow-hidden rounded-2xl bg-gradient-to-br border-[var(--border)] shadow-md shadow-slate-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl",
                item.gradient,
              )}
            >
              <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/50 blur-3xl" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                    {item.label}
                  </CardTitle>
                  <div className={cn("rounded-xl p-2 shadow-inner shadow-white/70 ring-1 ring-white/60 backdrop-blur", item.iconBg)}>
                    <Icon className={cn("h-4 w-4", item.iconColor)} aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <p className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={item.trend.variant} className="inline-flex items-center gap-1 text-xs shadow-sm shadow-white/40">
                  {item.trend.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.65fr_1.05fr]">
        <Card className="rounded-2xl bg-gradient-to-br from-white via-[#f3f7fb] to-[#e9f1f5] border-[var(--border)] shadow-md shadow-slate-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[var(--foreground)]">Omzet vs kosten</CardTitle>
            <p className="text-sm text-[var(--muted)]">Maandelijks overzicht {now.getFullYear()}</p>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={chartData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl bg-gradient-to-br from-white via-[#e9f2f5] to-[#dff1ed] border-[var(--border)] shadow-md shadow-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/80 p-2.5 shadow-inner shadow-white/70 ring-1 ring-white/50">
                  <PiggyBank className="h-5 w-5 text-[#0f4c5c]" aria-hidden />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-medium text-[var(--foreground)]">IB reservering</CardTitle>
                  <p className="text-sm text-[var(--muted)] mt-0.5">35% buffer voor belasting</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {formatBedrag(stats.incomeTaxReservation)}
              </p>
              <Badge variant="info" className="text-xs">
                Op basis van winst {formatBedrag(stats.netProfit)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#e8f0fa] p-2">
                  <Gauge className="h-5 w-5 text-[#4a6fa5]" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-base font-medium text-[var(--foreground)]">Verdeling resultaten</CardTitle>
                  <p className="text-sm text-[var(--muted)]">Omzet, kosten en winst</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DistributionDonut
                revenue={stats.yearlyRevenue}
                expenses={stats.yearlyExpenses}
                profit={stats.netProfit}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[var(--foreground)]">Recente facturen</CardTitle>
            <p className="text-sm text-[var(--muted)]">Laatste 5 definitieve facturen</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[var(--border-subtle)]">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{invoice.invoiceNum}</p>
                    <p className="text-sm text-[var(--muted)] truncate">{invoice.client.name}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                      {formatBedrag(
                        invoice.lines.reduce(
                          (sum, line) =>
                            sum + Number(line.amount ?? Number(line.quantity) * Number(line.price)),
                          0,
                        ),
                      )}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(invoice.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white/95 border-[var(--border)] shadow-md shadow-slate-200/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[var(--foreground)]">Recente uitgaven</CardTitle>
            <p className="text-sm text-[var(--muted)]">Laatste 5 geregistreerde uitgaven</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[var(--border-subtle)]">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {expense.description}
                    </p>
                    <p className="text-sm text-[var(--muted)]">{expense.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                      {formatBedrag(Number(expense.amountExcl))}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(expense.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
