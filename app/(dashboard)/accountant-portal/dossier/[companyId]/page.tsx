import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/tenant";
import { getAccessForAccountant } from "@/lib/accountant/access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const companyIdSchema = z.string().uuid();
const REVIEW_STATUS_NEEDS_REVIEW = "needs_review";

async function loadDossier(companyId: string) {
  const company = await prisma.user.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      naam: true,
    },
  });

  const [invoicesCount, invoicesUnpaid, expensesCount, expensesNeedsReview] = await Promise.all([
    prisma.invoice.count({ where: { userId: companyId } }),
    prisma.invoice.count({ where: { userId: companyId, reviewStatus: REVIEW_STATUS_NEEDS_REVIEW } }),
    prisma.expense.count({ where: { userId: companyId } }),
    prisma.expense.count({ where: { userId: companyId, reviewStatus: REVIEW_STATUS_NEEDS_REVIEW } }),
  ]);

  return {
    companyName: company?.naam || companyId,
    summary: {
      invoicesCount,
      invoicesNeedsReview: invoicesUnpaid,
      expensesCount,
      expensesNeedsReview,
    },
  };
}

export default async function DossierPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  if (!companyIdSchema.safeParse(companyId).success) {
    notFound();
  }

  const session = await requireSession();
  if (session.role !== "ACCOUNTANT") {
    notFound();
  }

  console.info("ACCOUNTANT_DOSSIER_LOAD_START", {
    companyId,
    accountantUserIdMasked: session.userId.slice(-6),
  });

  const access = await getAccessForAccountant(session.userId, companyId);
  const hasAccess = !!access && access.status === "ACTIVE";
  console.info("ACCOUNTANT_DOSSIER_ACCESS_CHECK", { companyId, hasAccess });
  if (!hasAccess) {
    return (
      <div className="space-y-4 rounded-lg border border-border p-4">
        <h1 className="text-2xl font-semibold text-foreground">Geen toegang</h1>
        <p className="text-muted-foreground">Je hebt geen toegang tot dit dossier.</p>
      </div>
    );
  }

  const data = await loadDossier(companyId);

  console.info("ACCOUNTANT_DOSSIER_DATA_RESULT", {
    companyId,
    invoicesCount: data.summary.invoicesCount,
    expensesCount: data.summary.expensesCount,
  });

  const isEmpty = data.summary.invoicesCount === 0 && data.summary.expensesCount === 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Dossier</p>
        <h1 className="text-2xl font-semibold text-foreground">{data.companyName}</h1>
      </div>
      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Geen facturen of uitgaven gevonden voor dit bedrijf. Voeg eerst gegevens toe.
        </div>
      ) : (
        <div className="rounded-lg border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Facturen</span>
            <span className="text-foreground font-semibold">{data.summary.invoicesCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Facturen te reviewen</span>
            <span className="text-foreground font-semibold">{data.summary.invoicesNeedsReview}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Uitgaven</span>
            <span className="text-foreground font-semibold">{data.summary.expensesCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Uitgaven te reviewen</span>
            <span className="text-foreground font-semibold">{data.summary.expensesNeedsReview}</span>
          </div>
        </div>
      )}
    </div>
  );
}
