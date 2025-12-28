import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { RevenueExpensesChart } from "@/components/dashboard/revenue-expenses-chart";
import { getDashboardStats } from "@/actions/get-dashboard-stats";

export default async function DashboardPagina() {
  const stats = await getDashboardStats();
  const now = new Date();

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
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Kosten (jaar)",
      value: stats.yearlyExpenses,
      icon: ArrowDownRight,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Winst",
      value: stats.netProfit,
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Te betalen BTW",
      value: stats.vatToPay,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Overzicht van je financiële gezondheid in {now.getFullYear()}. Alle bedragen zijn exclusief BTW.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
                <span className={`rounded-full p-2 ${item.bg}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} aria-hidden />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{formatBedrag(item.value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Omzet vs kosten per maand</CardTitle>
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
              <CardTitle>Inkomstenbelasting reservering</CardTitle>
              <p className="text-sm text-slate-600">Zet dit opzij voor de belastingdienst (35% buffer).</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{formatBedrag(stats.incomeTaxReservation)}</p>
            <p className="mt-2 text-sm text-slate-600">
              Gebaseerd op je huidige winst: {formatBedrag(stats.netProfit)}.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Recente facturen</CardTitle>
            <p className="text-sm text-slate-600">Laatste 5 definitieve facturen</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
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
            <CardTitle>Recente uitgaven</CardTitle>
            <p className="text-sm text-slate-600">Laatste 5 geregistreerde uitgaven</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
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
