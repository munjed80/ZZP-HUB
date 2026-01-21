"use client";

import Link from "next/link";

type Props = {
  companyId: string;
  companyName: string;
};

export function AccountantDossierLink({ companyId, companyName }: Props) {
  return (
    <Link
      href={`/accountant-portal/dossier/${companyId}`}
      className="rounded-lg border border-border p-4 hover:border-primary hover:shadow-sm transition"
      onClick={() => {
        console.info("ACCOUNTANT_DOSSIER_NAV_CLICK", { companyId, from: "portal" });
      }}
    >
      <p className="text-sm text-muted-foreground">Dossier</p>
      <p className="text-lg font-semibold text-foreground">{companyName}</p>
    </Link>
  );
}
