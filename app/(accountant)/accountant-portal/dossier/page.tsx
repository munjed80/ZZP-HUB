import { redirect } from "next/navigation";

export default async function AccountantDossierRedirect({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; id?: string }>;
}) {
  const { companyId, id } = await searchParams;
  const resolvedCompanyId = companyId || id;

  if (resolvedCompanyId) {
    redirect(`/accountant-portal/dossier/${resolvedCompanyId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="max-w-lg text-center space-y-4 p-6 border border-border rounded-xl bg-card">
        <h1 className="text-2xl font-semibold">Dossier niet gevonden</h1>
        <p className="text-muted-foreground">
          Er is geen bedrijf geselecteerd. Gebruik een geldige link of ga terug naar het overzicht.
        </p>
        <a
          href="/accountant-portal"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          Terug naar Accountant Portal
        </a>
      </div>
    </div>
  );
}
