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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary via-accent to-success"></div>
          <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium pl-15">
          Financieel overzicht {now.getFullYear()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          const trend = getTrendForKpi(item.label);

          return (
            <Card
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/30"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl transition-opacity duration-300 group-hover:opacity-80" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-tr from-accent/5 to-transparent blur-2xl" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.label}
                  </CardTitle>
                  <div className={cn("rounded-2xl p-2.5 shadow-lg ring-2 ring-border/30 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:ring-primary/40", item.iconBg)}>
                    <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", item.iconColor)} aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <p className="text-3xl font-bold tabular-nums text-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-105">
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={trend.variant} className="inline-flex items-center gap-1.5 text-xs shadow-md font-bold">
                  {trend.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.65fr_1.05fr]">
        <Card className="group rounded-2xl shadow-lg border-2 hover:shadow-2xl hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-accent"></span>
              Omzet vs kosten
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Maandelijks overzicht {now.getFullYear()}</p>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={chartData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="group rounded-2xl shadow-lg border-2 hover:shadow-2xl hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 shadow-lg ring-2 ring-primary/30 group-hover:scale-105 transition-transform duration-300">
                  <PiggyBank className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-card-foreground">IB reservering</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5 font-medium">35% buffer voor belasting</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatBedrag(stats.incomeTaxReservation)}
              </p>
              <Badge variant="info" className="text-xs font-bold">
                Op basis van winst {formatBedrag(stats.netProfit)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="group rounded-2xl shadow-lg border-2 hover:shadow-2xl hover:border-accent/20 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 p-3 shadow-lg ring-2 ring-accent/30 group-hover:scale-105 transition-transform duration-300">
                  <Gauge className="h-6 w-6 text-accent" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-card-foreground">Verdeling resultaten</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">Omzet, kosten en winst</p>
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
        <Card className="group rounded-2xl shadow-lg border-2 hover:shadow-2xl hover:border-success/20 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-success to-primary"></span>
              Recente facturen
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Laatste 5 definitieve facturen</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-lg transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{invoice.invoiceNum}</p>
                    <p className="text-sm text-muted-foreground truncate font-medium">{invoice.client.name}</p>
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
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(invoice.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="group rounded-2xl shadow-lg border-2 hover:shadow-2xl hover:border-destructive/20 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-destructive to-accent"></span>
              Recente uitgaven
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Laatste 5 geregistreerde uitgaven</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-lg transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {expense.description}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">{expense.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {formatBedrag(Number(expense.amountExcl))}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
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
