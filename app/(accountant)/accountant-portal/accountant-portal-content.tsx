"use client";

import { useState, useEffect, useMemo } from "react";
import { getAccountantCompanies } from "@/app/actions/accountant-access-actions";
import { switchCompanyContext } from "@/app/actions/company-context-actions";
import { toast } from "sonner";
import { Building2, AlertCircle, Clock, FileText, Search, ExternalLink, Filter, Calendar, TrendingUp, Euro, Eye } from "lucide-react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";

type Company = {
  id: string;
  companyId: string;
  role: UserRole;
  companyName: string;
  stats: {
    unpaidInvoices: number;
    invoicesDueSoon: number;
    vatDueSoon: boolean;
    periodOmzet?: number;
    periodBTW?: number;
    status?: "ok" | "needs_review";
  };
};

type FilterPeriod = "custom" | "month" | "quarter" | "year";

export function AccountantPortalContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [switching, setSwitching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [onlyWithIssues, setOnlyWithIssues] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const router = useRouter();

  const loadCompanies = async () => {
    setLoading(true);
    const result = await getAccountantCompanies();

    if (result.success) {
      setCompanies(result.companies || []);
    } else {
      toast.error(result.message || "Fout bij het laden van bedrijven");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCompanyClick(companyId: string, viewDossier = false) {
    if (viewDossier) {
      // Navigate directly to dossier
      router.push(`/accountant-portal/dossier/${companyId}`);
      return;
    }

    setSwitching(true);
    const result = await switchCompanyContext(companyId);

    if (result.success) {
      toast.success("Bedrijfscontext gewisseld");
      router.push(`/accountant-portal/dossier/${companyId}`);
    } else {
      toast.error(result.message || "Fout bij wisselen van bedrijf");
      setSwitching(false);
    }
  }

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Search filter
      const matchesSearch = company.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Issues filter
      if (onlyWithIssues) {
        const hasIssues = 
          (company.stats.unpaidInvoices ?? 0) > 0 || 
          (company.stats.invoicesDueSoon ?? 0) > 0 || 
          company.stats.vatDueSoon || 
          company.stats.status === "needs_review";
        if (!hasIssues) return false;
      }

      return true;
    });
  }, [companies, searchQuery, onlyWithIssues]);

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.ACCOUNTANT_VIEW:
        return "Alleen lezen";
      case UserRole.ACCOUNTANT_EDIT:
        return "Bewerken";
      case UserRole.ACCOUNTANT:
        return "Accountant";
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
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek bedrijf..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              showFilters || onlyWithIssues
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:border-primary"
            }`}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Periode
                </label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="month">Huidige maand</option>
                  <option value="quarter">Huidige kwartaal</option>
                  <option value="year">Huidig jaar</option>
                  <option value="custom">Aangepast</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {filterPeriod === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Van
                    </label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tot
                    </label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}

              {/* Issues Filter */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyWithIssues}
                    onChange={(e) => setOnlyWithIssues(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Alleen met problemen</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Totaal Bedrijven</p>
              <p className="text-2xl font-semibold text-foreground">{companies.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Met Problemen</p>
              <p className="text-2xl font-semibold text-foreground">
                {companies.filter(c => 
                  (c.stats.unpaidInvoices ?? 0) > 0 || 
                  (c.stats.invoicesDueSoon ?? 0) > 0 || 
                  c.stats.vatDueSoon
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Actieve Bedrijven</p>
              <p className="text-2xl font-semibold text-foreground">{filteredCompanies.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="mb-6">
        <NotificationsPanel showUnreadOnly={false} limit={10} />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {companies.length === 0 ? (
            // No companies at all - show empty state with guidance
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Nog geen toegang tot bedrijven
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Je moet door een ZZP worden uitgenodigd via &quot;Accountant toegang&quot;.
                Na het accepteren van de uitnodiging krijg je toegang tot het bedrijfsdossier.
              </p>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-lg mx-auto">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Heb je een uitnodiging ontvangen?</strong>
                  <br />
                  Check je e-mail voor de uitnodigingslink met verificatiecode.
                </p>
              </div>
            </>
          ) : (
            // Has companies but filtered out - show filter message
            <>
              <p className="text-lg font-medium text-foreground">Geen bedrijven gevonden</p>
              <p className="text-sm text-muted-foreground mt-2">
                Probeer de filters aan te passen
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleCompanyClick(company.companyId)}
              disabled={switching}
              className="block group text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Period Omzet */}
                  {company.stats.periodOmzet !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Periode omzet
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        € {(company.stats.periodOmzet / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Period BTW */}
                  {company.stats.periodBTW !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Periode BTW
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        € {(company.stats.periodBTW / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  {company.stats.status && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {company.stats.status === "ok" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                          OK
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                          Te controleren
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompanyClick(company.companyId, true);
                    }}
                    className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Dossier bekijken
                  </button>
                </div>
              </div>
            </button>
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
