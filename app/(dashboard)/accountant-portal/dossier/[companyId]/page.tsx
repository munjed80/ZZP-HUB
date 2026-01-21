import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/tenant";
import { getAccessForAccountant } from "@/lib/accountant/access";

export default async function DossierPage({ params }: { params: { companyId: string } }) {
  const session = await requireSession();
  if (session.role !== "ACCOUNTANT") {
    notFound();
  }

  const access = await getAccessForAccountant(session.userId, params.companyId);
  if (!access || access.status !== "ACTIVE") {
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
