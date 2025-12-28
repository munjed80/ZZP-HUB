import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import DashboardShell from "./(dashboard)/layout";
import { RevenueExpensesChart, type ChartPoint } from "@/components/dashboard/revenue-expenses-chart";
import { BtwTarief, InvoiceEmailStatus, type InvoiceLine } from "@prisma/client";

const monthLabels = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const VAT_PERCENTAGES: Record<BtwTarief, number> = {
  [BtwTarief.HOOG_21]: 0.21,
  [BtwTarief.LAAG_9]: 0.09,
  [BtwTarief.NUL_0]: 0,
  [BtwTarief.VRIJGESTELD]: 0,
  [BtwTarief.VERLEGD]: 0,
};
const INCOME_TAX_BUFFER = 0.3;

function getVatPercentage(rate: BtwTarief) {
  return VAT_PERCENTAGES[rate] ?? 0;
}

function calculateLineAmount(line: Pick<InvoiceLine, "amount" | "quantity" | "price">) {
  const amount = line.amount;
  if (amount !== null && amount !== undefined) {
    return Number(amount);
  }
  return Number(line.quantity) * Number(line.price);
}

function formatDatum(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short" }).format(date);
}

function statusLabel(status: InvoiceEmailStatus) {
  switch (status) {
    case InvoiceEmailStatus.BETAALD:
      return "Betaald";
    case InvoiceEmailStatus.VERZONDEN:
      return "Verzonden";
    case InvoiceEmailStatus.HERINNERING:
      return "Herinnering";
    default:
      return "Concept";
  }
}

export default async function DashboardPagina() {
  const userId = getCurrentUserId();
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

  let invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];
  let expenses: Awaited<ReturnType<typeof prisma.expense.findMany>> = [];
  let dataError: string | null = null;

  try {
    [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId,
          date: { gte: startOfYear, lt: endOfYear },
          NOT: { emailStatus: InvoiceEmailStatus.CONCEPT },
        },
        include: { lines: true, client: true },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: startOfYear, lt: endOfYear } },
        orderBy: { date: "desc" },
      }),
    ]);
  } catch (error) {
    console.error("Kon dashboarddata niet ophalen", error);
    dataError = "Gegevens konden niet worden geladen. Er wordt een dashboard zonder gegevens getoond.";
  }

  const monthlyData: ChartPoint[] = monthLabels.map((month) => ({ month, omzet: 0, kosten: 0 }));

  let totalRevenue = 0;
  let totalSalesVat = 0;

  for (const invoice of invoices) {
    const monthIndex = invoice.date.getMonth();
    let invoiceBase = 0;
    for (const line of invoice.lines) {
      const base = calculateLineAmount(line);
      const vatRate = getVatPercentage(line.vatRate);
      totalSalesVat += base * vatRate;
      totalRevenue += base;
      invoiceBase += base;
    }
    monthlyData[monthIndex].omzet += invoiceBase;
  }

  let totalExpenses = 0;
  let totalPurchaseVat = 0;

  expenses.forEach((expense) => {
    const base = Number(expense.amountExcl);
    const vatRate = getVatPercentage(expense.vatRate);
    totalExpenses += base;
    totalPurchaseVat += base * vatRate;
    monthlyData[expense.date.getMonth()].kosten += base;
  });

  const netProfit = totalRevenue - totalExpenses;
  const vatToPay = totalSalesVat - totalPurchaseVat;
  const incomeTaxReservation = Math.max(0, netProfit * INCOME_TAX_BUFFER);

  const recentInvoices = invoices.slice(0, 5);
  const recentExpenses = expenses.slice(0, 5);
  const errorBanner = dataError ? (
    <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
      {dataError}
    </div>
  ) : null;
  const hasData = invoices.length > 0 || expenses.length > 0;

  if (!hasData) {
    return (
      <DashboardShell>
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <Card className="max-w-2xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Welkom bij je nieuwe dashboard</CardTitle>
              <p className="text-sm text-slate-600">
                Start met het aanmaken van je eerste factuur om direct inzicht te krijgen in je omzet, kosten en BTW.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorBanner}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Snelle acties</p>
                  <p className="text-sm text-slate-600">Facturen, uitgaven en relaties voeg je hier razendsnel toe.</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Belasting klaar</p>
                  <p className="text-sm text-slate-600">
                    BTW en inkomstenbelasting reserveringen worden automatisch voor je berekend.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/facturen/nieuw"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Maak je eerste factuur
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/uitgaven"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:ring-slate-300"
                >
                  Voeg een uitgave toe
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const kpis = [
    {
      label: "Omzet (jaar)",
      value: totalRevenue,
      icon: ArrowUpRight,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Kosten (jaar)",
      value: totalExpenses,
      icon: ArrowDownRight,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Winst",
      value: netProfit,
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Te betalen BTW",
      value: vatToPay,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Overzicht van je financiële gezondheid in {now.getFullYear()}. Alle bedragen zijn exclusief BTW.
          </p>
        </div>

        {errorBanner}

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
              <RevenueExpensesChart data={monthlyData} />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-full bg-slate-100 p-2">
                <PiggyBank className="h-5 w-5 text-blue-600" aria-hidden />
              </div>
              <div>
                <CardTitle>Inkomstenbelasting reservering</CardTitle>
                <p className="text-sm text-slate-600">
                  Zet dit opzij voor de belastingdienst ({Math.round(INCOME_TAX_BUFFER * 100)}% buffer).
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{formatBedrag(incomeTaxReservation)}</p>
              <p className="mt-2 text-sm text-slate-600">
                Gebaseerd op je huidige winst: {formatBedrag(netProfit)}. Pas het percentage aan als je eigen
                belastingtarief anders uitpakt.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Laatste facturen</CardTitle>
              <p className="text-sm text-slate-600">Finale facturen van dit jaar</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{invoice.invoiceNum}</p>
                    <p className="text-sm text-slate-600">
                      {invoice.client.name} · {formatDatum(invoice.date)}
                    </p>
                    <p className="text-xs text-slate-500">{statusLabel(invoice.emailStatus)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatBedrag(invoice.lines.reduce((sum, line) => sum + calculateLineAmount(line), 0))}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Laatste uitgaven</CardTitle>
              <p className="text-sm text-slate-600">Kosten die je hebt geregistreerd</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{expense.description}</p>
                    <p className="text-sm text-slate-600">
                      {expense.category} · {formatDatum(expense.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatBedrag(Number(expense.amountExcl))}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
