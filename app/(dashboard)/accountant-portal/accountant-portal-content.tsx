"use client";

import { useState, useEffect } from "react";
import { getAccountantCompanies } from "@/app/actions/accountant-access-actions";
import { toast } from "sonner";
import { Building2, AlertCircle, Clock, FileText, Search, ExternalLink } from "lucide-react";
import { UserRole } from "@prisma/client";
import Link from "next/link";

type Company = {
  id: string;
  companyId: string;
  role: UserRole;
  companyName: string;
  stats: {
    unpaidInvoices: number;
    invoicesDueSoon: number;
    vatDueSoon: boolean;
  };
};

export function AccountantPortalContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    const result = await getAccountantCompanies();

    if (result.success) {
      setCompanies(result.companies || []);
    } else {
      toast.error(result.message || "Fout bij het laden van bedrijven");
    }

    setLoading(false);
  }

  const filteredCompanies = companies.filter((company) =>
    company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.ACCOUNTANT_VIEW:
        return "Alleen lezen";
      case UserRole.ACCOUNTANT_EDIT:
        return "Bewerken";
      case UserRole.STAFF:
        return "Medewerker";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ACCOUNTANT_VIEW:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case UserRole.ACCOUNTANT_EDIT:
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case UserRole.STAFF:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Bedrijven laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek bedrijf..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">Geen bedrijven gevonden</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery
              ? "Probeer een andere zoekopdracht"
              : "U heeft nog geen toegang tot bedrijven"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/dashboard?companyId=${company.companyId}`}
              className="block group"
            >
              <div className="h-full bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {company.companyName}
                      </h3>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(company.role)}`}
                      >
                        {getRoleLabel(company.role)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {/* Unpaid Invoices */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Openstaande facturen
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        company.stats.unpaidInvoices > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {company.stats.unpaidInvoices}
                    </span>
                  </div>

                  {/* Due Soon */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Binnenkort vervallen
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        company.stats.invoicesDueSoon > 0
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {company.stats.invoicesDueSoon}
                    </span>
                  </div>

                  {/* VAT Due */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        BTW-aangifte
                      </span>
                    </div>
                    {company.stats.vatDueSoon ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">
                        Binnenkort
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                        Op tijd
                      </span>
                    )}
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-primary font-medium group-hover:underline flex items-center gap-1">
                    Dashboard openen
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Info Box */}
      {companies.length > 0 && (
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Tip:</strong> Klik op een bedrijf om het dashboard te openen en de gegevens te
            bekijken. Uw toegangsniveau bepaalt welke acties u kunt uitvoeren.
          </p>
        </div>
      )}
    </div>
  );
}
