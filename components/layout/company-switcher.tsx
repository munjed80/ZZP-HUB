"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";

export function CompanySwitcher({ currentCompanyName, companies = [] }: { currentCompanyName: string; companies?: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);

  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
        {currentCompanyName}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
      >
        <Building2 className="h-4 w-4" aria-hidden />
        <span className="truncate">{currentCompanyName}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg">
          <ul className="py-2">
            {companies.map((company) => (
              <li key={company.id}>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    window.location.href = `/switch-company?companyId=${company.id}`;
                  }}
                >
                  {company.name || "Onbekend bedrijf"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
