import { AlertTriangle, ArrowDownRight, ArrowUpRight, Euro, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatBedrag } from "@/lib/utils";
import { RevenueExpensesChart } from "@/components/dashboard/revenue-expenses-chart";
import { getDashboardStats } from "@/actions/get-dashboard-stats";

export default async function DashboardPagina() {
  const stats = await getDashboardStats();
  const now = new Date();
  const thisMonthIndex = Math.max(0, now.getMonth());
  const previousMonthIndex = Math.max(0, thisMonthIndex - 1);
  const thisMonth = stats.monthlyChartData[thisMonthIndex] ?? { revenue: 0, expenses: 0 };
  const previousMonth = stats.monthlyChartData[previousMonthIndex] ?? { revenue: 0, expenses: 0 };
  const thisMonthProfit = thisMonth.revenue - thisMonth.expenses;
  const previousMonthProfit = previousMonth.revenue - previousMonth.expenses;

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
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: buildTrend(thisMonthProfit, previousMonthProfit),
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: buildTrend(
        thisMonth.revenue * 0.21 - thisMonth.expenses * 0.21,
        previousMonth.revenue * 0.21 - previousMonth.expenses * 0.21,
        true,
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-xs md:text-sm text-slate-600">
          Overzicht van je financiële gezondheid in {now.getFullYear()}. Alle bedragen zijn exclusief BTW.
        </p>
      </div>

      <div className="grid gap-4 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          const isPrimaryMetric = item.label.startsWith("Omzet") || item.label.startsWith("Uitgaven");

          return (
            <Card key={item.label} className="bg-white shadow-sm">
              <CardHeader className="space-y-1.5 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full p-2 ${item.bg}`}>
                    <Icon className={`h-4 w-4 ${item.color}`} aria-hidden />
                  </span>
                  <CardTitle
                    className={cn(
                      "text-xs md:text-sm font-semibold text-slate-700",
                      isPrimaryMetric && "text-[13px] uppercase tracking-[0.16em] text-[#0A2E50]",
                    )}
                  >
                    {item.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className={cn(
                    "text-xl md:text-2xl font-semibold text-slate-900",
                    isPrimaryMetric && "text-3xl md:text-[32px] font-bold tracking-tight text-[#0A2E50]",
                  )}
                >
                  {formatBedrag(item.value)}
                </p>
                <Badge variant={item.trend.variant}>{item.trend.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Omzet vs kosten per maand</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-full bg-slate-100 p-2">
              <PiggyBank className="h-5 w-5 text-blue-600" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base">Inkomstenbelasting reservering</CardTitle>
              <p className="text-xs md:text-sm text-slate-600">Zet dit opzij voor de belastingdienst (35% buffer).</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-semibold text-slate-900">{formatBedrag(stats.incomeTaxReservation)}</p>
            <p className="mt-2 text-xs md:text-sm text-slate-600">
              Gebaseerd op je huidige winst: {formatBedrag(stats.netProfit)}.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Recente facturen</CardTitle>
            <p className="text-xs md:text-sm text-slate-600">Laatste 5 definitieve facturen</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="border-b border-slate-100 px-2 py-2">Nummer</th>
                  <th className="border-b border-slate-100 px-2 py-2">Klant</th>
                  <th className="border-b border-slate-100 px-2 py-2">Datum</th>
                  <th className="border-b border-slate-100 px-2 py-2 text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-50 px-2 py-2 font-medium text-slate-900">{invoice.invoiceNum}</td>
                    <td className="border-b border-slate-50 px-2 py-2 text-slate-700">{invoice.client.name}</td>
                    <td className="border-b border-slate-50 px-2 py-2 text-slate-600">
                      {new Intl.DateTimeFormat("nl-NL").format(invoice.date)}
                    </td>
                    <td className="border-b border-slate-50 px-2 py-2 text-right font-semibold text-slate-900">
                      {formatBedrag(
                        invoice.lines.reduce(
                          (sum, line) =>
                            sum + Number(line.amount ?? Number(line.quantity) * Number(line.price)),
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Recente uitgaven</CardTitle>
            <p className="text-xs md:text-sm text-slate-600">Laatste 5 geregistreerde uitgaven</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="border-b border-slate-100 px-2 py-2">Omschrijving</th>
                  <th className="border-b border-slate-100 px-2 py-2">Categorie</th>
                  <th className="border-b border-slate-100 px-2 py-2">Datum</th>
                  <th className="border-b border-slate-100 px-2 py-2 text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-50 px-2 py-2 font-medium text-slate-900">
                      {expense.description}
                    </td>
                    <td className="border-b border-slate-50 px-2 py-2 text-slate-700">{expense.category}</td>
                    <td className="border-b border-slate-50 px-2 py-2 text-slate-600">
                      {new Intl.DateTimeFormat("nl-NL").format(expense.date)}
                    </td>
                    <td className="border-b border-slate-50 px-2 py-2 text-right font-semibold text-slate-900">
                      {formatBedrag(Number(expense.amountExcl))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
