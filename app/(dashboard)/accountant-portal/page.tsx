import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/tenant";
import { listCompaniesForAccountant } from "@/lib/accountant/access";
import Link from "next/link";

export default async function AccountantPortalPage() {
  const session = await requireSession();
  if (session.role !== "ACCOUNTANT") {
    redirect("/dashboard");
  }

  const companies = await listCompaniesForAccountant(session.userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Accountant portal</p>
          <h1 className="text-2xl font-semibold text-foreground">Jouw dossiers</h1>
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="text-sm text-primary hover:underline" type="submit">
            Uitloggen
          </button>
        </form>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nog geen gekoppelde bedrijven. Vraag je klant om je toegang te geven.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.companyId}
              href={`/accountant-portal/dossier/${company.companyId}`}
              className="rounded-lg border border-border p-4 hover:border-primary hover:shadow-sm transition"
            >
              <p className="text-sm text-muted-foreground">Dossier</p>
              <p className="text-lg font-semibold text-foreground">{company.companyName}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
