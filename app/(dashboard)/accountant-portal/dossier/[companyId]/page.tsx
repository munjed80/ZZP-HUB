import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/tenant";
import { getAccessForAccountant } from "@/lib/accountant/access";
import { z } from "zod";

const companyIdSchema = z.string().uuid();

export default async function DossierPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  if (!companyIdSchema.safeParse(companyId).success) {
    notFound();
  }

  const session = await requireSession();
  if (session.role !== "ACCOUNTANT") {
    notFound();
  }

  const access = await getAccessForAccountant(session.userId, companyId);
  const hasAccess = !!access && access.status === "ACTIVE";
  console.info("ACCOUNTANT_DOSSIER_LOAD", {
    companyId,
    hasAccess,
    reason: hasAccess ? "access_granted" : "no_accountant_access",
  });
  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Geen toegang</h1>
        <p className="text-muted-foreground">Je hebt geen toegang tot dit dossier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Dossier</p>
        <h1 className="text-2xl font-semibold text-foreground">{access.companyId}</h1>
      </div>
      <div className="rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground">Toegang actief. Verder dossierinhoud kan hier komen.</p>
      </div>
    </div>
  );
}
