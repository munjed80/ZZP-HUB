import { AlertTriangle, ArrowDownRight, ArrowUpRight, Euro, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatBedrag } from "@/lib/utils";
import { RevenueExpensesChart } from "@/components/dashboard/revenue-expenses-chart";
import { getDashboardStats } from "@/actions/get-dashboard-stats";
import { DEFAULT_VAT_RATE } from "@/lib/constants";

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
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100/80",
      gradient: "from-emerald-50 via-white to-teal-50/70",
      trend: buildTrend(thisMonth.revenue, previousMonth.revenue),
    },
    {
      label: "Uitgaven (jaar)",
      value: stats.yearlyExpenses,
      icon: ArrowDownRight,
      iconColor: "text-slate-700",
      iconBg: "bg-slate-100",
      gradient: "from-slate-50 via-white to-slate-100",
      trend: buildTrend(thisMonth.expenses, previousMonth.expenses, true),
    },
    {
      label: "Winst",
      value: stats.netProfit,
      icon: Euro,
      iconColor: "text-teal-600",
      iconBg: "bg-cyan-100/80",
      gradient: "from-teal-50 via-white to-cyan-50",
      trend: buildTrend(thisMonthProfit, previousMonthProfit),
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100/80",
      gradient: "from-amber-50 via-white to-amber-100/60",
      trend: buildTrend(currentVatBalance, previousVatBalance, true),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
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
                "relative overflow-hidden bg-gradient-to-br border-slate-100 shadow-sm hover:shadow-md transition",
                item.gradient,
              )}
            >
              <div className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/40 blur-lg" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    {item.label}
                  </CardTitle>
                  <div className={cn("rounded-xl p-2 shadow-inner shadow-white/80", item.iconBg)}>
                    <Icon className={cn("h-4 w-4", item.iconColor)} aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={item.trend.variant} className="text-xs shadow-sm shadow-white/40">{item.trend.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100/60 border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-900">Omzet vs kosten</CardTitle>
            <p className="text-sm text-slate-600">Maandelijks overzicht {now.getFullYear()}</p>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-teal-50/60 to-cyan-50 border-slate-100">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/70 p-2.5 shadow-inner shadow-white/60">
                <PiggyBank className="h-5 w-5 text-teal-700" aria-hidden />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-medium text-slate-900">IB reservering</CardTitle>
                <p className="text-sm text-slate-600 mt-0.5">35% buffer voor belasting</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatBedrag(stats.incomeTaxReservation)}</p>
            <p className="text-sm text-slate-600">
              Op basis van winst {formatBedrag(stats.netProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/90 border-slate-100 shadow-md shadow-slate-100/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-900">Recente facturen</CardTitle>
            <p className="text-sm text-slate-600">Laatste 5 definitieve facturen</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{invoice.invoiceNum}</p>
                    <p className="text-sm text-slate-600 truncate">{invoice.client.name}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatBedrag(
                        invoice.lines.reduce(
                          (sum, line) =>
                            sum + Number(line.amount ?? Number(line.quantity) * Number(line.price)),
                          0,
                        ),
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(invoice.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border-slate-100 shadow-md shadow-slate-100/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-900">Recente uitgaven</CardTitle>
            <p className="text-sm text-slate-600">Laatste 5 geregistreerde uitgaven</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {expense.description}
                    </p>
                    <p className="text-sm text-slate-600">{expense.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatBedrag(Number(expense.amountExcl))}
                    </p>
                    <p className="text-xs text-slate-500">
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
