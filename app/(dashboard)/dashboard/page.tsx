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
      color: "text-[#10B981]",
      bg: "bg-emerald-50",
      trend: buildTrend(thisMonth.revenue, previousMonth.revenue),
    },
    {
      label: "Uitgaven (jaar)",
      value: stats.yearlyExpenses,
      icon: ArrowDownRight,
      color: "text-[#4A5568]",
      bg: "bg-slate-100",
      trend: buildTrend(thisMonth.expenses, previousMonth.expenses, true),
    },
    {
      label: "Winst",
      value: stats.netProfit,
      icon: Euro,
      color: "text-teal-600",
      bg: "bg-teal-50",
      trend: buildTrend(thisMonthProfit, previousMonthProfit),
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
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
            <Card key={item.label}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    {item.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={item.trend.variant} className="text-xs">{item.trend.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-900">Omzet vs kosten</CardTitle>
            <p className="text-sm text-slate-600">Maandelijks overzicht {now.getFullYear()}</p>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-100 p-2.5">
                <PiggyBank className="h-5 w-5 text-slate-600" aria-hidden />
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
        <Card>
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

        <Card>
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
