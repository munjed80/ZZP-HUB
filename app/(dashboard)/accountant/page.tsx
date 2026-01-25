import { redirect } from "next/navigation";
import { Building2, Eye, Edit, FileDown, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveCompanyContext, getUserMemberships, type CompanyMembership } from "@/lib/auth/company-context";
import { requireSession } from "@/lib/auth/tenant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mijn Klanten",
  description: "Overzicht van alle bedrijven waar u als accountant toegang toe heeft.",
};

function PermissionBadge({ 
  icon: Icon, 
  label, 
  enabled 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  enabled: boolean 
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        enabled
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
      title={enabled ? `${label} toegang` : `Geen ${label.toLowerCase()} toegang`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function ClientCard({ membership }: { membership: CompanyMembership }) {
  const { companyId, companyName, role, permissions } = membership;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {companyName || "Onbekend bedrijf"}
              </CardTitle>
              <Badge variant="muted" className="mt-1 text-xs">
                {role === "ACCOUNTANT" ? "Accountant" : role === "STAFF" ? "Medewerker" : "Eigenaar"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permissions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Toegangsrechten
          </p>
          <div className="flex flex-wrap gap-1.5">
            <PermissionBadge icon={Eye} label="Lezen" enabled={permissions.canRead} />
            <PermissionBadge icon={Edit} label="Bewerken" enabled={permissions.canEdit} />
            <PermissionBadge icon={FileDown} label="Export" enabled={permissions.canExport} />
            <PermissionBadge icon={Receipt} label="BTW" enabled={permissions.canBTW} />
          </div>
        </div>
        
        {/* Open button */}
        <a
          href={`/switch-company?companyId=${companyId}&next=/dashboard`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open dashboard
        </a>
      </CardContent>
    </Card>
  );
}

export default async function AccountantPortalPage() {
  const session = await requireSession();
  const memberships = await getUserMemberships(session.userId);
  
  // Filter to only show ACCOUNTANT and STAFF memberships (companies the user doesn't own)
  const clientMemberships = memberships.filter(
    (m) => m.role === "ACCOUNTANT" || m.role === "STAFF"
  );
  
  // If no client memberships, redirect to dashboard
  if (clientMemberships.length === 0) {
    redirect("/dashboard");
  }
  
  // If only one client, redirect directly to switch-company
  if (clientMemberships.length === 1) {
    const onlyClient = clientMemberships[0];
    redirect(`/switch-company?companyId=${onlyClient.companyId}&next=/dashboard`);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary"></div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Mijn Klanten
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Kies een bedrijf om het dashboard te openen
        </p>
      </div>

      {/* Client companies grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {clientMemberships.map((membership) => (
          <ClientCard key={membership.id} membership={membership} />
        ))}
      </div>

      {/* Info card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Accountant toegang</h3>
              <p className="text-sm text-muted-foreground">
                U heeft toegang tot {clientMemberships.length} bedrijf
                {clientMemberships.length !== 1 ? "en" : ""}. 
                Klik op &quot;Open dashboard&quot; om de administratie van een klant te bekijken. 
                U kunt op elk moment wisselen naar een ander bedrijf via het menu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
