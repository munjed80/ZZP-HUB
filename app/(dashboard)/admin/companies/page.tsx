import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { listCompanies } from "./actions";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== UserRole.SUPERADMIN) {
    redirect("/");
  }

  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="text-sm text-slate-600">
          Beheer company accounts. Alleen zichtbaar voor SuperAdmins.
        </p>
      </div>

      <CompaniesClient companies={companies} />
    </div>
  );
}
