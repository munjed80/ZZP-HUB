import { AccountantInvites } from "@/app/(dashboard)/instellingen/accountant-invites";
import { fetchAccountantInvites } from "@/app/(dashboard)/instellingen/actions";
import { requireSession } from "@/lib/auth/tenant";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accountant uitnodigen",
  description: "Nodig uw accountant uit om toegang te krijgen tot uw bedrijfsgegevens.",
};

export default async function AccountantUitnodigenPage() {
  // Get the current session to check the role
  const session = await requireSession();
  
  // Only COMPANY_ADMIN and SUPERADMIN can access this page
  if (session.role !== UserRole.COMPANY_ADMIN && session.role !== UserRole.SUPERADMIN) {
    redirect("/dashboard");
  }
  
  const invites = await fetchAccountantInvites();

  return (
    <div className="min-h-screen bg-background">
      {/* Clean header - supports dark mode */}
      <div className="bg-muted border-b border-border px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Accountant uitnodigen
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Geef uw accountant toegang tot uw bedrijfsgegevens. U kunt specifieke permissies toekennen voor lezen, bewerken, exporteren en BTW.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* pb-32 provides space for mobile bottom navigation bar */}
        <AccountantInvites invites={invites} />
      </div>
    </div>
  );
}
