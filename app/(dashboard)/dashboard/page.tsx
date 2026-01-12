import { AlertTriangle, ArrowDownRight, ArrowUpRight, Euro, Gauge, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatBedrag } from "@/lib/utils";
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

  const kpis = [
    {
      label: "Omzet (jaar)",
      value: stats.yearlyRevenue,
      icon: ArrowUpRight,
      iconColor: "text-success",
      iconBg: "bg-success/10",
    },
    {
      label: "Uitgaven (jaar)",
      value: stats.yearlyExpenses,
      icon: ArrowDownRight,
      iconColor: "text-accent",
      iconBg: "bg-accent/10",
    },
    {
      label: "Winst",
      value: stats.netProfit,
      icon: Euro,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
  ];

  const getTrendForKpi = (label: string) => {
    switch (label) {
      case "Omzet (jaar)":
        return buildTrend(thisMonth.revenue, previousMonth.revenue);
      case "Uitgaven (jaar)":
        return buildTrend(thisMonth.expenses, previousMonth.expenses, true);
      case "Winst":
        return buildTrend(thisMonthProfit, previousMonthProfit);
      case "Te betalen BTW":
        return buildTrend(currentVatBalance, previousVatBalance, true);
      default:
        return { label: "", variant: "muted" as const };
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Financieel overzicht {now.getFullYear()}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          const trend = getTrendForKpi(item.label);

          return (
            <Card
              key={item.label}
              className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    {item.label}
                  </CardTitle>
                  <div className={cn("rounded-2xl p-3 shadow-md ring-1 ring-border/40 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:ring-emerald-200/50 dark:group-hover:ring-emerald-700/50", item.iconBg)}>
                    <Icon className={cn("h-5 w-5 transition-transform duration-500 group-hover:scale-110", item.iconColor)} aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <p className="text-3xl font-bold tabular-nums text-foreground transition-all duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={trend.variant} className="inline-flex items-center gap-1.5 text-xs shadow-sm font-semibold">
                  {trend.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4 sm:space-y-5">
        <Card className="group transition-all duration-300 hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.15)]">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 p-3.5 shadow-md ring-1 ring-blue-200/40 dark:ring-blue-700/40 group-hover:scale-105 transition-transform duration-300">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden />
              </div>
              <div className="flex-1">
                <CardTitle>IB reservering</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 font-medium">35% buffer voor belasting</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatBedrag(stats.incomeTaxReservation)}
            </p>
            <Badge variant="info" className="text-xs font-semibold">
              Op basis van winst {formatBedrag(stats.netProfit)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.15)]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-teal-500/15 to-teal-500/5 p-3.5 shadow-md ring-1 ring-teal-200/40 dark:ring-teal-700/40 group-hover:scale-105 transition-transform duration-300">
                <Gauge className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden />
              </div>
              <div>
                <CardTitle>Verdeling resultaten</CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">Omzet, kosten en winst</p>
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

      <div className="grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-2">
        <Card className="group transition-all duration-300 hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.15)]">
          <CardHeader className="pb-5">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-1 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></span>
                Recente facturen
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">Laatste 5 definitieve facturen</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-3 -mx-3 rounded-xl transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{invoice.invoiceNum}</p>
                    <p className="text-sm text-muted-foreground truncate font-medium mt-0.5">{invoice.client.name}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {formatBedrag(
                        invoice.lines.reduce(
                          (sum, line) =>
                            sum + Number(line.amount ?? Number(line.quantity) * Number(line.price)),
                          0,
                        ),
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(invoice.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.15)]">
          <CardHeader className="pb-5">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-1 w-10 rounded-full bg-gradient-to-r from-rose-500 to-orange-500"></span>
                Recente uitgaven
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">Laatste 5 geregistreerde uitgaven</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-3 -mx-3 rounded-xl transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {expense.description}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">{expense.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {formatBedrag(Number(expense.amountExcl))}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
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
