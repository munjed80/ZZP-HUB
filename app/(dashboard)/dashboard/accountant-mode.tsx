"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantContext, isAccountantRole } from "@/lib/auth/tenant";
import { normalizePeriod } from "@/lib/period.js";
import { AccountantModeBar } from "@/components/accountant/accountant-mode-bar";
import { AccountantOverview } from "@/components/accountant/accountant-overview";
import { formatBedrag } from "@/lib/utils";
import { InvoiceEmailStatus } from "@prisma/client";

type Props = { searchParams?: Promise<Record<string, string>> };

function sumInvoiceAmount(lines: { amount: any; quantity: any; price: any }[]) {
  return lines.reduce((sum, line) => sum + Number(line.amount ?? Number(line.quantity) * Number(line.price)), 0);
}

export default async function AccountantMode({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const { userId } = await requireTenantContext();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !isAccountantRole(user.role)) return null;

  const period = normalizePeriod(params);

  const [profile, invoices, expenses] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { userId }, select: { companyName: true } }),
    prisma.invoice.findMany({
      where: {
        userId,
        date: { gte: period.from, lt: period.to },
      },
      include: { lines: true },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: period.from, lt: period.to },
      },
      select: { amountExcl: true, vatRate: true, reviewStatus: true },
    }),
  ]);

  const unpaid = invoices.filter((inv) => inv.emailStatus !== InvoiceEmailStatus.BETAALD);
  const unpaidTotal = unpaid.reduce((sum, inv) => sum + sumInvoiceAmount(inv.lines), 0);

  const vatCollected = invoices.reduce((sum, inv) => {
    return (
      sum +
      inv.lines.reduce((lineSum, line) => {
        const rate = line.vatRate === "HOOG_21" ? 0.21 : line.vatRate === "LAAG_9" ? 0.09 : 0;
        const base = Number(line.amount ?? Number(line.quantity) * Number(line.price));
        return lineSum + base * rate;
      }, 0)
    );
  }, 0);

  const vatPaid = expenses.reduce((sum, exp) => {
    const rate = exp.vatRate === "HOOG_21" ? 0.21 : exp.vatRate === "LAAG_9" ? 0.09 : 0;
    return sum + Number(exp.amountExcl) * rate;
  }, 0);

  const expensesNeedingReview = expenses.filter((e) => e.reviewStatus === "needs_review" || e.reviewStatus === "pending").length;

  return (
    <div className="space-y-4">
      <AccountantModeBar companyName={profile?.companyName || "Bedrijf"} />
      <AccountantOverview
        period={period}
        vatToPay={vatCollected - vatPaid}
        unpaidCount={unpaid.length}
        unpaidTotal={unpaidTotal}
        expensesNeedingReview={expensesNeedingReview}
        canEdit={false}
        exportHref={`/api/export/invoices?format=csv&from=${period.from.toISOString()}&to=${period.to.toISOString()}`}
      />
    </div>
  );
}
