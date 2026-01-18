"use client";

import { useState, useEffect } from "react";
import { getAccountantCompanies } from "@/app/actions/accountant-access-actions";
import { switchCompanyContext } from "@/app/actions/company-context-actions";
import { toast } from "sonner";
import { Building2, ChevronDown } from "lucide-react";
import { UserRole } from "@prisma/client";

type Company = {
  id: string;
  companyId: string;
  role: UserRole;
  companyName: string;
};

export function CompanySwitcher({ currentCompanyName }: { currentCompanyName: string }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      const result = await getAccountantCompanies();
      if (result.success) {
        setCompanies(result.companies || []);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadCompanies();
  }, []);

  // Don't show switcher if user only has access to their own company or is not an accountant
  if (companies.length <= 1) {
    return null;
  }

  async function handleSwitch(companyId: string, companyName: string) {
    setIsOpen(false);
    setSwitching(true);
    
    const result = await switchCompanyContext(companyId);
    
    if (result.success) {
      toast.success(`Gewisseld naar ${companyName}`);
      // Reload the page to refresh all data
      window.location.reload();
    } else {
      toast.error(result.message || "Fout bij wisselen van bedrijf");
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <Building2 className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline truncate max-w-[150px]">{currentCompanyName}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border bg-card shadow-lg">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Wissel van bedrijf
              </div>
              <div className="space-y-1">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSwitch(company.companyId, company.companyName)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm text-foreground truncate">
                      {company.companyName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {company.role === UserRole.ACCOUNTANT_VIEW && "Alleen lezen"}
                      {company.role === UserRole.ACCOUNTANT_EDIT && "Bewerken"}
                      {company.role === UserRole.STAFF && "Medewerker"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
